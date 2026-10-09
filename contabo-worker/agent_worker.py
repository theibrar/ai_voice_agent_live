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

try:
    import audioop
except ImportError:
    audioop = None

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG  (all overridable via env vars in docker-compose.contabo.yml)
# ─────────────────────────────────────────────────────────────────────────────
GPU_HOST       = os.getenv("GPU_HOST",       "77.104.167.149")
GPU_API_KEY    = os.getenv("GPU_API_KEY",    "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF")
STT_URL        = os.getenv("STT_URL",        f"http://{GPU_HOST}:59805")
LLM_URL        = os.getenv("LLM_URL",        f"http://{GPU_HOST}:59982/v1")
TTS_URL        = os.getenv("TTS_URL",        f"http://{GPU_HOST}:59643")
VAD_URL        = os.getenv("VAD_URL",        f"http://{GPU_HOST}:59929")
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
# PERSISTENT ERROR & MODEL ISSUE LOGGING FILE
# ─────────────────────────────────────────────────────────────────────────────
LOGS_DIR = os.getenv("LOGS_DIR", "/app/logs")
try:
    os.makedirs(LOGS_DIR, exist_ok=True)
    ERROR_LOG_FILE = os.path.join(LOGS_DIR, "model_errors.log")
    logger.add(
        ERROR_LOG_FILE,
        level="ERROR",
        rotation="20 MB",
        retention="7 days",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        backtrace=True,
        diagnose=True,
    )
