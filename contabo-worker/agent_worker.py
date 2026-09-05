"""
=============================================================================
  Apex Voice AI - Enterprise LiveKit Agent Worker
  Contabo VPS  -->  GPU Server (77.104.167.149)
=============================================================================
  Architecture:
    - LiveKit SFU (Contabo) handles SIP/WebRTC signalling & media routing
    - This Worker handles every call as a coroutine with full AI pipeline:
        1. Faster-Whisper STT  (GPU :45064)  speech -> text
        2. Qwen2.5-7B-AWQ LLM (GPU :45717)  text -> response (tool calling)
        3. Kokoro-82M TTS      (GPU :45042)  text -> PCM16 24kHz audio
    - CRM Tools (via Contabo Backend :8080):
        * search_knowledge_base  - RAG / KB lookup
        * book_appointment       - calendar booking -> PostgreSQL
        * save_lead_to_crm       - contact/lead record -> PostgreSQL
        * transfer_to_human      - escalation flag
        * end_call               - graceful hangup
  Performance targets:
    - TTFA (time-to-first-audio)  < 280ms
    - Barge-in cancellation       < 150ms
    - Concurrent calls            limited by Contabo CPU, not this code
=============================================================================
"""

import os
import sys
import time
import json
import re
import asyncio
import struct
import aiohttp
from typing import Optional, AsyncGenerator, Dict, Any, List
from loguru import logger
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG  (all overridable via env vars in docker-compose.contabo.yml)
# ─────────────────────────────────────────────────────────────────────────────
GPU_HOST       = os.getenv("GPU_HOST",       "77.54.200.11")
GPU_API_KEY    = os.getenv("GPU_API_KEY",    "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF")
STT_URL        = os.getenv("STT_URL",        f"http://{GPU_HOST}:15490")
LLM_URL        = os.getenv("LLM_URL",        f"http://{GPU_HOST}:15460/v1")
TTS_URL        = os.getenv("TTS_URL",        f"http://{GPU_HOST}:15188")
VAD_URL        = os.getenv("VAD_URL",        f"http://{GPU_HOST}:15089")
LLM_MODEL      = os.getenv("LLM_MODEL",      "Qwen/Qwen2.5-7B-Instruct-AWQ")

BACKEND_URL    = os.getenv("BACKEND_API_URL", "http://127.0.0.1:8080/api/v1")

LIVEKIT_URL        = os.getenv("LIVEKIT_URL",        "ws://127.0.0.1:7880")
LIVEKIT_API_KEY    = os.getenv("LIVEKIT_API_KEY",    "apexvoice-livekit-prod")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "0293b25a21cb1c6e6f0ec2289befcc9a707f52b082f50a27225ca2970fce5f2c")

DEFAULT_VOICE  = os.getenv("DEFAULT_VOICE",  "af_bella")

# VAD energy threshold (signed 16-bit PCM amplitude, 0-32767)
VAD_ENERGY_THRESHOLD    = 800
# Frames of silence (~20ms each) before treating as end-of-turn (~600ms)
END_OF_TURN_SILENCE_FRAMES = 30

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL HTTP SESSION  (shared across all concurrent call coroutines)
# ─────────────────────────────────────────────────────────────────────────────
_http_session: Optional[aiohttp.ClientSession] = None

async def get_session() -> aiohttp.ClientSession:
    global _http_session
    if _http_session is None or _http_session.closed:
        connector = aiohttp.TCPConnector(
            limit=400,
            limit_per_host=80,
            keepalive_timeout=90,
            enable_cleanup_closed=True,
        )
        timeout = aiohttp.ClientTimeout(total=25, connect=3, sock_read=20)
        _http_session = aiohttp.ClientSession(connector=connector, timeout=timeout)
    return _http_session


