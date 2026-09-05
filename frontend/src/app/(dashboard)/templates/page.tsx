"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Template, Agent } from "@/lib/types";
import {
  Sparkles,
  Target,
  HeartPulse,
  Sun,
  PackageCheck,
  Building2,
  CreditCard,
  Volume2,
  Clock,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Search,
  Zap,
  Sliders,
  Cpu,
  Layers,
} from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, addAgent, addToast } = useAppStore();

  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<Template | null>(null);

  const categories = ["All", "Sales", "Healthcare", "Support", "Real Estate", "Finance"];

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = categoryFilter === "All" ? true : t.category === categoryFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.includedTools.some((tool) => tool.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const iconMap: Record<string, React.ElementType> = {
    Target,
    HeartPulse,
    Sun,
    PackageCheck,
    Building2,
    CreditCard,
  };

  const handleUseTemplate = (tpl: Template) => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: tpl.title,
      description: tpl.description,
      avatar: "/avatars/rachel.png",
      color: tpl.color || "#3157D5",
      status: "active",
      llmModel: "vLLM Neural LLM Engine",
      voice: {
        provider: "Kokoro Neural" as any,
        voiceId: "af_bella",
        voiceName: tpl.suggestedVoice || "Bella (Engaging & Clear)",
        gender: "female",
        accent: "English (US)",
        speed: 1.0,
        pitch: 0.0,
        stability: 0.85,
        similarity: 0.9,
      },
      language: "English (US)",
      greeting: tpl.defaultGreeting,
      systemPrompt: tpl.samplePrompt,
      responseStyle: "conversational",
      interruptionSensitivity: 0.75,
      silenceTimeoutSeconds: 4,
      maxCallDurationMinutes: 15,
      knowledgeBaseIds: [],
      tools: tpl.includedTools.map((toolName) => ({
        id: `tool-${Date.now()}-${toolName}`,
        name: toolName,
        description: `Autonomous tool execution for ${toolName}`,
        enabled: true,
        type: "function",
      })),
      humanRealism: {
        enableMicroBreaths: true,
        enableBackchanneling: true,
        enableAdaptiveEmotion: true,
        maxWordsPerTurn: 25,
        fillerFrequency: "medium",
        voiceBlend: {
          enabled: false,
          secondaryVoiceId: "af_heart",
          blendRatio: 0.3,
        },
      },
      transferRules: {
        enabled: true,
        destinationNumber: "+1 (800) 555-0199",
        triggerPhrase: "transfer to human, speak to supervisor",
        department: tpl.category,
      },
      callEndingRules: {
        goodbyePhrase: "Thank you for speaking with us today. Have a wonderful day!",
        hangupOnSilence: true,
        afterHoursBehavior: "voicemail",
      },
      metrics: {
        totalCalls: 0,
        avgDurationSeconds: 0,
        successRate: 100,
        sentimentScore: 95,
        connectedCalls: 0,
      },
      lastUpdated: new Date().toISOString(),
    };

    addAgent(newAgent);
    addToast({
      title: "Agent Created from Template",
      description: `'${tpl.title}' deployed with vLLM (Qwen 2.5 7B) reasoning & Kokoro Neural TTS.`,
      type: "success",
    });
    router.push(`/agents/${newAgent.id}/test`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Agent Template Library"
            description="Industry-standard voice agent archetypes engineered with vLLM (Qwen 2.5 7B) reasoning, Kokoro neural audio, and automated function calling."
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78849A]" />
            <input
              type="text"
              placeholder="Search templates, tools, industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-[#0F172A] border border-[#E5EAF2] dark:border-[#1E293B] rounded-xl text-xs text-[#172033] dark:text-white outline-none focus:border-[#3157D5] w-64 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const count =
            cat === "All"
              ? templates.length
              : templates.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#3157D5] text-white shadow-xs"
                  : "bg-white dark:bg-[#0F172A] text-[#78849A] hover:text-[#172033] dark:hover:text-white border border-[#E5EAF2] dark:border-[#1E293B]"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  categoryFilter === cat
                    ? "bg-white/20 text-white"
                    : "bg-[#F4F7FB] dark:bg-[#1E293B] text-[#78849A]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((tpl) => {
          const Icon = iconMap[tpl.icon] || Sparkles;
          return (
            <div
              key={tpl.id}
              className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5EAF2] dark:border-[#1E293B] card-shadow card-hover flex flex-col justify-between space-y-4 relative group"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: tpl.color || "#3157D5" }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#16A36A] bg-[#E8F7F0] dark:bg-[#16A36A]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      {tpl.popularityScore || 95}% Fit
                    </span>
                    <span className="text-[10px] font-bold text-[#3157D5] bg-[#EEF2FD] dark:bg-[#3157D5]/20 px-2.5 py-0.5 rounded-full">
                      {tpl.category}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#172033] dark:text-white leading-snug">
                  {tpl.title}
                </h3>
                <p className="text-xs text-[#78849A] dark:text-[#94A3B8] mt-1.5 leading-relaxed line-clamp-3">
                  {tpl.description}
                </p>

                {/* Tech Stack Blueprint Card */}
                <div className="p-3 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl border border-[#E5EAF2] dark:border-[#334155] space-y-2 text-xs mt-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#78849A] dark:text-[#94A3B8] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#3157D5]" /> LLM Reasoning:
                    </span>
                    <span className="font-semibold text-[#172033] dark:text-white">
                      vLLM (Qwen 2.5 7B AWQ)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#78849A] dark:text-[#94A3B8] flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#16A36A]" /> Voice Engine:
                    </span>
                    <span className="font-semibold text-[#172033] dark:text-white">
                      Kokoro-82M Neural
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#78849A] dark:text-[#94A3B8] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D99025]" /> Time-to-Deploy:
                    </span>
                    <span className="font-semibold text-[#172033] dark:text-white">
                      ~{tpl.estimatedSetupMinutes || 3} mins
                    </span>
                  </div>
                </div>

                {/* Function Calling Tools */}
                <div className="mt-3.5">
                  <span className="text-[10px] font-bold text-[#78849A] uppercase tracking-wider block mb-1.5">
                    Pre-Wired Tools:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tpl.includedTools.map((tool) => (
                      <span
                        key={tool}
                        className="text-[10px] font-mono bg-[#EEF2FD] dark:bg-[#3157D5]/20 text-[#3157D5] dark:text-[#93C5FD] px-2 py-0.5 rounded-md font-semibold border border-[#3157D5]/10"
                      >
                        +{tool}()
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-[#EDF2F7] dark:border-[#1E293B]">
                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="w-full py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Deploy This Template</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
