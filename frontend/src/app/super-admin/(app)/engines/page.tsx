"use client";

import React, { useState } from "react";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import { VoiceAiEngine } from "@/lib/mock-data/super-admin";
import {
  Cpu,
  Mic,
  Headphones,
  Plus,
  Sliders,
  CheckCircle2,
  Check,
  XCircle,
  Building2,
  Zap,
  Activity,
  Layers,
  X,
  Search,
  Sparkles,
  Server,
  Globe,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Radio,
  Terminal,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";

export default function SuperAdminEnginesPage() {
  const {
    engines,
    refreshEngines,
    tenants,
    addCustomEngine,
    updateCustomEngine,
    toggleEngineStatus,
    deleteEngine,
    updateEngineTierRequirement,
    probeEngineHealth,
    toggleTenantEngine,
    addToast,
  } = useSuperAdminStore();

  React.useEffect(() => {
    refreshEngines();
  }, [refreshEngines]);

  const [activeCategory, setActiveCategory] = useState<"all" | "llm" | "tts" | "stt">("all");
  const [tenantMatrixModalOpen, setTenantMatrixModalOpen] = useState(false);
  const [customModelModalOpen, setCustomModelModalOpen] = useState(false);
  const [editingEngineId, setEditingEngineId] = useState<string | null>(null);
  const [engineToDelete, setEngineToDelete] = useState<VoiceAiEngine | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id || "");
  const [probingId, setProbingId] = useState<string | null>(null);
  const [engineHealthMap, setEngineHealthMap] = useState<Record<string, { online: boolean; latencyMs: number }>>({
    "eng-vllm-qwen": { online: true, latencyMs: 45 },
    "eng-kokoro-tts": { online: true, latencyMs: 45 },
    "eng-whisper-stt": { online: true, latencyMs: 180 },
    "eng-vad-silero": { online: true, latencyMs: 5 },
  });

  const handleProbeEngine = async (engine: VoiceAiEngine) => {
    setProbingId(engine.id);
    const res = await probeEngineHealth(engine.id);
    setEngineHealthMap((prev) => ({
      ...prev,
      [engine.id]: { online: res.online, latencyMs: res.latencyMs },
    }));
    setProbingId(null);
    addToast({
      title: `${engine.name} Probe`,
      description: res.online ? `Online • ${res.latencyMs}ms live latency` : `Offline • ${res.message || "Failed"}`,
      type: res.online ? "success" : "danger",
    });
  };

  const GPU_MODEL_PRESETS = [
    // LLMs
    {
      label: "🧠 vLLM Qwen 2.5 7B (GPU Live)",
      name: "vLLM Neural LLM Engine",
      category: "llm" as const,
      provider: "OpenAI-Compatible vLLM",
      modelIdentifier: "Qwen/Qwen2.5-7B-Instruct-AWQ",
      baseUrl: "http://77.54.200.11:15219/v1",
      apiKey: "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF",
      latencyAvgMs: 45,
      costPerUnit: "$0.00 / Self-Hosted GPU",
      tierRequirement: "all" as const,
      description: "Production vLLM OpenAI-Compatible high-throughput inference engine running on NVIDIA RTX 4060 Ti (16GB VRAM).",
    },
    // TTS
    {
      label: "🗣️ Kokoro-82M TTS (GPU Live)",
      name: "Kokoro Ultra-Fast Neural TTS",
      category: "tts" as const,
      provider: "Kokoro ONNX Neural",
      modelIdentifier: "kokoro-82m",
      baseUrl: "http://77.54.200.11:15137",
      apiKey: "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF",
      latencyAvgMs: 45,
      costPerUnit: "$0.00 / Self-Hosted GPU",
      tierRequirement: "all" as const,
      description: "Sub-45ms ultra-fast ONNX neural voice synthesizer with 24kHz 16-bit PCM output. Supported voices: af_bella, af_sarah, am_adam, am_michael, bf_emma, bm_george.",
    },
    // STT
    {
      label: "🎙️ Faster-Whisper STT (GPU Live)",
      name: "Faster-Whisper CUDA Streaming Transcriber",
      category: "stt" as const,
      provider: "Faster-Whisper CUDA",
      modelIdentifier: "distil-large-v3",
      baseUrl: "http://77.54.200.11:15203",
      apiKey: "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF",
      latencyAvgMs: 180,
      costPerUnit: "$0.00 / Self-Hosted GPU",
      tierRequirement: "all" as const,
      description: "CUDA float16 distil-large-v3 streaming speech-to-text with sub-200ms latency and WebSocket streaming on NVIDIA RTX 4060 Ti.",
    },
    // VAD
    {
      label: "⚡ Silero VAD v5 (GPU Live)",
      name: "Silero VAD v5 Neural Chunk Monitor",
      category: "stt" as const,
      provider: "Silero Neural VAD",
      modelIdentifier: "silero-vad-v5",
      baseUrl: "http://77.54.200.11:15290",
      apiKey: "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF",
      latencyAvgMs: 5,
      costPerUnit: "$0.00 / Self-Hosted GPU",
      tierRequirement: "all" as const,
      description: "Sub-5ms caller interruption / barge-in neural chunk monitor with 16 kHz sample rate, 512 samples per frame (32ms window).",
    },
  ];

  // Custom Model Form State
  const [name, setName] = useState(GPU_MODEL_PRESETS[0].name);
  const [provider, setProvider] = useState(GPU_MODEL_PRESETS[0].provider);
  const [category, setCategory] = useState<"llm" | "tts" | "stt">(GPU_MODEL_PRESETS[0].category);
  const [modelIdentifier, setModelIdentifier] = useState(GPU_MODEL_PRESETS[0].modelIdentifier);
  const [baseUrl, setBaseUrl] = useState(GPU_MODEL_PRESETS[0].baseUrl);
  const [apiKey, setApiKey] = useState(GPU_MODEL_PRESETS[0].apiKey);
  const [latencyAvgMs, setLatencyAvgMs] = useState(GPU_MODEL_PRESETS[0].latencyAvgMs);
  const [costPerUnit, setCostPerUnit] = useState(GPU_MODEL_PRESETS[0].costPerUnit);
  const [tierRequirement, setTierRequirement] = useState<"all" | "growth_plus" | "enterprise_only">(GPU_MODEL_PRESETS[0].tierRequirement);
  const [description, setDescription] = useState(GPU_MODEL_PRESETS[0].description);
  const [testState, setTestState] = useState<{ testing: boolean; result?: { ok: boolean; message: string } }>({ testing: false });
  const [showApiKey, setShowApiKey] = useState(true);

  const applyPreset = (preset: typeof GPU_MODEL_PRESETS[0]) => {
    setName(preset.name);
    setProvider(preset.provider);
    setCategory(preset.category);
    setModelIdentifier(preset.modelIdentifier);
    setBaseUrl(preset.baseUrl);
    setApiKey(preset.apiKey);
    setLatencyAvgMs(preset.latencyAvgMs);
    setCostPerUnit(preset.costPerUnit);
    setTierRequirement(preset.tierRequirement);
    setDescription(preset.description);
    setTestState({ testing: false });
  };

  const handleCategoryChange = (newCat: "llm" | "tts" | "stt") => {
    setCategory(newCat);
    if (newCat === "tts") {
      const ttsPreset = GPU_MODEL_PRESETS.find((p) => p.category === "tts") || GPU_MODEL_PRESETS[1];
      applyPreset(ttsPreset);
    } else if (newCat === "stt") {
      const sttPreset = GPU_MODEL_PRESETS.find((p) => p.category === "stt") || GPU_MODEL_PRESETS[2];
      applyPreset(sttPreset);
    } else {
      const llmPreset = GPU_MODEL_PRESETS.find((p) => p.category === "llm") || GPU_MODEL_PRESETS[0];
      applyPreset(llmPreset);
    }
  };

  const handleTestCustomEndpoint = async () => {
    if (!baseUrl) return;
    setTestState({ testing: true });
    try {
      const t0 = performance.now();
      let probeUrl = baseUrl;
      const headers: Record<string, string> = {};
      const key = apiKey || "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF";

      if (category === "llm") {
        probeUrl = baseUrl.endsWith("/v1") ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
        headers["Authorization"] = `Bearer ${key}`;
      } else {
        probeUrl = baseUrl.replace(/\/+$/, "") + "/health";
        headers["X-API-Key"] = key;
        headers["Authorization"] = `Bearer ${key}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(probeUrl, { headers, signal: controller.signal });
      clearTimeout(timeout);
      const latency = Math.round(performance.now() - t0);

      if (res.ok) {
        setTestState({ testing: false, result: { ok: true, message: `Connected! HTTP ${res.status} OK (${latency}ms)` } });
        setLatencyAvgMs(latency);
      } else {
        setTestState({ testing: false, result: { ok: false, message: `HTTP ${res.status} Error` } });
      }
    } catch (err: any) {
      setTestState({ testing: false, result: { ok: false, message: err.message || "Connection refused" } });
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEngineId(null);
    applyPreset(GPU_MODEL_PRESETS[0]);
    setCustomModelModalOpen(true);
  };

  const handleOpenEditModal = (engine: VoiceAiEngine) => {
    setEditingEngineId(engine.id);
    setName(engine.name);
    setProvider(engine.provider);
    setCategory(engine.category as "llm" | "tts" | "stt");
    setModelIdentifier(engine.modelIdentifier);
    setBaseUrl(engine.baseUrl || "");
    setApiKey(engine.apiKey || "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF");
    setLatencyAvgMs(engine.latencyAvgMs);
    setCostPerUnit(engine.costPerUnit);
    setTierRequirement(engine.tierRequirement as "all" | "growth_plus" | "enterprise_only");
    setDescription(engine.description);
    setTestState({ testing: false });
    setCustomModelModalOpen(true);
  };

  const handleRegisterCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !modelIdentifier.trim()) return;

    if (editingEngineId) {
      updateCustomEngine({
        id: editingEngineId,
        name: name.trim(),
        provider: provider.trim(),
        category,
        modelIdentifier: modelIdentifier.trim(),
        latencyAvgMs,
        costPerUnit: costPerUnit.trim(),
        status: engines.find((eng) => eng.id === editingEngineId)?.status || "active",
        isGlobalDefault: engines.find((eng) => eng.id === editingEngineId)?.isGlobalDefault || false,
        tierRequirement,
        supportedLanguagesCount: 30,
        description: description.trim(),
        isCustom: true,
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
      });
    } else {
      addCustomEngine({
        name: name.trim(),
        provider: provider.trim(),
        category,
        modelIdentifier: modelIdentifier.trim(),
        latencyAvgMs,
        costPerUnit: costPerUnit.trim(),
        status: "active",
        isGlobalDefault: false,
        tierRequirement,
        supportedLanguagesCount: 30,
        description: description.trim(),
        isCustom: true,
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
      });
    }

    setCustomModelModalOpen(false);
    setEditingEngineId(null);
  };

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  const filteredEngines = engines.filter(
    (e) => activeCategory === "all" || e.category === activeCategory
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Voice AI Engines & Models</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
                {engines.length} Models Active
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage real-time LLM reasoning engines, neural TTS synthesis, and CUDA STT transcription models directly connected to PostgreSQL.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Custom Model / LLM</span>
          </button>

          <button
            onClick={() => setTenantMatrixModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5] rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Manage Tenant Entitlements</span>
          </button>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-xs w-fit">
        {[
          { id: "all", label: `All Voice Engines (${engines.length})` },
          { id: "llm", label: `LLM Reasoning (${engines.filter((e) => e.category === "llm").length})` },
          { id: "tts", label: `TTS Voice Synthesis (${engines.filter((e) => e.category === "tts").length})` },
          { id: "stt", label: `STT Transcription (${engines.filter((e) => e.category === "stt").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeCategory === tab.id
                ? "bg-[#3157D5] text-white shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Engine Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEngines.length > 0 ? (
          filteredEngines.map((engine) => {
            const isLlm = engine.category === "llm";
            const isTts = engine.category === "tts";
            const isStt = engine.category === "stt";

            return (
              <div
                key={engine.id}
                className={`p-6 bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                  engine.isCustom
                    ? "border-amber-300 bg-gradient-to-b from-amber-50/20 to-white"
                    : engine.isGlobalDefault
                    ? "border-[#3157D5] ring-2 ring-[#3157D5]/30"
                    : "border-[#E2E8F0] hover:border-[#3157D5]/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-md shadow-[#3157D5]/20">
                        {isLlm ? <Cpu className="w-5 h-5 text-white" /> : isTts ? <Headphones className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-[#0F172A] leading-tight">{engine.name}</h3>
                          {engine.isCustom && (
                            <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                              Custom
                            </span>
                          )}
                          {engine.isGlobalDefault && (
                            <span className="text-[8px] font-bold text-[#3157D5] bg-[#EEF2FD] px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B]">{engine.provider} • {engine.category.toUpperCase()}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      engine.status === "active" ? "bg-[#EEF2FD] text-[#3157D5]" : "bg-[#F1F5F9] text-[#64748B]"
                    }`}>
                      {engine.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {engine.description}
                  </p>

                  {engine.isCustom && engine.baseUrl && (
                    <div className="p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[10px] font-mono text-[#3157D5] truncate">
                      Endpoint: {engine.baseUrl}
                    </div>
                  )}

                  {/* Technical Specs */}
                  <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Average Turn Latency:</span>
                      <span className="font-mono font-bold text-[#3157D5]">{engine.latencyAvgMs} ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Platform Cost / Unit:</span>
                      <span className="font-mono text-[#0F172A] font-semibold">{engine.costPerUnit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Tier Restriction:</span>
                      <span className="font-bold text-[#0F172A] capitalize">{engine.tierRequirement.replace("_", "+ ")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Identifier:</span>
                      <span className="font-mono text-[10px] text-[#0F172A] truncate max-w-[140px]">{engine.modelIdentifier}</span>
                    </div>
                  </div>

                  {engine.baseUrl && (
                    <button
                      onClick={() => handleProbeEngine(engine)}
                      disabled={probingId === engine.id}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Activity className={`w-3.5 h-3.5 text-emerald-600 ${probingId === engine.id ? "animate-spin" : ""}`} />
                      <span>
                        {probingId === engine.id
                          ? "Testing Live Connection..."
                          : engineHealthMap[engine.id]?.online
                          ? `Live Health Probe (${engineHealthMap[engine.id].latencyMs}ms ● Online)`
                          : "Test Live Endpoint"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#EDF2F7] flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => toggleEngineStatus(engine.id)}
                    className="flex-1 py-2 px-2 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
                  >
                    {engine.status === "active" ? "Deprecate" : "Re-activate"}
                  </button>

                  <select
                    value={engine.tierRequirement}
                    onChange={(e: any) => updateEngineTierRequirement(engine.id, e.target.value)}
                    className="py-1.5 px-2 bg-[#EEF2FD] text-[#3157D5] border border-[#3157D5]/20 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="all">All Plans</option>
                    <option value="growth_plus">Growth+ Only</option>
                    <option value="enterprise_only">Enterprise Only</option>
                  </select>

                  <button
                    onClick={() => handleOpenEditModal(engine)}
                    className="p-2 text-[#3157D5] hover:text-white bg-[#EEF2FD] hover:bg-[#3157D5] border border-[#3157D5]/30 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                    title={`Edit ${engine.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Edit</span>
                  </button>

                  <button
                    onClick={() => setEngineToDelete(engine)}
                    className="p-2 text-rose-500 hover:text-white bg-white hover:bg-rose-600 border border-[#E2E8F0] hover:border-rose-400 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                    title={`Delete ${engine.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#0F172A]">No Voice AI Engines Found</h3>
            <p className="text-xs text-[#64748B]">No models match the selected category. You can register a custom model or switch filters.</p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
            >
              Register Custom Model
            </button>
          </div>
        )}
      </div>

      {/* 4. Register / Edit Custom Model Modal (Horizontal Landscape Layout) */}
      {customModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-4xl lg:max-w-5xl w-full p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center shadow-xs">
                  {editingEngineId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                    {editingEngineId
                      ? `Edit Microservice: ${name}`
                      : category === "tts"
                      ? "Register Custom TTS Voice Synthesis Endpoint"
                      : category === "stt"
                      ? "Register Custom STT Speech-to-Text Endpoint"
                      : "Register Custom LLM Reasoning Endpoint"}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {editingEngineId
                      ? "Update microservice endpoint parameters, latency benchmarks, and tier permissions"
                      : "Connect, benchmark, and deploy a neural voice microservice across the platform"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCustomModelModalOpen(false);
                  setEditingEngineId(null);
                }}
                className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Model Presets Ribbon (Horizontal) */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3157D5]" />
                  Quick Presets (1-Click Auto Configure)
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  RTX 4060 Ti • 77.54.200.11
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {GPU_MODEL_PRESETS.map((preset) => {
                  const isSelected = modelIdentifier === preset.modelIdentifier && baseUrl === preset.baseUrl;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#3157D5] text-white shadow-xs"
                          : "bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] text-[#0F172A] hover:text-[#3157D5]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horizontal 2-Column Form Body */}
            <form onSubmit={handleRegisterCustomModel} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* LEFT COLUMN: Identity, Category & URL */}
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#0F172A] block mb-1">Model Display Name</label>
                      <input
                        type="text"
                        required
                        placeholder={
                          category === "tts"
                            ? "e.g. Kokoro-82M ONNX Neural TTS"
                            : category === "stt"
                            ? "e.g. Faster-Whisper CUDA Streaming Transcriber"
                            : "e.g. vLLM Qwen 2.5 7B Instruct (AWQ GPU)"
                        }
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#0F172A] block mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e: any) => handleCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-bold cursor-pointer"
                      >
                        <option value="llm">🧠 LLM Reasoning Model</option>
                        <option value="tts">🗣️ TTS Voice Synthesis</option>
                        <option value="stt">🎙️ STT Speech-to-Text</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#0F172A] block mb-1">Provider Engine Type</label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-bold cursor-pointer"
                      >
                        {category === "llm" && (
                          <>
                            <option value="OpenAI-Compatible vLLM">vLLM Self-Hosted GPU Cluster (Live)</option>
                            <option value="Ollama Local Server">Ollama Local Instance</option>
                            <option value="Azure OpenAI">Azure OpenAI Service</option>
                            <option value="Together AI">Together AI API</option>
                            <option value="OpenRouter">OpenRouter Aggregator</option>
                            <option value="Custom REST/WebSocket">Custom REST / WebSocket</option>
                          </>
                        )}
                        {category === "tts" && (
                          <>
                            <option value="Kokoro ONNX Neural">Kokoro ONNX Neural (Self-Hosted GPU Live)</option>
                            <option value="ElevenLabs">ElevenLabs Flash v2.5 / Turbo</option>
                            <option value="Cartesia AI">Cartesia Sonic Low-Latency</option>
                            <option value="PlayHT">PlayHT 2.0 Realtime</option>
                            <option value="Custom REST/WebSocket">Custom TTS Audio Endpoint</option>
                          </>
                        )}
                        {category === "stt" && (
                          <>
                            <option value="Faster-Whisper CUDA">Faster-Whisper CUDA (Self-Hosted GPU Live)</option>
                            <option value="Silero Neural VAD">Silero VAD v5 Neural Monitor (Self-Hosted GPU Live)</option>
                            <option value="Deepgram">Deepgram Nova-3 Streaming</option>
                            <option value="OpenAI Whisper">OpenAI Whisper API</option>
                            <option value="Custom REST/WebSocket">Custom Streaming WebSocket STT</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-[#0F172A] block mb-1">Model Identifier String</label>
                      <input
                        type="text"
                        required
                        placeholder={
                          category === "tts"
                            ? "e.g. kokoro-82m-onnx"
                            : category === "stt"
                            ? "e.g. distil-large-v3 or silero-vad-v5"
                            : "e.g. Qwen/Qwen2.5-7B-Instruct-AWQ"
                        }
                        value={modelIdentifier}
                        onChange={(e) => setModelIdentifier(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#0F172A] block mb-1">Base API URL Endpoint</label>
                    <input
                      type="url"
                      required
                      placeholder={
                        category === "tts"
                          ? "http://77.54.200.11:15137"
                          : category === "stt"
                          ? "http://77.54.200.11:15203 or http://77.54.200.11:15290"
                          : "http://77.54.200.11:15219/v1 or http://localhost:11434/v1"
                      }
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#0F172A] block">API Key / Secret Token</label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[11px] text-[#3157D5] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {showApiKey ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide Key</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Show Key</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        placeholder="IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 pr-16 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(apiKey || "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF");
                          addToast({ title: "Copied", description: "API Key copied to clipboard", type: "info" });
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold bg-[#F8FAFC] hover:bg-[#EEF2FD] border border-[#E2E8F0] text-[#3157D5] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-[#64748B]">
                        GPU Master Key Status: <code className="text-[#3157D5] font-bold font-mono">Secured (Configured)</code>
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Benchmarks, Live Test & Description */}
                <div className="space-y-3.5">
                  {/* Live Connection Test Button */}
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">Live Telemetry Probe</span>
                      {testState.result && (
                        <span
                          className={`text-[11px] font-bold ${
                            testState.result.ok ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {testState.result.ok ? "● " : "✕ "}
                          {testState.result.message}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestCustomEndpoint}
                        disabled={testState.testing || !baseUrl}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <Activity className={`w-3.5 h-3.5 ${testState.testing ? "animate-spin" : ""}`} />
                        <span>{testState.testing ? "Testing Endpoint..." : "Test Endpoint Live"}</span>
                      </button>
                      <span className="text-[10px] text-[#64748B] leading-tight">
                        Sends live HTTP probe to measure round-trip latency & response status
                      </span>
                    </div>
                  </div>

                  {/* 3-column stats row */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="font-bold text-[#0F172A] block mb-1">Latency (ms)</label>
                      <input
                        type="number"
                        value={latencyAvgMs}
                        onChange={(e) => setLatencyAvgMs(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#0F172A] block mb-1">Cost Rate</label>
                      <input
                        type="text"
                        value={costPerUnit}
                        onChange={(e) => setCostPerUnit(e.target.value)}
                        placeholder={
                          category === "tts"
                            ? "$0.00 / Self-Hosted GPU or $0.015 / 1K chars"
                            : category === "stt"
                            ? "$0.00 / Self-Hosted GPU or $0.0043 / min"
                            : "$0.00 / Self-Hosted GPU or $0.40 / 1M tokens"
                        }
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#0F172A] block mb-1">Tier Access</label>
                      <select
                        value={tierRequirement}
                        onChange={(e: any) => setTierRequirement(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-semibold"
                      >
                        <option value="all">All Plans</option>
                        <option value="growth_plus">Growth+ Only</option>
                        <option value="enterprise_only">Enterprise Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#0F172A] block mb-1">Description & Parameters</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Technical specs, supported voices/models, and runtime details..."
                      className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] resize-none"
                    />
                  </div>

                  <div className="p-2.5 bg-[#EEF2FD]/60 border border-[#3157D5]/20 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">
                      Mode: <strong className="text-[#3157D5]">{editingEngineId ? "Edit Existing Engine" : "Register New Engine"}</strong>
                    </span>
                    <span className="text-[#0F172A] font-mono text-[10px]">
                      {editingEngineId ? `ID: ${editingEngineId}` : "Live PostgreSQL Persistence"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCustomModelModalOpen(false);
                    setEditingEngineId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {editingEngineId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingEngineId ? "Update Model Details" : "Register Custom Model"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Tenant Entitlement Matrix Modal */}
      {tenantMatrixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">Tenant AI Model Entitlements</h3>
                    <p className="text-xs text-[#64748B]">Toggle available LLMs, TTS voices, and STT engines per organization</p>
                  </div>
                </div>
                <button
                  onClick={() => setTenantMatrixModalOpen(false)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-3">
                <label className="font-bold text-[#0F172A] block mb-1 text-xs">Select Target Tenant</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-xs text-[#0F172A] font-bold"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.orgName} ({t.planName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Models Checkable List */}
              <div className="overflow-y-auto max-h-96 space-y-4 pr-1 text-xs">
                {/* LLMs */}
                <div className="space-y-2">
                  <span className="font-extrabold uppercase tracking-wider text-[#64748B] text-[10px] block">
                    LLM Models & Custom Endpoints
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {engines.filter((e) => e.category === "llm").map((model) => {
                      const isAllowed = activeTenant.allowedLLMs.includes(model.id) || activeTenant.allowedLLMs.some((m) => model.name.toLowerCase().includes(m));

                      return (
                        <div
                          key={model.id}
                          onClick={() => toggleTenantEngine(activeTenant.id, "llm", model.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isAllowed ? "bg-[#EEF2FD] border-[#3157D5]/40 text-[#3157D5]" : "bg-white border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-[#0F172A]">{model.name}</p>
                            <p className="text-[10px] text-[#64748B]">{model.latencyAvgMs}ms • {model.costPerUnit}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#3157D5] focus:ring-[#3157D5]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TTS */}
                <div className="space-y-2">
                  <span className="font-extrabold uppercase tracking-wider text-[#64748B] text-[10px] block">
                    TTS Neural Voice Synthesis Models
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {engines.filter((e) => e.category === "tts").map((model) => {
                      const isAllowed = activeTenant.allowedTTS.includes(model.id) || activeTenant.allowedTTS.some((m) => model.name.toLowerCase().includes(m));

                      return (
                        <div
                          key={model.id}
                          onClick={() => toggleTenantEngine(activeTenant.id, "tts", model.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isAllowed ? "bg-[#EEF2FD] border-[#3157D5]/40 text-[#3157D5]" : "bg-white border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-[#0F172A]">{model.name}</p>
                            <p className="text-[10px] text-[#64748B]">{model.latencyAvgMs}ms • {model.costPerUnit}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#3157D5] focus:ring-[#3157D5]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STT */}
                <div className="space-y-2">
                  <span className="font-extrabold uppercase tracking-wider text-[#64748B] text-[10px] block">
                    STT Speech-to-Text Transcription Models
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {engines.filter((e) => e.category === "stt").map((model) => {
                      const isAllowed = activeTenant.allowedSTT.includes(model.id) || activeTenant.allowedSTT.some((m) => model.name.toLowerCase().includes(m));

                      return (
                        <div
                          key={model.id}
                          onClick={() => toggleTenantEngine(activeTenant.id, "stt", model.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isAllowed ? "bg-[#EEF2FD] border-[#3157D5]/40 text-[#3157D5]" : "bg-white border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-[#0F172A]">{model.name}</p>
                            <p className="text-[10px] text-[#64748B]">{model.latencyAvgMs}ms • {model.costPerUnit}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#3157D5] focus:ring-[#3157D5]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setTenantMatrixModalOpen(false)}
                className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Save Entitlements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Engine Confirmation Modal */}
      {engineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Delete Voice AI Engine</h3>
              </div>
              <button
                onClick={() => setEngineToDelete(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#64748B]">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-[#0F172A] font-bold">{engineToDelete.name}</strong>?
              </p>
              <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1 font-mono text-[11px]">
                <p><span className="text-[#64748B]">Provider:</span> <strong className="text-[#0F172A]">{engineToDelete.provider}</strong></p>
                <p><span className="text-[#64748B]">Category:</span> <strong className="text-[#0F172A]">{engineToDelete.category.toUpperCase()}</strong></p>
                <p><span className="text-[#64748B]">Identifier:</span> <strong className="text-[#0F172A]">{engineToDelete.modelIdentifier}</strong></p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[11px] font-semibold leading-relaxed">
                  This model will be permanently deleted from the database and will no longer be available for tenant assignment or voice agents.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setEngineToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEngine(engineToDelete.id);
                  setEngineToDelete(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                Permanently Delete Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
