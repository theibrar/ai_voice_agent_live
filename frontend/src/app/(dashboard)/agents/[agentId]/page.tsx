"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  Bot,
  Volume2,
  Sliders,
  BookOpen,
  Wrench,
  PhoneCall,
  Sparkles,
  ArrowLeft,
  Save,
  Play,
  Pause,
  Copy,
  Trash2,
  Check,
  ChevronDown,
  Info,
  Search,
  CheckCircle2,
} from "lucide-react";
import { LLM_MODEL_OPTIONS } from "../new/page";
import { NEURAL_VOICE_PERSONAS, SUPPORTED_LANGUAGES, NeuralVoicePersona } from "@/lib/neural-voices";
import { playKokoroNeuralAudio, stopNeuralAudio } from "@/lib/tts-service";

export default function EditAgentPage() {
  const routeParams = useParams<{ agentId: string }>();
  const currentAgentId = routeParams?.agentId || "";
  const router = useRouter();
  const { agents, updateAgent, knowledgeSources, availableLlmModels, phoneNumbers, assignPhoneNumber, addToast } = useAppStore();

  const agent = agents.find((a) => a.id === currentAgentId) || agents[0];

  const [activeTab, setActiveTab] = useState<"general" | "voice" | "instructions" | "knowledge" | "tools" | "behavior">("general");

  // Dynamic models set by Super Admin in Database
  const llmOptions = availableLlmModels && availableLlmModels.length > 0 ? availableLlmModels : LLM_MODEL_OPTIONS;

  // Local edit states initialized from agent
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description);
  const [language, setLanguage] = useState(agent.language || "English (US)");
  const [assignedPhoneNumberId, setAssignedPhoneNumberId] = useState(() => {
    return agent.assignedPhoneNumberId || (phoneNumbers.find((p) => p.assignedAgentId === agent.id)?.id || "");
  });
  const [selectedLlmId, setSelectedLlmId] = useState<string>(() => {
    const matched = llmOptions.find((m) => m.fullName === agent?.llmModel || m.name === agent?.llmModel);
    return matched?.id || llmOptions[0]?.id || "Qwen/Qwen2.5-7B-Instruct-AWQ";
  });
  const [isLlmDropdownOpen, setIsLlmDropdownOpen] = useState(false);
  const [greeting, setGreeting] = useState(agent.greeting);
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);

  // Multi-Language Neural Voice States
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    return agent.voice?.voiceId || NEURAL_VOICE_PERSONAS.find((v) => v.voiceName === agent.voice?.voiceName)?.id || "af_heart";
  });
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>("all");
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<"all" | "female" | "male">("all");
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
  const [voiceSpeed, setVoiceSpeed] = useState(agent.voice?.speed || 1.0);
  const [voiceStability, setVoiceStability] = useState(agent.voice?.stability || 0.8);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Human Polish & Realism States
  const [enableMicroBreaths, setEnableMicroBreaths] = useState(agent.humanRealism?.enableMicroBreaths ?? true);
  const [enableBackchanneling, setEnableBackchanneling] = useState(agent.humanRealism?.enableBackchanneling ?? true);
  const [enableAdaptiveEmotion, setEnableAdaptiveEmotion] = useState(agent.humanRealism?.enableAdaptiveEmotion ?? true);
  const [maxWordsPerTurn, setMaxWordsPerTurn] = useState(agent.humanRealism?.maxWordsPerTurn ?? 25);
  const [fillerFrequency, setFillerFrequency] = useState<"low" | "medium" | "high">(agent.humanRealism?.fillerFrequency ?? "medium");
  const [enableVoiceBlend, setEnableVoiceBlend] = useState(agent.humanRealism?.voiceBlend?.enabled ?? false);
  const [secondaryVoiceId, setSecondaryVoiceId] = useState(agent.humanRealism?.voiceBlend?.secondaryVoiceId ?? "af_bella");
  const [blendRatio, setBlendRatio] = useState(agent.humanRealism?.voiceBlend?.blendRatio ?? 0.30);

  const [selectedKbIds, setSelectedKbIds] = useState<string[]>(agent.knowledgeBaseIds || []);
  const [tools, setTools] = useState(agent.tools || []);

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
      () => setPlayingVoiceId(voice.id),
      () => setPlayingVoiceId(null)
    );

    if (!result.success) {
      addToast({
        title: "GPU Server Offline",
        description: result.error || "Could not reach GPU server (77.54.200.11:15188). Start GPU TTS service to audition real neural audio.",
        type: "error",
      });
    }
  };

  const activeLlmOption = llmOptions.find((m) => m.id === selectedLlmId) || llmOptions[0] || LLM_MODEL_OPTIONS[0];

  const handleSave = () => {
    const selectedPhone = phoneNumbers.find((p) => p.id === assignedPhoneNumberId);
    const updated = {
      ...agent,
      name,
      description,
      llmModel: activeLlmOption.fullName,
      greeting,
      systemPrompt,
      assignedPhoneNumber: selectedPhone ? (selectedPhone.formattedNumber || selectedPhone.number) : undefined,
      assignedPhoneNumberId: selectedPhone?.id || undefined,
      voice: {
        provider: "Kokoro Neural" as const,
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.voiceName,
        gender: selectedVoice.gender,
        accent: selectedVoice.language,
        speed: voiceSpeed,
        pitch: 0.0,
        stability: voiceStability,
        similarity: 0.9,
      },
      language: selectedVoice.language,
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
      lastUpdated: new Date().toISOString(),
    };
    updateAgent(updated);

    if (selectedPhone) {
      assignPhoneNumber(selectedPhone.id, {
        assignedAgentId: agent.id,
      });
    } else if (agent.assignedPhoneNumberId) {
      assignPhoneNumber(agent.assignedPhoneNumberId, {
        assignedAgentId: "",
      });
    }

    addToast({
      title: "Agent Saved",
      description: `'${name}' updated successfully with ${activeLlmOption.fullName} and ${language}.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/agents"
            className="p-2 bg-white border border-[#E5EAF2] rounded-xl text-[#78849A] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#172033]">{agent.name}</h1>
              <StatusPill status={agent.status} />
            </div>
            <p className="text-xs text-[#78849A] mt-0.5">
              {agent.voice.provider} • {agent.voice.voiceName} • {agent.language}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/agents/${agent.id}/test`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EEF2FD] text-[#3157D5] hover:bg-[#E0E7FB] text-xs font-semibold rounded-xl transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>Open Test Playground</span>
          </Link>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5EAF2] card-shadow overflow-x-auto">
        {[
          { id: "general", label: "Identity & General", icon: Bot },
          { id: "voice", label: "Voice & Speech", icon: Volume2 },
          { id: "instructions", label: "Instructions & Prompts", icon: Sliders },
          { id: "knowledge", label: "Knowledge Grounding", icon: BookOpen },
          { id: "tools", label: "Function Calling Tools", icon: Wrench },
          { id: "behavior", label: "Call Escalation & Rules", icon: PhoneCall },
        ].map((tab) => {
          const Icon = tab.icon;
          const isCur = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                isCur ? "bg-[#3157D5] text-white shadow-2xs" : "text-[#78849A] hover:text-[#172033]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5EAF2] card-shadow">
        {activeTab === "general" && (
          <div className="space-y-4 max-w-2xl text-xs">
            <div>
              <label className="block font-semibold text-[#172033] mb-1.5">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172033] mb-1.5">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172033] mb-1.5">Primary Language (All 21 Languages)</label>
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

            {/* Allocated Phone Number Routing */}
            <div className="pt-3 border-t border-[#E5EAF2] dark:border-[#1E293B]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]">
                  Assigned Dedicated Phone Number (Inbound DID)
                </label>
                <Link
                  href="/phone-numbers"
                  className="text-[11px] text-[#3157D5] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>+ Manage Numbers</span>
                </Link>
              </div>

              <select
                value={assignedPhoneNumberId}
                onChange={(e) => setAssignedPhoneNumberId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] dark:bg-[#0B0F19] border border-[#E5EAF2] dark:border-[#1E293B] rounded-xl text-xs font-medium text-[#172033] dark:text-[#F8FAFC] outline-none focus:border-[#3157D5]"
              >
                <option value="">-- None (Outbound Campaigns / Web Only) --</option>
                {phoneNumbers.map((pn) => (
                  <option key={pn.id} value={pn.id}>
                    {pn.formattedNumber || pn.number} • {pn.friendlyName} {pn.assignedAgentId && pn.assignedAgentId === agent.id ? "(Currently Assigned to this Agent)" : pn.assignedAgentId ? `(Assigned: ${pn.assignedAgentName || "Other Agent"})` : "(Available)"}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#78849A] dark:text-[#94A3B8] mt-1">
                Inbound voice calls to this allocated phone number will route directly to this AI agent.
              </p>
            </div>
          </div>
        )}

        {activeTab === "voice" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-[#172033] dark:text-white">
                  Kokoro-82M Neural Voice Persona ({NEURAL_VOICE_PERSONAS.length} Models • English US & UK)
                </label>
                <p className="text-[11px] text-[#78849A]">
                  Choose from native Kokoro-82M neural personas with real-time prosody.
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

            {/* Sliders for Speed & Stability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F4F7FB] dark:bg-[#0F172A] rounded-2xl border border-[#E5EAF2] dark:border-[#1E293B]">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-[#172033] dark:text-white">Speed</span>
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
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-[#172033] dark:text-white">Stability</span>
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

        {activeTab === "instructions" && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">First Greeting Message</label>
              <textarea
                rows={2}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">System Prompt</label>
              <textarea
                rows={8}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-mono text-[#172033] outline-none focus:border-[#3157D5]"
              />
            </div>
          </div>
        )}

        {activeTab === "knowledge" && (
          <div className="space-y-3 max-w-3xl">
            {knowledgeSources.map((kb) => {
              const isAttached = selectedKbIds.includes(kb.id);
              return (
                <div
                  key={kb.id}
                  onClick={() => {
                    setSelectedKbIds((prev) =>
                      prev.includes(kb.id) ? prev.filter((id) => id !== kb.id) : [...prev, kb.id]
                    );
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    isAttached ? "bg-[#EEF2FD] border-[#3157D5]" : "bg-[#F4F7FB] border-[#E5EAF2]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className={`w-4 h-4 ${isAttached ? "text-[#3157D5]" : "text-[#78849A]"}`} />
                    <div>
                      <p className="text-xs font-bold text-[#172033]">{kb.name}</p>
                      <p className="text-[10px] text-[#78849A]">{kb.chunkCount} vector chunks</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${isAttached ? "bg-[#3157D5] text-white" : "bg-white text-[#78849A]"}`}>
                    {isAttached ? "Attached" : "Attach"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-3 max-w-3xl">
            {tools.map((tool) => (
              <div key={tool.id} className="p-4 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-[#3157D5]" />
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] font-mono">{tool.name}()</h4>
                    <p className="text-[11px] text-[#78849A]">{tool.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTools((prev) =>
                      prev.map((t) => (t.id === tool.id ? { ...t, enabled: !t.enabled } : t))
                    );
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    tool.enabled ? "bg-[#16A36A] text-white" : "bg-white border border-[#E5EAF2] text-[#78849A]"
                  }`}
                >
                  {tool.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "behavior" && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">Human Transfer Target Phone Number</label>
              <input
                type="text"
                defaultValue={agent.transferRules.destinationNumber}
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">Closing Goodbye Statement</label>
              <input
                type="text"
                defaultValue={agent.callEndingRules.goodbyePhrase}
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
