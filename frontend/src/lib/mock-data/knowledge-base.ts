import { KnowledgeSource } from "../types";

export const initialKnowledgeSources: KnowledgeSource[] = [
  {
    id: "kb-architecture-sla",
    name: "Apex_Voice_Architecture_and_Security_SLA.md",
    type: "document",
    status: "indexed",
    chunkCount: 3,
    sizeKb: 28,
    lastIndexed: new Date().toISOString(),
    assignedAgentIds: ["agent-1"],
    contentPreview: "SOC2 Type II compliance, sub-280ms latency pipeline (Faster-Whisper → vLLM Qwen 2.5 7B → Kokoro-82M), and 99.99% uptime SLA.",
    chunks: [
      {
        id: "chk-arch-1",
        text: "SOC2 Type II & Security Compliance: Apex Voice Systems undergoes annual third-party audits. Audio frames are processed in-memory on dedicated GPU microservices with zero persistent audio storage unless HIPAA encrypted recording is explicitly enabled.",
        tokenCount: 48,
        similarityScore: 0.96,
      },
      {
        id: "chk-arch-2",
        text: "Latency & Pipeline Benchmarks: Streaming speech recognition (Faster-Whisper CUDA distil-large-v3) + LLM inference (vLLM Qwen 2.5 7B AWQ) + Neural voice synthesis (Kokoro-82M ONNX) achieves sub-280ms average global round-trip latency.",
        tokenCount: 52,
        similarityScore: 0.91,
      },
      {
        id: "chk-arch-3",
        text: "SLA & High Availability: 99.99% uptime SLA guarantee with real-time health probes, automatic failover across live SBC SIP trunks, and dedicated GPU worker clusters.",
        tokenCount: 42,
        similarityScore: 0.88,
      },
    ],
  },
  {
    id: "kb-pricing-matrix",
    name: "Apex_Pricing_Tier_Matrix_and_Discounts.md",
    type: "document",
    status: "indexed",
    chunkCount: 2,
    sizeKb: 18,
    lastIndexed: new Date().toISOString(),
    assignedAgentIds: ["agent-1"],
    contentPreview: "Enterprise volume pricing matrix ($0.08/min for >50k mins), custom Kokoro-82M voice cloning, and dedicated vLLM GPU nodes.",
    chunks: [
      {
        id: "chk-price-1",
        text: "Enterprise Volume Discounts: Accounts processing above 50,000 call minutes per month qualify for Tier 3 volume pricing at $0.08 per minute with dedicated SIP channel routing.",
        tokenCount: 40,
        similarityScore: 0.89,
      },
      {
        id: "chk-price-2",
        text: "Custom Voice Cloning & Dedicated vLLM Nodes: Enterprise plans include custom neural voice training (Kokoro-82M) and isolated vLLM GPU instances for zero latency variance.",
        tokenCount: 38,
        similarityScore: 0.85,
      },
    ],
  },
];
