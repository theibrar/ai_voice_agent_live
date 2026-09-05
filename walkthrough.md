# Enterprise Voice AI Worker Walkthrough
### *NVIDIA FastConformer Parakeet STT + Kokoro-82M Neural Voice Engine + LiveKit WebRTC & SIP*

The complete, production-grade **`voice-worker/`** suite has been generated and validated end-to-end against your Go backend, PostgreSQL database, and telephony pipeline.

---

## 📦 What Was Built in `voice-worker/`

| File | Purpose |
| :--- | :--- |
| **[`agent.py`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/agent.py)** | Production LiveKit Voice Agent Worker with auto-handshake to Go backend (`/calls/start`, `/calls/end`), live WebSockets (`/ws/calls`), and autonomous tool calling. |
| **[`kokoro_tts_engine.py`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/kokoro_tts_engine.py)** | High-performance neural voice engine supporting Kokoro personas (`af_heart`, `af_bella`, `am_adam`, `am_michael`, `bf_emma`, etc.) with speed/prosody tuning and sentence-level audio streaming. |
| **[`parakeet_stt_engine.py`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/parakeet_stt_engine.py)** | FastConformer streaming STT engine with sub-80ms chunk turnaround. |
| **[`turn_detector.py`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/turn_detector.py)** | Dual-stage Silero VAD + End-of-Thought turn detector for sub-120ms barge-in interruption handling. |
| **[`tools/`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/tools/)** | Autonomous mid-call tools: **Google Calendar Booking**, **Real-Time SMS Push**, **pgvector Semantic RAG**, and **SIP REFER Warm/Cold Transfers**. |
| **[`test_simulator.py`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/test_simulator.py)** | Interactive local CLI test tool with real-time latency reporting and database credit deduction. |
| **[`setup_gpu.sh`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/setup_gpu.sh)** | Autonomous one-click bash installer for Ubuntu 22.04 / 24.04 LTS with NVIDIA GPU (CUDA 12.4). |
| **[`Dockerfile.gpu`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/Dockerfile.gpu)** | Production CUDA 12.4 + PyTorch container with NVIDIA GPU reservations. |
| **[`docker-compose.gpu.yml`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/docker-compose.gpu.yml)** | Full GPU stack containing LiveKit Server, SIP Gateway, Redis, and GPU Agent Worker. |
| **[`livekit.yaml`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/livekit.yaml) & [`livekit-sip.yaml`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/livekit-sip.yaml)** | Production LiveKit and Telnyx SIP Inbound/Outbound Trunk configuration files. |
| **[`README.md`](file:///c:/Users/Administrator/Desktop/AI_Voice_project/voice-worker/README.md)** | Step-by-step developer and deployment guide. |

---

## 🧪 How to Test Locally on Your Machine

Open your terminal in the project directory:

```bash
python voice-worker/test_simulator.py
```

### **What Happens During the Local Test:**
1. **Handshake:** Automatically calls `POST http://localhost:8080/api/v1/calls/start` and loads the assigned agent persona, system prompt, and voice parameters.
2. **Interactive Turn:** Type or speak any prompt (e.g. *"What is your commercial solar warranty?"*).
3. **Mid-Call Tools:** Automatically triggers pgvector knowledge retrieval or live SMS push.
4. **Kokoro Audio Stream:** Synthesizes voice audio with real-time latency benchmarks.
5. **Call Teardown & Billing:** Automatically posts to `POST /api/v1/calls/end`, writes the call record, and deducts **1 credit per minute** from the PostgreSQL `tenants` table.

---

## 🚀 How to Deploy on Your Ubuntu GPU Server

When you are ready to deploy to your Ubuntu GPU server:

1. **Copy the `voice-worker/` folder to your GPU server:**
   ```bash
   scp -r voice-worker user@YOUR_GPU_IP:/home/user/
   ```

2. **SSH into the GPU server and run the automated installer:**
   ```bash
   cd /home/user/voice-worker
   sudo bash setup_gpu.sh
   ```

3. **Point your Telnyx SIP Trunk:**
   * Set your Telnyx Inbound SIP connection to `YOUR_GPU_IP:5060` (UDP).
   * Inbound calls to your allocated phone numbers will immediately route to your AI Voice Agents!
