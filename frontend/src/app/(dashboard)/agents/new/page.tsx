"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Agent, VoiceConfig, AgentTool } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { AudioWaveform } from "@/components/audio-waveform";
import {
  Bot,
  Sparkles,
  Volume2,
  Sliders,
  BookOpen,
  Wrench,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Trash2,
  ShieldCheck,
  Send,
  Zap,
  Check,
  ChevronDown,
  Info,
  Search,
  Globe,
  User,
  Users,
} from "lucide-react";
import { NEURAL_VOICE_PERSONAS, SUPPORTED_LANGUAGES, NeuralVoicePersona } from "@/lib/neural-voices";
import { playKokoroNeuralAudio, stopNeuralAudio } from "@/lib/tts-service";

export interface LLMModelOption {
  id: string;
  name: string;
  provider: string;
  fullName: string;
}

export const LLM_MODEL_OPTIONS: LLMModelOption[] = [
  {
    id: "Qwen/Qwen2.5-7B-Instruct-AWQ",
    name: "Qwen 2.5 7B Instruct AWQ",
    provider: "vLLM Neural LLM Engine",
    fullName: "Qwen/Qwen2.5-7B-Instruct-AWQ",
  },
];

export default function CreateAgentPage() {
  const router = useRouter();
  const { addAgent, knowledgeSources, availableLlmModels, phoneNumbers, assignPhoneNumber, addToast } = useAppStore();

  const [step, setStep] = useState<number>(1);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Dynamic models set by Super Admin in Database
  const llmOptions = availableLlmModels && availableLlmModels.length > 0 ? availableLlmModels : LLM_MODEL_OPTIONS;

  // Form State
  const [name, setName] = useState("Apex Inbound Assistant");
  const [description, setDescription] = useState("Autonomous voice agent handling customer inquiries, lead qualification, and scheduling.");
  const [color, setColor] = useState("#3157D5");
  const [language, setLanguage] = useState("English (US)");
  const [assignedPhoneNumberId, setAssignedPhoneNumberId] = useState("");

  // Multi-Language Neural Voice State
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("af_heart");
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>("all");
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<"all" | "female" | "male">("all");
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voiceStability, setVoiceStability] = useState(0.8);
  const [voicePitch, setVoicePitch] = useState(0.0);

  // Human Polish & Conversational Realism State
  const [enableMicroBreaths, setEnableMicroBreaths] = useState(true);
  const [enableBackchanneling, setEnableBackchanneling] = useState(true);
  const [enableAdaptiveEmotion, setEnableAdaptiveEmotion] = useState(true);
  const [maxWordsPerTurn, setMaxWordsPerTurn] = useState(25);
  const [fillerFrequency, setFillerFrequency] = useState<"low" | "medium" | "high">("medium");
  const [enableVoiceBlend, setEnableVoiceBlend] = useState(false);
  const [secondaryVoiceId, setSecondaryVoiceId] = useState("af_bella");
  const [blendRatio, setBlendRatio] = useState(0.30);

  const selectedVoice = NEURAL_VOICE_PERSONAS.find((v) => v.id === selectedVoiceId) || NEURAL_VOICE_PERSONAS[0];

  const filteredVoices = NEURAL_VOICE_PERSONAS.filter((v) => {
    const matchesLang = selectedLanguageFilter === "all" || v.language === selectedLanguageFilter;
    const matchesGender = selectedGenderFilter === "all" || v.gender === selectedGenderFilter;
    const matchesSearch =
      v.voiceName.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
      v.tone.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
      v.language.toLowerCase().includes(voiceSearchQuery.toLowerCase());
    return matchesLang && matchesGender && matchesSearch;
  });

  const playVoiceSample = async (voice: NeuralVoicePersona, customText?: string) => {
    if (playingVoiceId === voice.id && !customText) {
      stopNeuralAudio();
      setPlayingVoiceId(null);
      setIsPlayingSample(false);
      return;
    }

    const textToSpeak = customText || greeting || voice.sampleText;
    addToast({
      title: `Auditioning: ${voice.flag} ${voice.voiceName}`,
      description: `Kokoro Neural Model • Speed: ${voiceSpeed}x`,
      type: "info",
    });

    const result = await playKokoroNeuralAudio(
      textToSpeak,
      voice.id,
      voiceSpeed,
      () => {
        setPlayingVoiceId(voice.id);
        setIsPlayingSample(true);
      },
      () => {
        setPlayingVoiceId(null);
        setIsPlayingSample(false);
      }
    );

    if (!result.success) {
      addToast({
        title: "GPU Server Offline",
        description: result.error || "Could not reach GPU server (77.54.200.11:15188). Start GPU TTS service to audition real neural audio.",
        type: "error",
      });
    }
  };

  // LLM State
  const [selectedLlmId, setSelectedLlmId] = useState<string>(() => llmOptions[0]?.id || "Qwen/Qwen2.5-7B-Instruct-AWQ");
  const [isLlmDropdownOpen, setIsLlmDropdownOpen] = useState(false);
  const [llmSearch, setLlmSearch] = useState("");

  const activeLlmOption = llmOptions.find((m) => m.id === selectedLlmId) || llmOptions[0] || LLM_MODEL_OPTIONS[0];

  // Instructions State
  const [greeting, setGreeting] = useState("Hi there! Thanks for calling. My name is Rachel, your voice assistant. How can I help you today?");
  const [systemPrompt, setSystemPrompt] = useState(`You are Rachel, a professional voice assistant.
Your goal is to answer questions, understand requirements, and help qualify the caller.
Always keep responses concise, conversational, and under 30 words per turn.
If the customer wants a meeting, use the book_appointment tool.`);
  const [responseStyle, setResponseStyle] = useState<Agent["responseStyle"]>("conversational");
  const [interruptionSensitivity, setInterruptionSensitivity] = useState(0.75);
  const [silenceTimeout, setSilenceTimeout] = useState(5);
  const [maxCallDuration, setMaxCallDuration] = useState(15);

  // Knowledge & Tools
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>(["kb-1"]);
  const [tools, setTools] = useState<AgentTool[]>([
    { id: "t1", name: "book_appointment", description: "Schedules meetings on calendar", enabled: true, type: "calendar" },
    { id: "t2", name: "crm_lead_enrich", description: "Enriches caller company data", enabled: true, type: "crm" },
    { id: "t3", name: "transfer_to_sales_rep", description: "Transfers to human sales rep", enabled: true, type: "function" },
  ]);

  // Call Behavior
  const [transferNumber, setTransferNumber] = useState("+1 (800) 555-0199");
  const [transferTrigger, setTransferTrigger] = useState("human, representative, manager");
  const [goodbyePhrase, setGoodbyePhrase] = useState("Thank you for speaking with us. Have a wonderful day!");

  const steps = [
    { number: 1, title: "Identity", icon: Bot },
    { number: 2, title: "Voice & Audio", icon: Volume2 },
    { number: 3, title: "Instructions", icon: Sliders },
    { number: 4, title: "Knowledge Base", icon: BookOpen },
    { number: 5, title: "Tools & Actions", icon: Wrench },
    { number: 6, title: "Call Behavior", icon: PhoneCall },
    { number: 7, title: "Review & Deploy", icon: CheckCircle2 },
  ];

  const handleSave = (status: "active" | "draft" = "active") => {
    const selectedPhone = phoneNumbers.find((p) => p.id === assignedPhoneNumberId);
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name,
      description,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      color,
      status,
      llmModel: activeLlmOption.fullName,
      assignedPhoneNumber: selectedPhone ? (selectedPhone.formattedNumber || selectedPhone.number) : undefined,
      assignedPhoneNumberId: selectedPhone?.id || undefined,
      voice: {
        provider: "Kokoro Neural",
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.voiceName,
        gender: selectedVoice.gender,
        accent: selectedVoice.language,
        speed: voiceSpeed,
        pitch: voicePitch,
        stability: voiceStability,
        similarity: 0.9,
      },
      language: selectedVoice.language,
      greeting,
      systemPrompt,
      responseStyle,
      interruptionSensitivity,
      silenceTimeoutSeconds: silenceTimeout,
      maxCallDurationMinutes: maxCallDuration,
      knowledgeBaseIds: selectedKbIds,
      tools,
      humanRealism: {
        enableMicroBreaths,
        enableBackchanneling,
        enableAdaptiveEmotion,
        maxWordsPerTurn,
        fillerFrequency,
        voiceBlend: {
          enabled: enableVoiceBlend,
          secondaryVoiceId,
          blendRatio,
        },
      },
      transferRules: {
        enabled: true,
        destinationNumber: transferNumber,
        triggerPhrase: transferTrigger,
        department: "Sales & Support",
      },
      callEndingRules: {
        goodbyePhrase,
        hangupOnSilence: true,
        afterHoursBehavior: "voicemail",
      },
      metrics: {
        totalCalls: 0,
        avgDurationSeconds: 0,
        successRate: 100,
        sentimentScore: 90,
        connectedCalls: 0,
      },
      lastUpdated: new Date().toISOString(),
    };

    addAgent(newAgent);
    if (selectedPhone) {
      assignPhoneNumber(selectedPhone.id, {
        assignedAgentId: newAgent.id,
      });
    }
    router.push(`/agents/${newAgent.id}/test`);
  };

  const toggleKb = (id: string) => {
    setSelectedKbIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleTool = (id: string) => {
    setTools((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Studio & Orchestrator"
        description="Configure personality, neural speech synthesis, API tools, and escalation logic in 7 guided steps."
      />

      {/* Step Indicator Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isDone = step > s.number;
            const isCurrent = step === s.number;
            return (
              <React.Fragment key={s.number}>
                <button
                  onClick={() => setStep(s.number)}
                  className="flex items-center gap-2 text-left focus:outline-hidden group"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? "bg-[#16A36A] text-white"
                        : isCurrent
                        ? "bg-[#3157D5] text-white shadow-md shadow-[#3157D5]/20 ring-4 ring-[#3157D5]/10"
                        : "bg-[#F4F7FB] text-[#78849A] group-hover:bg-[#E5EAF2]"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${isCurrent ? "text-[#3157D5]" : isDone ? "text-[#172033]" : "text-[#78849A]"}`}>
                      {s.title}
                    </span>
                    <span className="text-[10px] text-[#78849A]">Step {s.number} of 7</span>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > idx + 1 ? "bg-[#16A36A]" : "bg-[#E5EAF2]"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wizard Content Step Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Step Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E5EAF2] card-shadow space-y-6">
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-bold text-[#172033]">1. Agent Identity & Archetype</h2>
                <p className="text-xs text-[#78849A]">Define the public name, role, and visual appearance of your voice assistant.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">Agent Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apex Inbound Qualifier Pro"
                    className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">Description & Role Purpose</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this agent accomplishes during calls..."
                    className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">Primary Language (All 21 Languages)</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-medium text-[#172033] outline-none focus:border-[#3157D5]"
                    >
                      <option value="English (US)">🇺🇸 English (US)</option>
                      <option value="English (UK)">🇬🇧 English (UK)</option>
                      <option value="Spanish (ES)">🇪🇸 Spanish (Español)</option>
                      <option value="French (FR)">🇫🇷 French (Français)</option>
                      <option value="German (DE)">🇩🇪 German (Deutsch)</option>
                      <option value="Italian (IT)">🇮🇹 Italian (Italiano)</option>
                      <option value="Portuguese (BR)">🇧🇷 Portuguese (Português)</option>
                      <option value="Russian (RU)">🇷🇺 Russian (Русский)</option>
                      <option value="Chinese (ZH)">🇨🇳 Chinese (中文 / 普通话)</option>
                      <option value="Japanese (JA)">🇯🇵 Japanese (日本語)</option>
                      <option value="Arabic (AR)">🇸🇦 Arabic (العربية)</option>
                      <option value="Hindi (HI)">🇮🇳 Hindi (हिन्दी)</option>
                      <option value="Urdu (UR)">🇵🇰 Urdu (اردو)</option>
                      <option value="Turkish (TR)">🇹🇷 Turkish (Türkçe)</option>
                      <option value="Dutch (NL)">🇳🇱 Dutch (Nederlands)</option>
                      <option value="Polish (PL)">🇵🇱 Polish (Polski)</option>
                      <option value="Swedish (SV)">🇸🇪 Swedish (Svenska)</option>
                      <option value="Indonesian (ID)">🇮🇩 Indonesian (Bahasa)</option>
                      <option value="Vietnamese (VI)">🇻🇳 Vietnamese (Tiếng Việt)</option>
                      <option value="Korean (KO)">🇰🇷 Korean (한국어)</option>
                      <option value="Bengali (BN)">🇧🇩 Bengali (বাংলা)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">Brand Accent Color</label>
                    <div className="flex items-center gap-2 pt-1">
                      {["#3157D5", "#16A36A", "#D99025", "#6366F1", "#0D9488", "#E11D48"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                            color === c ? "ring-2 ring-offset-2 ring-[#3157D5] scale-110" : "opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Allocated Phone Number Routing */}
                <div className="pt-3 border-t border-[#E5EAF2]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#172033]">
                      Assigned Dedicated Phone Number (Inbound DID)
                    </label>
                    <Link
                      href="/phone-numbers"
                      className="text-[11px] text-[#3157D5] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>+ Provision New Number</span>
                    </Link>
                  </div>

                  <select
                    value={assignedPhoneNumberId}
                    onChange={(e) => setAssignedPhoneNumberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-medium text-[#172033] outline-none focus:border-[#3157D5]"
                  >
                    <option value="">-- None (Outbound Campaigns / Web Only) --</option>
                    {phoneNumbers.map((pn) => (
                      <option key={pn.id} value={pn.id}>
                        {pn.formattedNumber || pn.number} • {pn.friendlyName} {pn.assignedAgentId ? `(Assigned: ${pn.assignedAgentName || "Agent"})` : "(Available)"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#78849A] mt-1">
                    Inbound voice calls to this allocated phone number will route directly to this AI agent.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VOICE & LLM REASONING ENGINE */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-bold text-[#172033]">2. LLM Reasoning Model & Neural Voice</h2>
                <p className="text-xs text-[#78849A]">Select your core reasoning LLM model (vLLM Neural Engine, OpenAI, Google Gemini) and customize voice persona.</p>
              </div>

              {/* LLM Model Dropdown Selector (Matching Screenshots 1 & 2) */}
              <div className="space-y-1.5 relative">
                <div className="flex items-center gap-1.5">
                  <label className="block text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]">
                    LLM Model <span className="text-rose-500">*</span>
                  </label>
                  <div className="group relative inline-flex">
                    <Info className="w-3.5 h-3.5 text-[#94A3B8] cursor-pointer" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-64 p-2.5 bg-[#0F172A] text-white text-[11px] rounded-xl shadow-xl z-30 pointer-events-none">
                      Choose the AI model for your agent. Different models offer varying levels of performance and capabilities.
                    </div>
                  </div>
                </div>

                {/* Dropdown Trigger (Matching Screenshot 2) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLlmDropdownOpen(!isLlmDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0F172A] border-2 border-[#3157D5] rounded-xl text-xs font-medium text-[#172033] dark:text-[#F8FAFC] flex items-center justify-between shadow-2xs cursor-pointer focus:outline-hidden"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{activeLlmOption?.fullName || "Qwen/Qwen2.5-7B-Instruct-AWQ"}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${isLlmDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <p className="text-[11px] text-[#78849A] dark:text-[#94A3B8] mt-1">
                    Choose the AI model for your agent. Different models offer varying levels of performance and capabilities.
                  </p>

                  {/* Dropdown List (Matching Screenshot 1) */}
                  {isLlmDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsLlmDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-2xl shadow-2xl p-1.5 z-30 max-h-72 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                        {llmOptions.map((m) => {
                          const isSelected = selectedLlmId === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedLlmId(m.id);
                                setIsLlmDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer text-left ${
                                isSelected
                                  ? "bg-[#EEF2FD] dark:bg-[#3157D5]/20 text-[#3157D5] dark:text-[#93C5FD] font-bold"
                                  : "text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#161F30]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-[#3157D5] shrink-0" />
                                ) : (
                                  <span className="w-3.5" />
                                )}
                                <span>{m.fullName}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Multi-Language Neural Voice Selector */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#172033] dark:text-white">
                      Kokoro-82M Neural Voice Persona ({NEURAL_VOICE_PERSONAS.length} Models • English US & UK)
                    </label>
                    <p className="text-[11px] text-[#78849A]">
                      Select ultra-low latency Kokoro-82M neural voices with native accents and prosody.
                    </p>
                  </div>

                  {/* Gender Filter */}
                  <div className="flex items-center gap-1 bg-[#F4F7FB] dark:bg-[#1E293B] p-1 rounded-xl border border-[#E2E8F0] dark:border-[#334155] self-start">
                    {(["all", "female", "male"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGenderFilter(g)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-all cursor-pointer ${
                          selectedGenderFilter === g
                            ? "bg-[#3157D5] text-white shadow-2xs"
                            : "text-[#64748B] hover:text-[#0F172A]"
                        }`}
                      >
                        {g === "all" ? "All Genders" : g === "female" ? "Female" : "Male"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Filter Pills — Only English (US) and English (UK) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguageFilter === lang.value;
                    return (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => setSelectedLanguageFilter(selectedLanguageFilter === lang.value ? "all" : lang.value)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-[#3157D5] text-white shadow-xs"
                            : "bg-white dark:bg-[#0F172A] text-[#64748B] hover:text-[#0F172A] hover:bg-[#EEF2FD] border border-[#E2E8F0] dark:border-[#1E293B]"
                        }`}
                      >
                        <span className="text-[10px] font-bold px-1 rounded bg-black/10 dark:bg-white/10">
                          {lang.flag}
                        </span>
                        <span>{lang.label}</span>
                      </button>
                    );
                  })}
                </div>



                {/* Voice Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search voice by persona, country, or tone (e.g. British, Spanish, Executive, Sales)..."
                    value={voiceSearchQuery}
                    onChange={(e) => setVoiceSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl text-xs text-[#0F172A] dark:text-white outline-none focus:border-[#3157D5]"
                  />
                </div>

                {/* Neural Voice Persona Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {filteredVoices.map((voice) => {
                    const isSelected = selectedVoiceId === voice.id;
                    const isPlaying = playingVoiceId === voice.id;

                    return (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoiceId(voice.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#EEF2FD] dark:bg-[#3157D5]/15 border-[#3157D5] ring-2 ring-[#3157D5]/20 shadow-xs"
                            : "bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#CBD5E1]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl shrink-0">{voice.flag}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">{voice.voiceName}</h4>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#3157D5]" />}
                              </div>
                              <span className="text-[10px] text-[#64748B] font-mono block">
                                {voice.language} • {voice.gender.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full shrink-0 ${
                            voice.category === "sales"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : voice.category === "executive"
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          }`}>
                            {voice.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] line-clamp-1 mb-2">
                          {voice.tone}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]/60 dark:border-[#1E293B]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoiceSample(voice);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                              isPlaying
                                ? "bg-rose-500 text-white animate-pulse"
                                : "bg-[#F4F7FB] dark:bg-[#1E293B] text-[#3157D5] hover:bg-[#EEF2FD]"
                            }`}
                          >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{isPlaying ? "Stop Audio" : "Play Sample"}</span>
                          </button>

                          <span className="text-[10px] font-mono text-[#94A3B8]">Kokoro-82M</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sliders for Speed & Pitch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F4F7FB] dark:bg-[#0F172A] rounded-2xl border border-[#E5EAF2] dark:border-[#1E293B]">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#172033] dark:text-white">Speaking Speed</span>
                    <span className="font-mono font-bold text-[#3157D5]">{voiceSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-full accent-[#3157D5]"
                  />
                  <div className="flex justify-between text-[9px] text-[#94A3B8] mt-0.5">
                    <span>0.8x (Deliberate)</span>
                    <span>1.0x (Normal)</span>
                    <span>1.3x (Fast SDR)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#172033] dark:text-white">Voice Stability & Clarity</span>
                    <span className="font-mono font-bold text-[#3157D5]">{voiceStability}</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={voiceStability}
                    onChange={(e) => setVoiceStability(parseFloat(e.target.value))}
                    className="w-full accent-[#3157D5]"
                  />
                  <div className="flex justify-between text-[9px] text-[#94A3B8] mt-0.5">
                    <span>0.3 (More Expressive)</span>
                    <span>0.8 (Balanced)</span>
                    <span>1.0 (Exact Consistent)</span>
                  </div>
                </div>
              </div>

              {/* Human Polish & Conversational Realism Controls */}
              <div className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border-2 border-[#3157D5]/20 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#3157D5]" />
                    <h3 className="text-xs font-bold text-[#172033] dark:text-white">
                      Human Polish & Conversational Realism
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#3157D5] bg-[#EEF2FD] dark:bg-[#3157D5]/20 px-2 py-0.5 rounded-full">
                    Acoustic Intelligence
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Micro-Breaths */}
                  <label className="flex items-start gap-2.5 p-3 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] cursor-pointer hover:border-[#3157D5] transition-colors">
                    <input
                      type="checkbox"
                      checked={enableMicroBreaths}
                      onChange={(e) => setEnableMicroBreaths(e.target.checked)}
                      className="mt-0.5 rounded-sm accent-[#3157D5]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white">Natural Micro-Breaths</p>
                      <p className="text-[10px] text-[#64748B]">Injects respiratory pauses before multi-clause sentences.</p>
                    </div>
                  </label>

                  {/* Active Backchanneling */}
                  <label className="flex items-start gap-2.5 p-3 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] cursor-pointer hover:border-[#3157D5] transition-colors">
                    <input
                      type="checkbox"
                      checked={enableBackchanneling}
                      onChange={(e) => setEnableBackchanneling(e.target.checked)}
                      className="mt-0.5 rounded-sm accent-[#3157D5]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white">Active Backchanneling</p>
                      <p className="text-[10px] text-[#64748B]">Sub-100ms conversational nods (&quot;Gotcha&quot;, &quot;Mmhmm&quot;, &quot;Right&quot;).</p>
                    </div>
                  </label>

                  {/* Adaptive Emotion */}
                  <label className="flex items-start gap-2.5 p-3 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] cursor-pointer hover:border-[#3157D5] transition-colors">
                    <input
                      type="checkbox"
                      checked={enableAdaptiveEmotion}
                      onChange={(e) => setEnableAdaptiveEmotion(e.target.checked)}
                      className="mt-0.5 rounded-sm accent-[#3157D5]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white">Adaptive Emotion</p>
                      <p className="text-[10px] text-[#64748B]">Dynamically adjusts pitch & speed based on caller mood.</p>
                    </div>
                  </label>
                </div>

                {/* Max Words Per Turn & Voice Blend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-[#172033] dark:text-white">Max Words Per Turn</span>
                      <span className="font-mono font-bold text-[#3157D5]">{maxWordsPerTurn} words</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="45"
                      step="5"
                      value={maxWordsPerTurn}
                      onChange={(e) => setMaxWordsPerTurn(parseInt(e.target.value))}
                      className="w-full accent-[#3157D5]"
                    />
                    <div className="flex justify-between text-[9px] text-[#94A3B8] mt-0.5">
                      <span>15w (Ultra Fast)</span>
                      <span>25w (Natural Phone Cadence)</span>
                      <span>45w (Detailed)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#172033] dark:text-white flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={enableVoiceBlend}
                          onChange={(e) => setEnableVoiceBlend(e.target.checked)}
                          className="rounded-sm accent-[#3157D5]"
                        />
                        <span>Custom Voice Blending</span>
                      </label>
                      {enableVoiceBlend && (
                        <span className="font-mono text-xs font-bold text-[#3157D5]">
                          {Math.round((1 - blendRatio) * 100)}% / {Math.round(blendRatio * 100)}%
                        </span>
                      )}
                    </div>

                    {enableVoiceBlend ? (
                      <div className="space-y-2">
                        <select
                          value={secondaryVoiceId}
                          onChange={(e) => setSecondaryVoiceId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#F4F7FB] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-xs text-[#0F172A] dark:text-white outline-none"
                        >
                          {NEURAL_VOICE_PERSONAS.filter((v) => v.id !== selectedVoiceId).map((v) => (
                            <option key={v.id} value={v.id}>
                              Blend with: {v.flag} {v.voiceName} ({v.language})
                            </option>
                          ))}
                        </select>
                        <input
                          type="range"
                          min="0.10"
                          max="0.50"
                          step="0.05"
                          value={blendRatio}
                          onChange={(e) => setBlendRatio(parseFloat(e.target.value))}
                          className="w-full accent-[#3157D5]"
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#78849A]">
                        Enable to blend two neural voice vectors together for a completely bespoke acoustic timbre.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INSTRUCTIONS */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-bold text-[#172033]">3. Instructions & Conversation Rules</h2>
                <p className="text-xs text-[#78849A]">Set the initial greeting, system prompt, interruption tolerance, and response style.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">First Greeting Message</label>
                <textarea
                  rows={2}
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5] leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#172033]">System Persona & Core Prompt</label>
                  <div className="flex items-center gap-1">
                    {["{{contact_name}}", "{{company}}", "{{current_time}}"].map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setSystemPrompt((prev) => `${prev} ${token}`)}
                        className="text-[10px] font-mono bg-[#EEF2FD] text-[#3157D5] px-1.5 py-0.5 rounded-md hover:bg-[#E0E7FB]"
                      >
                        +{token}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={7}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-mono text-[#172033] outline-none focus:border-[#3157D5] leading-relaxed"
                />
              </div>

              <div className="p-4 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2]">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#172033]">Interruption Sensitivity</span>
                  <span className="font-mono font-bold text-[#3157D5]">{interruptionSensitivity}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={interruptionSensitivity}
                  onChange={(e) => setInterruptionSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-[#3157D5] cursor-pointer"
                />
                <p className="text-[11px] text-[#78849A] mt-1">
                  Adjust how quickly the agent yields speaking turns when the caller interrupts.
                </p>
              </div>
            </div>
          )}


          {/* STEP 4: KNOWLEDGE BASE */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-bold text-[#172033]">4. Grounding & Knowledge Base</h2>
                <p className="text-xs text-[#78849A]">Attach enterprise documentation and FAQs for real-time vector retrieval during calls.</p>
              </div>

              <div className="space-y-3">
                {knowledgeSources.map((kb) => {
                  const isAssigned = selectedKbIds.includes(kb.id);
                  return (
                    <div
                      key={kb.id}
                      onClick={() => toggleKb(kb.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isAssigned
                          ? "bg-[#EEF2FD] border-[#3157D5] ring-2 ring-[#3157D5]/10"
                          : "bg-[#F4F7FB] border-[#E5EAF2] hover:bg-[#EDF2F7]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isAssigned ? "bg-[#3157D5] text-white" : "bg-white text-[#78849A]"
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#172033]">{kb.name}</p>
                          <p className="text-[10px] text-[#78849A]">{kb.chunkCount} indexed vector chunks • {kb.type.toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isAssigned ? "bg-[#3157D5] text-white" : "bg-white text-[#78849A]"}`}>
                          {isAssigned ? "Attached" : "Attach"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: TOOLS */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-bold text-[#172033]">5. Tools & Autonomous Actions</h2>
                <p className="text-xs text-[#78849A]">Enable real-time function calling for live calendar booking, CRM queries, and SMS dispatch.</p>
              </div>

              <div className="space-y-3">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-4 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#E5EAF2] text-[#3157D5] flex items-center justify-center">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#172033] font-mono">{tool.name}()</h4>
                        <p className="text-[11px] text-[#78849A]">{tool.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleTool(tool.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        tool.enabled ? "bg-[#16A36A] text-white" : "bg-white border border-[#E5EAF2] text-[#78849A]"
                      }`}
                    >
                      {tool.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: CALL BEHAVIOR */}
          {step === 6 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-bold text-[#172033]">6. Call Behaviors & Human Escalation</h2>
                <p className="text-xs text-[#78849A]">Define warm transfer destinations, goodbye statements, and timeout rules.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">Human Transfer Phone Number</label>
                  <input
                    type="text"
                    value={transferNumber}
                    onChange={(e) => setTransferNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">Escalation Trigger Phrases (Comma separated)</label>
                  <input
                    type="text"
                    value={transferTrigger}
                    onChange={(e) => setTransferTrigger(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">Closing Goodbye Statement</label>
                  <input
                    type="text"
                    value={goodbyePhrase}
                    onChange={(e) => setGoodbyePhrase(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW */}
          {step === 7 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-bold text-[#172033]">7. Review & Deploy Voice Agent</h2>
                <p className="text-xs text-[#78849A]">Inspect complete configuration before activating live channels.</p>
              </div>

              <div className="p-4 bg-[#F4F7FB] rounded-2xl border border-[#E5EAF2] space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF2]">
                  <span className="font-bold text-sm text-[#172033]">{name}</span>
                  <span className="font-semibold text-[#3157D5] bg-[#EEF2FD] px-2.5 py-0.5 rounded-full">
                    {selectedVoice.flag} {selectedVoice.voiceName} ({selectedVoice.language})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-[#78849A]">Language:</span> <strong className="text-[#172033]">{language}</strong></div>
                  <div><span className="text-[#78849A]">Interruption:</span> <strong className="text-[#172033] font-mono">{interruptionSensitivity}</strong></div>
                  <div><span className="text-[#78849A]">Attached KB:</span> <strong className="text-[#172033]">{selectedKbIds.length} sources</strong></div>
                  <div><span className="text-[#78849A]">Active Tools:</span> <strong className="text-[#172033]">{tools.filter((t) => t.enabled).length} enabled</strong></div>

                  <div className="col-span-2 pt-1 border-t border-[#E5EAF2]">
                    <span className="text-[#78849A]">Assigned DID:</span>{" "}
                    <strong className="text-[#3157D5]">
                      {assignedPhoneNumberId
                        ? phoneNumbers.find((p) => p.id === assignedPhoneNumberId)?.formattedNumber ||
                          phoneNumbers.find((p) => p.id === assignedPhoneNumberId)?.number ||
                          "Allocated Phone Number"
                        : "None (Outbound / Web Only)"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-[#EDF2F7] flex items-center justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#78849A] hover:text-[#172033] disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave("draft")}
                className="px-4 py-2 bg-white hover:bg-[#F4F7FB] border border-[#E5EAF2] text-[#172033] text-xs font-semibold rounded-xl transition-all"
              >
                Save Draft
              </button>

              {step < 7 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => Math.min(7, prev + 1))}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSave("active")}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#16A36A] hover:bg-[#138A5A] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Deploy & Open Simulator</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Simulator Preview (1 col) */}
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Live Agent Simulator</h3>
              <span className="text-[10px] font-bold text-[#16A36A] bg-[#E8F7F0] px-2 py-0.5 rounded-full">
                Ready
              </span>
            </div>

            {/* Simulated Voice Preview Card */}
            <div className="p-4 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
                  style={{ backgroundColor: color }}
                >
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#172033]">{name}</p>
                  <p className="text-[10px] text-[#78849A] flex items-center gap-1">
                    <span>{selectedVoice.flag}</span>
                    <span>{selectedVoice.voiceName}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                  <span className="font-semibold">Speech Text (Editable)</span>
                  <span className="text-[10px] text-[#94A3B8]">Type to audition</span>
                </div>
                <textarea
                  rows={3}
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Enter greeting or speech script to audition..."
                  className="w-full p-2.5 bg-white rounded-xl border border-[#E5EAF2] text-xs text-[#172033] font-medium outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-[#3157D5] leading-relaxed resize-none transition-all"
                />
              </div>


              {/* Waveform Graph - Only animates when agent is speaking */}
              <AudioWaveform
                active={isPlayingSample}
                audioLevel={isPlayingSample ? 75 : 0}
                color={color}
                speaker="agent"
                label={isPlayingSample ? "AI Agent Speaking (Live)..." : "Audio Stream (Idle / Silent)"}
              />

              {/* Direct Play/Audition Button on Simulator */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => playVoiceSample(selectedVoice, greeting)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isPlayingSample
                      ? "bg-rose-500 text-white shadow-xs animate-pulse"
                      : "bg-[#3157D5] text-white hover:bg-[#2646B8] shadow-xs"
                  }`}
                >
                  {isPlayingSample ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingSample ? "Stop Speaking" : "Audition Voice"}</span>
                </button>
                <span className="text-[10px] text-[#78849A] font-mono">
                  {isPlayingSample ? "75% Output" : "Idle (0%)"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#EEF2FD] rounded-xl border border-[#3157D5]/20 text-[11px] text-[#3157D5] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Fast Test Simulator
              </p>
              <p className="text-[10px] text-[#78849A]">
                Once deployed, you can interact with full speech-to-speech simulation in the Playground.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