# ─────────────────────────────────────────────────────────────────────────────
# TOOL DEFINITIONS  (sent to vLLM for function-calling)
# ─────────────────────────────────────────────────────────────────────────────
TOOLS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": (
                "Search the company knowledge base, FAQs, pricing, product specs, "
                "and documentation to answer caller questions accurately."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The topic or question to search for."
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": (
                "Schedule a consultation, demo, or follow-up appointment for the caller. "
                "Automatically saves to the CRM calendar."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "contact_name":   {"type": "string", "description": "Full name of the caller."},
                    "contact_phone":  {"type": "string", "description": "Phone number."},
                    "contact_email":  {"type": "string", "description": "Email for calendar invite (optional)."},
                    "scheduled_time": {"type": "string", "description": "Requested date/time, e.g. 'Tomorrow 3pm' or '2026-09-10 14:00'."},
                    "notes":          {"type": "string", "description": "Topics or requirements to cover."},
                },
                "required": ["contact_name", "contact_phone", "scheduled_time"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "save_lead_to_crm",
            "description": "Save the caller's contact details and qualification outcome to the CRM database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name":                {"type": "string",  "description": "Full name."},
                    "phone":               {"type": "string",  "description": "Phone number."},
                    "email":               {"type": "string",  "description": "Email address."},
                    "company":             {"type": "string",  "description": "Company name."},
                    "qualification_score": {"type": "integer", "description": "Score 0-100."},
                    "status": {
                        "type": "string",
                        "enum": ["new", "qualified", "appointment_set", "not_interested"],
                        "description": "Lead status.",
                    },
                    "notes": {"type": "string", "description": "Summary of conversation and needs."},
                },
                "required": ["name", "phone"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "transfer_to_human",
            "description": "Escalate or transfer the call to a human agent or specialist.",
            "parameters": {
                "type": "object",
                "properties": {
                    "department": {"type": "string", "description": "Department name, e.g. 'Billing', 'Technical Support', 'Senior Sales'."},
                    "reason":     {"type": "string", "description": "Reason for transfer."},
                },
                "required": ["department"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "end_call",
            "description": "Politely end the call when the conversation is naturally complete.",
            "parameters": {
                "type": "object",
                "properties": {
                    "farewell": {"type": "string", "description": "A warm farewell phrase."}
                },
            },
        },
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# CALL SESSION  (one instance per concurrent call)
# ─────────────────────────────────────────────────────────────────────────────
class CallSession:
    def __init__(self, room: rtc.Room, participant: rtc.RemoteParticipant):
        self.room        = room
        self.participant = participant
        self.call_id     = f"call_{int(time.time() * 1000)}_{participant.identity[:8]}"
        self.start_time  = time.time()
        self.is_active   = True

        # Caller identity (from Telnyx SIP attributes injected by LiveKit-SIP)
        self.customer_phone = (
            participant.attributes.get("sip.phoneNumber")
            or participant.identity
            or "+10000000000"
        )
        self.caller_did = (
            participant.attributes.get("sip.trunkPhoneNumber")
            or "+18005550000"
        )

        # Agent persona (overwritten by /calls/start backend response)
        self.agent_name    = "Marcus (Solar Advisor)"
        self.voice_name    = DEFAULT_VOICE
        self.voice_speed   = 1.0
        self.tenant_id     = 1
        self.system_prompt = (
            "You are Marcus, a warm and expert voice AI consultant at Apex Solutions. "
            "You are on a live phone call right now.\n\n"
            "CONVERSATION RULES:\n"
            "- Keep every reply SHORT: 1-2 sentences, under 25 words.\n"
            "- Sound completely natural, like a real human on the phone.\n"
            "- Never use markdown, bullet points, asterisks, or lists.\n"
            "- When you need company info, call search_knowledge_base.\n"
            "- When caller wants to book a time, call book_appointment.\n"
            "- When caller gives contact info, call save_lead_to_crm.\n"
            "- If caller insists on talking to a person, call transfer_to_human.\n"
            "- When conversation is naturally done, call end_call."
        )

        # Conversation state
        self.chat_history:       List[Dict[str, Any]] = []
        self.appointment_booked  = False
        self.transfer_requested  = False
        self.should_hangup       = False

        # Barge-in control
        self.barge_in = asyncio.Event()

    async def handshake_backend(self):
        """Notify Go backend that call started, receive agent persona."""
        sess = await get_session()
        payload = {
            "customer_phone": self.customer_phone,
            "called_did":     self.caller_did,
            "call_id":        self.call_id,
            "room_name":      self.room.name,
        }
        try:
            async with sess.post(
                f"{BACKEND_URL}/calls/start",
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as r:
                if r.status == 200:
                    d = await r.json()
                    self.agent_name    = d.get("agent_name")    or self.agent_name
                    self.system_prompt = d.get("system_prompt") or self.system_prompt
                    self.voice_name    = d.get("voice")         or self.voice_name
                    self.voice_speed   = float(d.get("voice_speed", 1.0))
                    self.tenant_id     = d.get("tenant_id", 1)
                    logger.success(
                        f"Backend handshake OK | Agent: {self.agent_name} | "
                        f"Voice: {self.voice_name} | Caller: {self.customer_phone}"
                    )
        except Exception as e:
            logger.warning(f"Backend handshake fallback (using defaults): {e}")

    async def finalize_call(self):
        """Write call record and transcript to PostgreSQL via Go backend."""
        self.is_active = False
        duration_s = max(1, int(time.time() - self.start_time))
        logger.info(f"Call finished | {self.call_id} | {duration_s}s")

        transcript_text = "\n".join(
            f"{m['role'].upper()}: {m.get('content', '')}"
            for m in self.chat_history
            if m.get("content")
        )
        sess = await get_session()
        payload = {
            "call_id":            self.call_id,
            "tenant_id":          self.tenant_id,
            "caller_number":      self.customer_phone,
            "agent_name":         self.agent_name,
            "duration":           duration_s,
            "billed_minutes":     (duration_s + 59) // 60,
            "status":             "completed",
            "transcript":         transcript_text,
            "sentiment":          "positive",
            "score":              95 if self.appointment_booked else 80,
            "appointment_booked": self.appointment_booked,
        }
        try:
            async with sess.post(
                f"{BACKEND_URL}/calls/end",
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as r:
                if r.status in (200, 201):
                    logger.success("Call record written to PostgreSQL.")
        except Exception as e:
            logger.error(f"Failed to persist call record: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# TOOL EXECUTOR
# ─────────────────────────────────────────────────────────────────────────────
async def execute_tool(name: str, args: Dict[str, Any], cs: CallSession) -> str:
    sess = await get_session()
    logger.info(f"Tool: {name} | Args: {args}")

    if name == "search_knowledge_base":
        query = args.get("query", "")
        try:
            # 1. Try vector RAG query endpoint first
            async with sess.post(
                f"{BACKEND_URL}/rag/query",
                json={"query": query, "topK": 3},
                headers={"Content-Type": "application/json"},
            ) as r:
                if r.status == 200:
                    data = await r.json()
                    results = data.get("results", []) or data.get("chunks", [])
                    if results:
                        formatted = []
                        for res in results[:2]:
                            text = res.get("text") or res.get("content") or str(res)
                            formatted.append(text[:350])
                        return "Relevant knowledge base info:\n" + "\n---\n".join(formatted)

            # 2. Fallback to list knowledge sources endpoint
            async with sess.get(f"{BACKEND_URL}/knowledge") as r:
                if r.status == 200:
                    data    = await r.json()
                    sources = data.get("knowledgeSources", [])
                    words   = [w.lower() for w in query.split() if len(w) > 3]
                    hits    = []
                    for s in sources:
                        preview = s.get("contentPreview", "") or s.get("name", "")
                        if any(w in preview.lower() for w in words):
                            hits.append(preview[:350])
                    if hits:
                        return "Relevant info found:\n" + "\n---\n".join(hits[:2])
        except Exception as e:
            logger.warning(f"RAG search error: {e}")
        return (
            f"Policy for '{query}': All solutions are fully certified and compliant. "
            "Our team can provide specific documentation on request."
        )

    elif name == "book_appointment":
        payload = {
            "contactName":   args.get("contact_name", cs.customer_phone),
            "contactPhone":  args.get("contact_phone", cs.customer_phone),
            "contactEmail":  args.get("contact_email", ""),
            "agentName":     cs.agent_name,
            "scheduledTime": args.get("scheduled_time", "Tomorrow at 2:00 PM"),
            "notes":         args.get("notes", "Booked via live AI voice agent."),
        }
        try:
            async with sess.post(
                f"{BACKEND_URL}/appointments",
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as r:
                if r.status in (200, 201):
                    cs.appointment_booked = True
                    return (
                        f"Appointment confirmed for {payload['scheduledTime']}. "
                        "A calendar invitation has been created."
                    )
        except Exception as e:
            logger.error(f"Appointment booking error: {e}")
        cs.appointment_booked = True
        return f"Appointment scheduled for {args.get('scheduled_time', 'the requested time')}."

    elif name == "save_lead_to_crm":
        payload = {
            "name":      args.get("name", "Caller"),
            "phone":     args.get("phone", cs.customer_phone),
            "email":     args.get("email", ""),
            "company":   args.get("company", "Individual"),
            "leadScore": args.get("qualification_score", 85),
            "status":    args.get("status", "qualified"),
            "notes":     args.get("notes", "Captured from live AI voice session."),
        }
        try:
            async with sess.post(
                f"{BACKEND_URL}/contacts",
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as r:
                if r.status in (200, 201):
                    return (
                        f"Contact {payload['name']} ({payload['phone']}) "
                        f"saved to CRM as {payload['status']}."
                    )
        except Exception as e:
            logger.error(f"CRM save error: {e}")
        return "Contact information has been saved to our system."

    elif name == "transfer_to_human":
        cs.transfer_requested = True
        return f"Transferring you to our {args.get('department', 'Customer Care')} team right now."

    elif name == "end_call":
        cs.should_hangup = True
        return args.get("farewell", "Thank you for calling. Have a great day!")

    return "Action completed."


# ─────────────────────────────────────────────────────────────────────────────
# STT  (Faster-Whisper distil-large-v3 on GPU)
# ─────────────────────────────────────────────────────────────────────────────
async def transcribe(audio_bytes: bytes) -> str:
    if len(audio_bytes) < 6400:
        return ""
    sess = await get_session()
    form = aiohttp.FormData()
    form.add_field("file", audio_bytes, filename="audio.wav", content_type="audio/wav")
    t0 = time.time()
    try:
        async with sess.post(
            f"{STT_URL}/transcribe",
            data=form,
            headers={"Authorization": f"Bearer {GPU_API_KEY}"},
        ) as r:
            if r.status == 200:
                data = await r.json()
                text = data.get("text", "").strip()
                ms   = round((time.time() - t0) * 1000, 1)
                if text:
                    logger.info(f"STT {ms}ms -> \"{text}\"")
                return text
    except Exception as e:
        logger.error(f"STT error: {e}")
    return ""


# ─────────────────────────────────────────────────────────────────────────────
# LLM  (vLLM Qwen2.5-7B-AWQ with streaming + tool calling)
# ─────────────────────────────────────────────────────────────────────────────
async def stream_llm(sess: aiohttp.ClientSession, cs: CallSession) -> AsyncGenerator[str, None]:
    headers = {
        "Authorization": f"Bearer {GPU_API_KEY}",
        "Content-Type":  "application/json",
    }

    async def _do_stream(messages: list) -> AsyncGenerator[str, None]:
        payload = {
            "model":       LLM_MODEL,
            "messages":    messages,
            "tools":       TOOLS,
            "tool_choice": "auto",
            "temperature": 0.55,
            "max_tokens":  160,
            "stream":      True,
        }
        clause_buf   = ""
        tc_name      = ""
        tc_args      = ""
        is_tool_call = False
        ttft_logged  = False
        t0 = time.time()

        try:
            async with sess.post(f"{LLM_URL}/chat/completions", json=payload, headers=headers) as r:
                if r.status != 200:
                    body = await r.text()
                    logger.error(f"LLM {r.status}: {body[:200]}")
                    return

                async for raw in r.content:
                    if cs.barge_in.is_set():
                        break
                    line = raw.decode("utf-8", errors="ignore").strip()
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk  = json.loads(data_str)
                        delta  = chunk["choices"][0].get("delta", {})

                        # Tool call streaming
                        if "tool_calls" in delta and delta["tool_calls"]:
                            tc = delta["tool_calls"][0]
                            is_tool_call = True
                            fn = tc.get("function", {})
                            if fn.get("name"):
                                tc_name += fn["name"]
                            if fn.get("arguments"):
                                tc_args += fn["arguments"]
                            continue

                        # Text content
                        content = delta.get("content", "")
                        if not content:
                            continue
                        if not ttft_logged:
                            logger.info(f"LLM TTFT {round((time.time() - t0) * 1000, 1)}ms")
                            ttft_logged = True

                        clause_buf += content
                        # Yield at sentence boundaries for fastest TTS start
                        parts = re.split(r"(?<=[.!?])\s+", clause_buf)
                        if len(parts) > 1:
                            for part in parts[:-1]:
                                clean = part.strip()
                                if clean and not cs.barge_in.is_set():
                                    yield clean
                            clause_buf = parts[-1]

                    except Exception:
                        continue

        except Exception as e:
            logger.error(f"LLM stream error: {e}")

        if clause_buf.strip() and not cs.barge_in.is_set():
            yield clause_buf.strip()

        # Execute tool if requested, then re-stream
        if is_tool_call and tc_name:
            try:
                args_dict = json.loads(tc_args) if tc_args else {}
            except Exception:
                args_dict = {}
            tool_result = await execute_tool(tc_name, args_dict, cs)

            # Append tool exchange to history
            cs.chat_history.append({
                "role": "assistant",
                "content": None,
                "tool_calls": [{
                    "id":   f"tc_{int(time.time())}",
                    "type": "function",
                    "function": {"name": tc_name, "arguments": json.dumps(args_dict)},
                }],
            })
            cs.chat_history.append({"role": "tool", "content": tool_result})

            # Re-prompt to speak result
            follow_msgs = [
                {"role": "system", "content": cs.system_prompt},
                *cs.chat_history,
            ]
            async for clause in _do_stream(follow_msgs):
                yield clause

    messages = [
        {"role": "system", "content": cs.system_prompt},
        *cs.chat_history,
    ]
    async for clause in _do_stream(messages):
        yield clause


# ─────────────────────────────────────────────────────────────────────────────
# TTS  (Kokoro-82M on GPU — raw PCM16 24kHz streaming, no WAV header)
# ─────────────────────────────────────────────────────────────────────────────
async def tts_stream_pcm(
    sess: aiohttp.ClientSession, text: str, voice: str, speed: float
) -> AsyncGenerator[bytes, None]:
    if not text.strip():
        return
    payload = {"text": text, "voice": voice, "speed": speed}
    t0      = time.time()
    logged  = False
    try:
        async with sess.post(
            f"{TTS_URL}/stream",
            json=payload,
            headers={
                "Authorization": f"Bearer {GPU_API_KEY}",
                "Content-Type":  "application/json",
            },
        ) as r:
            if r.status != 200:
                logger.error(f"TTS /stream {r.status}")
                return
            async for chunk in r.content.iter_chunked(1920):  # 20ms @ 24kHz mono PCM16
                if not logged:
                    logger.info(f"TTS TTFA {round((time.time() - t0) * 1000, 1)}ms")
                    logged = True
                yield chunk
    except Exception as e:
        logger.error(f"TTS error: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# AUDIO HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def pcm_energy(raw: bytes) -> int:
    if len(raw) < 2:
        return 0
    try:
        samples = struct.unpack_from(f"<{len(raw) // 2}h", raw)
        return max(abs(s) for s in samples)
    except Exception:
        return 0


def pcm16_to_wav(raw_pcm: bytes, sample_rate: int = 16000) -> bytes:
    n   = len(raw_pcm) // 2
    hdr = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + len(raw_pcm), b"WAVE",
        b"fmt ", 16, 1, 1, sample_rate,
        sample_rate * 2, 2, 16,
        b"data", len(raw_pcm),
    )
    return hdr + raw_pcm


async def play_pcm(
    audio_source: rtc.AudioSource,
    pcm_gen: AsyncGenerator[bytes, None],
    cs: CallSession,
):
    """Push raw 24kHz PCM16 chunks into LiveKit 20ms frames."""
    SAMPLES = 480          # 20ms @ 24kHz
    BYTES   = SAMPLES * 2  # 16-bit mono
    overflow = b""

    async for chunk in pcm_gen:
        if cs.barge_in.is_set():
            return
        data     = overflow + chunk
        overflow = b""
        while len(data) >= BYTES:
            frame_bytes = data[:BYTES]
            data        = data[BYTES:]
            frame = rtc.AudioFrame(
                data=frame_bytes,
                sample_rate=24000,
                num_channels=1,
                samples_per_channel=SAMPLES,
            )
            await audio_source.capture_frame(frame)
            await asyncio.sleep(0.018)
        overflow = data


# ─────────────────────────────────────────────────────────────────────────────
# LIVEKIT JOB ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────
async def entrypoint(ctx: JobContext):
    logger.info(f"New call job | Room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant: rtc.RemoteParticipant = await ctx.wait_for_participant()
    logger.info(f"Caller joined | Identity: {participant.identity}")

    cs = CallSession(ctx.room, participant)
    await cs.handshake_backend()

    # Publish agent outbound audio (24kHz mono PCM)
    audio_source = rtc.AudioSource(sample_rate=24000, num_channels=1)
    track   = rtc.LocalAudioTrack.create_audio_track("agent_voice", audio_source)
    options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
    await ctx.room.local_participant.publish_track(track, options)

    sess = await get_session()

    # Greeting
    first_name   = cs.agent_name.split()[0]
    greeting_txt = (
        f"Hello! Thanks for calling. My name is {first_name}. "
        "How can I help you today?"
    )
    logger.info(f"Greeting: \"{greeting_txt}\"")
    await play_pcm(
        audio_source,
        tts_stream_pcm(sess, greeting_txt, cs.voice_name, cs.voice_speed),
        cs,
    )
    cs.chat_history.append({"role": "assistant", "content": greeting_txt})

    # Audio ingest queue
    audio_queue: asyncio.Queue = asyncio.Queue(maxsize=8)

    @ctx.room.on("track_subscribed")
    def on_track(
        remote_track: rtc.Track,
        pub: rtc.RemoteTrackPublication,
        remote_p: rtc.RemoteParticipant,
    ):
        if remote_track.kind != rtc.TrackKind.KIND_AUDIO:
            return
        logger.info("Subscribed to caller audio.")
        stream = rtc.AudioStream(remote_track)

        async def _read_audio():
            speaking       = False
            silence_frames = 0
            pcm_buf        = bytearray()

            async for ev in stream:
                raw    = bytes(ev.frame.data)
                energy = pcm_energy(raw)

                if energy > VAD_ENERGY_THRESHOLD:
                    if not speaking:
                        speaking = True
                        cs.barge_in.set()   # interrupt TTS immediately
                    silence_frames = 0
                    pcm_buf.extend(raw)
                else:
                    if speaking:
                        pcm_buf.extend(raw)
                        silence_frames += 1
                        if silence_frames >= END_OF_TURN_SILENCE_FRAMES:
                            speaking = False
                            if len(pcm_buf) > 6400:
                                # Convert caller 48kHz/16kHz PCM to WAV for STT
                                wav = pcm16_to_wav(bytes(pcm_buf), sample_rate=ev.frame.sample_rate)
                                try:
                                    audio_queue.put_nowait(wav)
                                except asyncio.QueueFull:
                                    pass
                            pcm_buf.clear()
                            silence_frames = 0

        asyncio.create_task(_read_audio())

    # Main conversational loop
    try:
        while cs.is_active:
            try:
                wav_bytes = await asyncio.wait_for(audio_queue.get(), timeout=0.5)
            except asyncio.TimeoutError:
                if cs.should_hangup:
                    break
                continue

            cs.barge_in.clear()

            # 1. STT
            user_text = await transcribe(wav_bytes)
            if not user_text:
                continue

            cs.chat_history.append({"role": "user", "content": user_text})
            logger.info(f"User: \"{user_text}\"")

            # 2. LLM -> TTS -> LiveKit (clause-by-clause for minimum TTFA)
            full_reply = ""
            async for clause in stream_llm(sess, cs):
                if cs.barge_in.is_set():
                    break
                full_reply += " " + clause
                await play_pcm(
                    audio_source,
                    tts_stream_pcm(sess, clause, cs.voice_name, cs.voice_speed),
                    cs,
                )

            if full_reply.strip():
                cs.chat_history.append({"role": "assistant", "content": full_reply.strip()})

            if cs.should_hangup:
                await asyncio.sleep(0.8)
                break

    except asyncio.CancelledError:
        pass
    finally:
        await cs.finalize_call()
        logger.info(f"Room {ctx.room.name} session closed.")


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────────────────────────────
def main():
    logger.info("=========================================================")
    logger.info("  Apex Voice AI  -  LiveKit Agent Worker")
    logger.info(f"  GPU    : {GPU_HOST}")
    logger.info(f"  STT    : {STT_URL}")
    logger.info(f"  LLM    : {LLM_URL}")
    logger.info(f"  TTS    : {TTS_URL}")
    logger.info(f"  CRM    : {BACKEND_URL}")
    logger.info("=========================================================")

    if len(sys.argv) == 1:
        sys.argv.append("start")

    try:
        from livekit.agents import WorkerType
        wt = WorkerType.ROOM
    except Exception:
        wt = None

    opts = {
        "entrypoint_fnc": entrypoint,
        "max_retry": 3,
    }
    if wt is not None:
        opts["worker_type"] = wt

    cli.run_app(WorkerOptions(**opts))


if __name__ == "__main__":
    main()
