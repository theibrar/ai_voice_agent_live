# Contabo Voice AI Telephony & Agent Worker Cluster

## 🏗️ Architecture Split: Contabo VPS ↔ Vast.ai GPU

```
                  ┌─────────────────────────────────────────┐
                  │        CALLER / TELEPHONY (SIP)         │
                  │   Telnyx / Twilio / Browser WebRTC      │
                  └────────────────────┬────────────────────┘
                                       │ SIP / WebRTC Audio
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONTABO VPS (All UDP Ports Open, Static IP, App & Data Plane)              │
│                                                                             │
│  ┌───────────────────────┐             ┌─────────────────────────────────┐  │
│  │   LiveKit Server SFU  │◄───────────►│      LiveKit SIP Gateway        │  │
│  │   (Media Routing)     │             │     (Port 5060 + RTP Audio)     │  │
│  └───────────┬───────────┘             └─────────────────────────────────┘  │
│              │ WebRTC Audio Frames                                          │
│              ▼                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                   LiveKit Agent Worker (agent_worker.py)              │  │
│  │   • Persistent Keep-Alive Connection Pools                            │  │
│  │   • Sub-100ms Early Clause Pipeline (LLM tokens -> TTS stream)        │  │
│  │   • Sub-200ms Silero Barge-In Audio Interruption                      │  │
│  └───────┬───────────────────────────────┬───────────────────────────┬───┘  │
│          │                               │                           │      │
│          ▼                               ▼                           ▼      │
│  ┌──────────────┐             ┌─────────────────────┐      ┌─────────────┐  │
│  │  Go Backend  │             │ pgvector RAG Engine │      │ PostgreSQL  │  │
│  │  (Billing)   │             │ (Knowledge Base)    │      │  (CRM / DB) │  │
│  └──────────────┘             └─────────────────────┘      └─────────────┘  │
└──────────┬───────────────────────────────┬───────────────────────────┬──────┘
           │ Transcribe Audio              │ Stream LLM Tokens         │ Synthesize Audio
           ▼                               ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DEDICATED GPU AI SERVER (202.215.0.218 - Real-Time Compute)                │
│                                                                             │
│  ┌─────────────────────────┐ ┌───────────────────────┐ ┌─────────────────┐  │
│  │  Faster-Whisper STT     │ │     vLLM LLM Engine   │ │   Kokoro TTS    │  │
│  │   (Port :50053)         │ │   (Port :50287/v1)    │ │   (Port :50869) │  │
│  │  Sub-80ms Transcription │ │  Sub-200ms AWQ Prefill│ │  Sub-50ms Chunks│  │
│  └─────────────────────────┘ └───────────────────────┘ └─────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Silero VAD Barge-In (Port :50604) — Sub-5ms Interruption Monitor     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start on Contabo VPS

```bash
# 1. Clone repository on Contabo
git clone https://github.com/theibrar/voice_worker.git contabo-worker && cd contabo-worker

# 2. Run the 1-click installer
bash setup_contabo.sh

# 3. Stream live logs
docker compose -f docker-compose.contabo.yml logs -f agent-worker
```

---

## ⚡ ElevenLabs-Grade Ultra-Low Latency Pipeline (<300ms)

1. **Early Clause Streaming**: As vLLM produces punctuation, clauses are piped immediately to Kokoro chunked streaming.
2. **Persistent HTTP Pools**: Pre-warmed TCP sockets eliminate handshake delays.
3. **Instant Barge-In**: Real-time cancellation when the caller speaks mid-sentence.