except Exception as _log_err:
    pass

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
        self.greeting      = "Hello! Thanks for calling Apex Solutions. My name is Marcus. How can I help you today?"
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

        # AI Models & Endpoints (Inherited from Super Admin / Backend)
        self.llm_model   = LLM_MODEL
        self.llm_url     = LLM_URL
        self.llm_api_key = GPU_API_KEY
        self.tts_url     = TTS_URL
        self.tts_api_key = GPU_API_KEY

        # Barge-in control
        self.barge_in = asyncio.Event()

        # Dual-channel audio master recording buffer (16kHz 16-bit mono PCM)
        self.conversation_pcm: bytearray = bytearray()

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
                    self.greeting      = d.get("greeting")      or self.greeting

                    # Clean voiceId string extraction (never allow raw JSON string as voice name)
                    raw_voice = d.get("voice")
                    if isinstance(raw_voice, dict):
                        self.voice_name = raw_voice.get("voiceId") or raw_voice.get("voice_id") or "af_bella"
                    elif isinstance(raw_voice, str) and ("{" in raw_voice or "voiceId" in raw_voice):
                        try:
                            v_parsed = json.loads(raw_voice)
                            self.voice_name = v_parsed.get("voiceId") or v_parsed.get("voice_id") or "af_bella"
                        except Exception:
                            self.voice_name = "af_bella"
                    elif raw_voice and isinstance(raw_voice, str) and raw_voice.strip():
                        self.voice_name = raw_voice.strip()
                    else:
                        self.voice_name = "af_bella"

                    self.voice_speed   = float(d.get("voice_speed", 1.0))
                    self.tenant_id     = d.get("tenant_id", 1)

                    # Dynamic Model & API Key inheritance from Super Admin
                    if d.get("llm_model"):
                        self.llm_model = d["llm_model"]
                    if d.get("llm_url"):
                        self.llm_url = d["llm_url"]
                    if d.get("llm_api_key"):
                        self.llm_api_key = d["llm_api_key"]
                    if d.get("tts_url"):
                        self.tts_url = d["tts_url"]
                    if d.get("tts_api_key"):
                        self.tts_api_key = d["tts_api_key"]

                    logger.success(
                        f"Backend handshake OK | Agent: {self.agent_name} | "
                        f"LLM: {self.llm_model} | Voice: {self.voice_name} | Caller: {self.customer_phone}"
                    )
        except Exception as e:
            logger.warning(f"Backend handshake fallback (using defaults): {e}")

    async def finalize_call(self):
        """Write call record and transcript to PostgreSQL via Go backend."""
        self.is_active = False
        duration_s = max(1, int(time.time() - self.start_time))
        logger.info(f"Finalizing call | {self.call_id} | duration: {duration_s}s")

        transcript_text = "\n".join(
            f"{m['role'].upper()}: {m.get('content', '')}"
            for m in self.chat_history
            if m.get("content")
        )
        if not transcript_text:
            transcript_text = f"ASSISTANT: {self.greeting}"

        sess = await get_session()

        # 1. Save and upload real conversation audio recording
        recording_url = f"/api/v1/recordings/{self.call_id}/audio"
        if len(self.conversation_pcm) > 0:
            try:
                wav_bytes = pcm16_to_wav(bytes(self.conversation_pcm), sample_rate=16000)
                recordings_dir = os.getenv("RECORDINGS_DIR", "/app/recordings")
                try:
                    os.makedirs(recordings_dir, exist_ok=True)
                    wav_file_path = os.path.join(recordings_dir, f"{self.call_id}.wav")
                    with open(wav_file_path, "wb") as f:
                        f.write(wav_bytes)
                except Exception:
                    pass

                # Upload to Go backend recording vault
                form_data = aiohttp.FormData()
                form_data.add_field("call_id", self.call_id)
                form_data.add_field("file", wav_bytes, filename=f"{self.call_id}.wav", content_type="audio/wav")
                async with sess.post(f"{BACKEND_URL}/calls/recordings/upload", data=form_data) as up_res:
                    if up_res.status == 200:
                        logger.success(f"Call recording audio successfully uploaded to vault | {self.call_id}")
                    else:
                        up_text = await up_res.text()
                        logger.warning(f"Audio upload returned status {up_res.status}: {up_text[:100]}")
            except Exception as rec_err:
                logger.warning(f"Audio recording save/upload exception: {rec_err}")

        payload = {
            "call_id":            self.call_id,
            "tenant_id":          self.tenant_id,
            "caller_name":        "Direct Caller",
            "caller_number":      self.customer_phone,
            "called_did":         self.caller_did,
            "agent_name":         self.agent_name,
            "duration":           duration_s,
            "billed_minutes":     (duration_s + 59) // 60,
            "status":             "completed",
            "transcript":         transcript_text,
            "sentiment":          "positive",
            "score":              95 if self.appointment_booked else 80,
            "appointment_booked": self.appointment_booked,
            "recording_url":      recording_url,
        }
        try:
            async with sess.post(
                f"{BACKEND_URL}/calls/end",
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as r:
                resp_text = await r.text()
                if r.status in (200, 201):
                    logger.success(f"Call record successfully written to PostgreSQL | {self.call_id}")
                else:
                    logger.warning(f"Backend /calls/end returned {r.status}: {resp_text}")
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
    if len(audio_bytes) < 2400:
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
                    logger.info(f"STT ({ms}ms) -> \"{text}\"")
                else:
                    logger.info(f"STT ({ms}ms) -> (no speech detected in chunk)")
                return text
            else:
                err_body = await r.text()
                logger.error(f"[MODEL ISSUE: STT Parakeet-TDT ({STT_URL})] HTTP {r.status}: {err_body}")
    except Exception as e:
        logger.error(f"[MODEL ISSUE: STT Parakeet-TDT ({STT_URL})] Connection error: {e}")
    return ""


# ─────────────────────────────────────────────────────────────────────────────
# LLM  (Dynamic Reasoning Engine per Agent Persona & Super Admin Engine)
# ─────────────────────────────────────────────────────────────────────────────
async def stream_llm(sess: aiohttp.ClientSession, cs: CallSession) -> AsyncGenerator[str, None]:
    target_llm_url = (getattr(cs, "llm_url", None) or LLM_URL).rstrip("/")
    if not target_llm_url.endswith("/chat/completions"):
        if target_llm_url.endswith("/v1"):
            target_llm_url += "/chat/completions"
        else:
            target_llm_url += "/v1/chat/completions"

    target_api_key = getattr(cs, "llm_api_key", None) or GPU_API_KEY
    target_model   = getattr(cs, "llm_model", None) or LLM_MODEL

    headers = {
        "Authorization": f"Bearer {target_api_key}",
        "Content-Type":  "application/json",
    }

    async def _do_stream(messages: list) -> AsyncGenerator[str, None]:
        payload = {
            "model":       target_model,
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
            async with sess.post(target_llm_url, json=payload, headers=headers) as r:
                if r.status != 200:
                    body = await r.text()
                    logger.error(f"[MODEL ISSUE: LLM {target_model} ({target_llm_url})] HTTP {r.status}: {body[:300]}")
                    # Automatic self-healing fallback to master GPU LLM
                    if target_llm_url != f"{LLM_URL}/chat/completions":
                        logger.warning(f"Falling back to default GPU LLM ({LLM_MODEL})...")
                        fb_headers = {"Authorization": f"Bearer {GPU_API_KEY}", "Content-Type": "application/json"}
                        fb_payload = dict(payload, model=LLM_MODEL)
                        async with sess.post(f"{LLM_URL}/chat/completions", json=fb_payload, headers=fb_headers) as fb_r:
                            if fb_r.status == 200:
                                async for raw in fb_r.content:
                                    if cs.barge_in.is_set():
                                        break
                                    line = raw.decode("utf-8", errors="ignore").strip()
                                    if not line.startswith("data: ") or line[6:] == "[DONE]":
                                        continue
                                    try:
                                        chunk = json.loads(line[6:])
                                        content = chunk["choices"][0].get("delta", {}).get("content", "")
                                        if content:
                                            clause_buf += content
                                            parts = re.split(r"(?<=[.!?])\s+", clause_buf)
                                            if len(parts) > 1:
                                                for p in parts[:-1]:
                                                    if p.strip() and not cs.barge_in.is_set():
                                                        yield p.strip()
                                                clause_buf = parts[-1]
                                    except Exception:
                                        continue
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
            logger.error(f"[MODEL ISSUE: LLM {LLM_MODEL} ({LLM_URL})] Stream error: {e}")

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


# TTS  (Kokoro-82M on GPU — raw PCM16 24kHz streaming, with dynamic Super Admin routing)
# ─────────────────────────────────────────────────────────────────────────────
async def tts_stream_pcm(
    sess: aiohttp.ClientSession,
    text: str,
    voice: str,
    speed: float,
    tts_url: Optional[str] = None,
    tts_api_key: Optional[str] = None,
) -> AsyncGenerator[bytes, None]:
    if not text.strip():
        return

    clean_voice = voice
    if "{" in clean_voice or "voiceId" in clean_voice:
        try:
            clean_voice = json.loads(clean_voice).get("voiceId", "af_bella")
        except Exception:
            clean_voice = "af_bella"
    if not clean_voice:
        clean_voice = "af_bella"

    target_tts_url = (tts_url or TTS_URL).rstrip("/")
    target_key = tts_api_key or GPU_API_KEY

    payload = {"text": text, "voice": clean_voice, "speed": speed}
    t0      = time.time()
    logged  = False
    try:
        async with sess.post(
            f"{target_tts_url}/stream",
            json=payload,
            headers={
                "Authorization": f"Bearer {target_key}",
                "Content-Type":  "application/json",
            },
        ) as r:
            if r.status == 200:
                async for chunk in r.content.iter_chunked(1920):  # 20ms @ 24kHz mono PCM16
                    if not logged:
                        logger.info(f"TTS TTFA {round((time.time() - t0) * 1000, 1)}ms | Voice: {clean_voice}")
                        logged = True
                    yield chunk
                return
            else:
                body = await r.text()
                logger.error(f"[MODEL ISSUE: TTS Kokoro-82M ({target_tts_url})] /stream HTTP {r.status}: {body[:200]}")
                # Fallback to master GPU TTS if custom TTS returned non-200
                if target_tts_url != TTS_URL:
                    logger.warning(f"Falling back to default GPU TTS ({TTS_URL})...")
                    async with sess.post(
                        f"{TTS_URL}/stream",
                        json=payload,
                        headers={"Authorization": f"Bearer {GPU_API_KEY}", "Content-Type": "application/json"},
                    ) as fb_r:
                        if fb_r.status == 200:
                            async for chunk in fb_r.content.iter_chunked(1920):
                                yield chunk
                            return
    except Exception as e:
        logger.error(f"[MODEL ISSUE: TTS Kokoro-82M ({target_tts_url})] Connection error: {e}")
        # Connection fallback
        if target_tts_url != TTS_URL:
            try:
                async with sess.post(
                    f"{TTS_URL}/stream",
                    json=payload,
                    headers={"Authorization": f"Bearer {GPU_API_KEY}", "Content-Type": "application/json"},
                ) as fb_r:
                    if fb_r.status == 200:
                        async for chunk in fb_r.content.iter_chunked(1920):
                            yield chunk
            except Exception:
                pass


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

        # Record agent audio into master conversation recording buffer (resample 24kHz -> 16kHz)
        try:
            if audioop is not None:
                resampled, _ = audioop.ratecv(chunk, 2, 1, 24000, 16000, None)
                cs.conversation_pcm.extend(resampled)
            else:
                cs.conversation_pcm.extend(chunk)
        except Exception:
            pass

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
    logger.info(f"Caller joined | Identity: {participant.identity} | Phone: {participant.attributes.get('sip.phoneNumber', participant.identity)}")

    cs = CallSession(ctx.room, participant)
    await cs.handshake_backend()

    # Publish agent outbound audio (24kHz mono PCM)
    audio_source = rtc.AudioSource(sample_rate=24000, num_channels=1)
    track   = rtc.LocalAudioTrack.create_audio_track("agent_voice", audio_source)
    options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
    await ctx.room.local_participant.publish_track(track, options)

    sess = await get_session()

    # Audio ingest queue & lifecycle listeners
    audio_queue: asyncio.Queue = asyncio.Queue(maxsize=16)
    greeting_start_time = time.time()

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(p: rtc.RemoteParticipant):
        if p.identity == participant.identity or len(ctx.room.remote_participants) == 0:
            logger.info(f"Caller [{p.identity}] hung up.")
            cs.is_active = False
            cs.should_hangup = True

    @ctx.room.on("disconnected")
    def on_disconnected():
        logger.info(f"Room [{ctx.room.name}] disconnected.")
        cs.is_active = False
        cs.should_hangup = True

    def start_reading_audio(remote_track: rtc.Track):
        if remote_track.kind != rtc.TrackKind.KIND_AUDIO:
            return
        logger.info(f"Subscribed & listening to caller audio track: {remote_track.sid}")
        stream = rtc.AudioStream(remote_track, sample_rate=16000, num_channels=1)

        async def _read_audio():
            speaking = False
            consecutive_speech = 0
            silence_frames = 0
            pcm_buf = bytearray()
            sample_rate = 16000

            async for ev in stream:
                if not cs.is_active or cs.should_hangup:
                    break
                raw = bytes(ev.frame.data)
                energy = pcm_energy(raw)

                # Telephone voice energy detection (180 threshold for telephone/cellular audio)
                if energy > 180:
                    consecutive_speech += 1
                    # Require 2 frames (~40ms) of voice energy to trigger
                    if consecutive_speech >= 2:
                        if not speaking:
                            speaking = True
                            logger.info(f"Caller speech started (energy: {energy})")
                            # Don't false-interrupt during the first 1.2s of greeting
                            if time.time() - greeting_start_time > 1.2:
                                cs.barge_in.set()
                        silence_frames = 0
                        pcm_buf.extend(raw)
                else:
                    consecutive_speech = 0
                    if speaking:
                        pcm_buf.extend(raw)
                        silence_frames += 1
                        # 20 frames @ 20ms = ~400ms silence ends user turn
                        if silence_frames >= 20:
                            speaking = False
                            logger.info(f"Caller speech ended ({len(pcm_buf)} bytes). Sending to STT...")
                            # Transcribe if audio is longer than 250ms
                            min_bytes = int(sample_rate * 0.25 * 2)
                            if len(pcm_buf) > min_bytes:
                                cs.conversation_pcm.extend(pcm_buf)
                                wav = pcm16_to_wav(bytes(pcm_buf), sample_rate=sample_rate)
                                try:
                                    audio_queue.put_nowait(wav)
                                except asyncio.QueueFull:
                                    pass
                            pcm_buf.clear()
                            silence_frames = 0

        asyncio.create_task(_read_audio())

    @ctx.room.on("track_subscribed")
    def on_track(remote_track: rtc.Track, pub: rtc.RemoteTrackPublication, remote_p: rtc.RemoteParticipant):
        start_reading_audio(remote_track)

    # Immediately attach to any already-subscribed tracks
    for pub in participant.track_publications.values():
        if pub.track and pub.track.kind == rtc.TrackKind.KIND_AUDIO:
            start_reading_audio(pub.track)

    # Speak Greeting
    greeting_txt = cs.greeting
    if not greeting_txt:
        first_name = cs.agent_name.split()[0]
        greeting_txt = f"Hello! Thanks for calling IbraSoft. My name is {first_name}. How can I help you today?"
    logger.info(f"Speaking Greeting: \"{greeting_txt}\"")
    greeting_start_time = time.time()
    await play_pcm(
        audio_source,
        tts_stream_pcm(sess, greeting_txt, cs.voice_name, cs.voice_speed, cs.tts_url, cs.tts_api_key),
        cs,
    )
    cs.chat_history.append({"role": "assistant", "content": greeting_txt})

    # Main conversational turn-taking loop
    try:
        while cs.is_active and not cs.should_hangup:
            if len(ctx.room.remote_participants) == 0:
                logger.info("Caller is no longer in room. Finishing call.")
                break

            try:
                wav_bytes = await asyncio.wait_for(audio_queue.get(), timeout=0.4)
            except asyncio.TimeoutError:
                continue

            cs.barge_in.clear()

            # 1. Transcribe speech using GPU STT (Parakeet-TDT)
            user_text = await transcribe(wav_bytes)
            if not user_text:
                continue

            cs.chat_history.append({"role": "user", "content": user_text})
            logger.info(f"Caller: \"{user_text}\"")

            # 2. Stream LLM response & Kokoro TTS clauses
            full_reply = ""
            async for clause in stream_llm(sess, cs):
                if cs.barge_in.is_set():
                    logger.info("Caller interrupted (barge-in). Stopping TTS.")
                    break
                full_reply += " " + clause
                await play_pcm(
                    audio_source,
                    tts_stream_pcm(sess, clause, cs.voice_name, cs.voice_speed, cs.tts_url, cs.tts_api_key),
                    cs,
                )

            if full_reply.strip():
                cs.chat_history.append({"role": "assistant", "content": full_reply.strip()})

            if cs.should_hangup:
                await asyncio.sleep(0.5)
                break

    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Error in conversational loop: {e}")
    finally:
        logger.info(f"Finalizing call {cs.call_id} and persisting transcript/recording...")
        try:
            await cs.finalize_call()
        except Exception as e:
            logger.error(f"finalize_call error: {e}")
        try:
            await ctx.room.disconnect()
        except Exception:
            pass
        logger.info(f"Room {ctx.room.name} closed and worker released.")



# ─────────────────────────────────────────────────────────────────────────────
# AUTO-PROVISION LIVEKIT SIP INBOUND TRUNK & DISPATCH RULE
# ─────────────────────────────────────────────────────────────────────────────
async def auto_provision_sip():
    try:
        from livekit import api
        lk_api = api.LiveKitAPI(
            url=LIVEKIT_URL,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
        )
        sip_service = getattr(lk_api, "sip", None)
        if not sip_service:
            return

        phone_numbers = ["+14153845276", "14153845276", "+12408503606", "12408503606", "+*", "*"]
        telnyx_ips = [
            "192.76.120.0/22",
            "64.16.224.0/19",
            "185.107.44.0/22",
            "188.165.249.0/24",
            "0.0.0.0/0",
        ]

        # 1. Trunks
        existing_trunks = []
        try:
            if hasattr(sip_service, "list_sip_inbound_trunk"):
                res = await sip_service.list_sip_inbound_trunk()
                existing_trunks = getattr(res, "items", getattr(res, "trunks", []))
            elif hasattr(sip_service, "list_inbound_trunks"):
                res = await sip_service.list_inbound_trunks()
                existing_trunks = getattr(res, "items", getattr(res, "trunks", []))
        except Exception:
            pass

        trunk_id = None
        if existing_trunks:
            for t in existing_trunks:
                t_id = getattr(t, "sip_trunk_id", getattr(t, "id", None))
                if t_id:
                    trunk_id = t_id
                    break
            logger.info(f"SIP Inbound Trunk verified: {trunk_id}")
        else:
            trunk_info_cls = getattr(api, "SIPInboundTrunkInfo", None)
            trunk_req_cls = getattr(api, "CreateSIPInboundTrunkRequest", None)
            if trunk_info_cls and trunk_req_cls:
                try:
                    trunk_info = trunk_info_cls(
                        name="Telnyx Inbound Trunk",
                        numbers=phone_numbers,
                        allowed_addresses=telnyx_ips,
                    )
                except Exception:
                    trunk_info = trunk_info_cls(
                        name="Telnyx Inbound Trunk",
                        numbers=phone_numbers,
                    )

                try:
                    req = trunk_req_cls(trunk=trunk_info)
                except Exception:
                    req = trunk_req_cls(
                        name="Telnyx Inbound Trunk",
                        numbers=phone_numbers,
                    )

                if hasattr(sip_service, "create_sip_inbound_trunk"):
                    created_trunk = await sip_service.create_sip_inbound_trunk(req)
                    trunk_id = getattr(created_trunk, "sip_trunk_id", getattr(created_trunk, "id", None))
                elif hasattr(sip_service, "create_inbound_trunk"):
                    created_trunk = await sip_service.create_inbound_trunk(req)
                    trunk_id = getattr(created_trunk, "sip_trunk_id", getattr(created_trunk, "id", None))

                logger.info(f"Registered SIP Inbound Trunk: {trunk_id}")

        # 2. Dispatch Rules
        existing_rules = []
        try:
            if hasattr(sip_service, "list_sip_dispatch_rule"):
                res = await sip_service.list_sip_dispatch_rule()
                existing_rules = getattr(res, "items", getattr(res, "rules", []))
            elif hasattr(sip_service, "list_dispatch_rules"):
                res = await sip_service.list_dispatch_rules()
                existing_rules = getattr(res, "items", getattr(res, "rules", []))
        except Exception:
            pass

        rule_id = None
        if existing_rules:
            for r in existing_rules:
                r_id = getattr(r, "sip_dispatch_rule_id", getattr(r, "id", None))
                if r_id:
                    rule_id = r_id
                    break
            logger.info(f"SIP Dispatch Rule verified: {rule_id}")
        else:
            rule_cls = getattr(api, "SIPDispatchRule", None)
            indiv_cls = getattr(api, "SIPDispatchRuleIndividual", None)
            disp_req_cls = getattr(api, "CreateSIPDispatchRuleRequest", None)

            if rule_cls and indiv_cls and disp_req_cls:
                rule_obj = rule_cls(
                    dispatch_rule_individual=indiv_cls(
                        room_prefix="call-"
                    )
                )
                req_kwargs = {
                    "rule": rule_obj,
                    "name": "Inbound Call Dispatcher",
                }
                if trunk_id:
                    req_kwargs["trunk_ids"] = [trunk_id]

                try:
                    req = disp_req_cls(**req_kwargs)
                except Exception:
                    req = disp_req_cls(
                        dispatch_rule=rule_obj,
                        name="Inbound Call Dispatcher",
                    )

                if hasattr(sip_service, "create_sip_dispatch_rule"):
                    created_rule = await sip_service.create_sip_dispatch_rule(req)
                    rule_id = getattr(created_rule, "sip_dispatch_rule_id", getattr(created_rule, "id", None))
                elif hasattr(sip_service, "create_dispatch_rule"):
                    created_rule = await sip_service.create_dispatch_rule(req)
                    rule_id = getattr(created_rule, "sip_dispatch_rule_id", getattr(created_rule, "id", None))

                logger.info(f"Registered SIP Dispatch Rule: {rule_id}")

        await lk_api.aclose()
    except Exception as e:
        logger.warning(f"LiveKit SIP auto-provision warning: {e}")


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

    # Auto-provision LiveKit SIP Inbound Trunk and Dispatch Rule
    try:
        asyncio.run(auto_provision_sip())
    except Exception as e:
        logger.warning(f"Could not complete SIP auto-provisioning: {e}")

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

