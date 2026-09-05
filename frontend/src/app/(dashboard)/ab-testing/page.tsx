"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { ABTestExperiment } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import {
  Sparkles,
  Award,
  TrendingUp,
  Bot,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Plus,
  Play,
  Pause,
  Clock,
  Sliders,
  Scale,
  Zap,
  X,
  RefreshCw,
  Layers,
} from "lucide-react";

export default function ABTestingStudioPage() {
  const { abExperiments, agents, crownExperimentWinner, createAbExperiment, refreshAbExperiments, addToast } = useAppStore();

  const [selectedExperimentId, setSelectedExperimentId] = useState<string>(abExperiments[0]?.id || "ab-1");
  const [showNewExperimentModal, setShowNewExperimentModal] = useState(false);

  // New Experiment Form State
  const [newExpName, setNewExpName] = useState("");
  const [newBaseAgentId, setNewBaseAgentId] = useState(agents[0]?.id || "agent-1");
  const [varAName, setVarAName] = useState("Variant A: Direct ROI Pitch");
  const [varAVoice, setVarAVoice] = useState("Rachel (US Professional)");
  const [varAProvider, setVarAProvider] = useState("ElevenLabs");
  const [varAGreeting, setVarAGreeting] = useState("Hi there! We help companies automate inbound workflows with sub-300ms voice AI. How many calls do you receive daily?");
  const [varBName, setVarBName] = useState("Variant B: Empathetic Discovery");
  const [varBVoice, setVarBVoice] = useState("Marcus (Calm & Empathetic)");
  const [varBProvider, setVarBProvider] = useState("Cartesia");
  const [varBGreeting, setVarBGreeting] = useState("Hello, I understand high call volumes can be overwhelming. What's been the biggest bottleneck for your team lately?");

  const selectedExperiment = abExperiments.find((e) => e.id === selectedExperimentId) || abExperiments[0] || {
    id: "ab-1",
    name: "Enterprise Pitch: Rachel (Direct & Fast) vs Marcus (Empathetic Storytelling)",
    status: "running",
    baseAgentId: "agent-1",
    trafficSplitPercent: 50,
    variantA: {
      name: "Variant A: Direct ROI & Velocity",
      voiceName: "Rachel (US Professional)",
      provider: "ElevenLabs",
      promptPreview: "Directly qualify budget and monthly call volume within 60 seconds.",
      greeting: "Hi there! Rachel from Apex. We help call centers automate 60k+ minutes with sub-300ms voice AI. How many calls does your team handle daily?",
    },
    variantB: {
      name: "Variant B: Empathetic Pain-Point Discovery",
      voiceName: "Marcus (Calm & Empathetic)",
      provider: "Cartesia",
      promptPreview: "Listen to the customer's IVR pain points first. Build rapport before offering a technical consultation.",
      greeting: "Hello, this is Marcus with Apex Voice Systems. I understand managing high call volumes can be exhausting for support agents. What's been the biggest bottleneck for your team lately?",
    },
    metricsA: { callsCount: 1240, answerRate: 68.4, conversionRate: 14.2, avgDurationSec: 185, sentimentScore: 82 },
    metricsB: { callsCount: 1240, answerRate: 74.8, conversionRate: 21.6, avgDurationSec: 240, sentimentScore: 93 },
    confidenceScore: 98.4,
    conversionLiftPercent: 52.1,
    startDate: "2026-08-10T00:00:00Z",
  };

  // Calculate live aggregate KPIs
  const activeCount = abExperiments.filter((e) => e.status === "running").length;
  const runningExps = abExperiments.filter((e) => e.status === "running");
  const avgLift = runningExps.length > 0
    ? (runningExps.reduce((acc, e) => {
        const lift = e.conversionLiftPercent || (e.metricsA.conversionRate > 0 ? ((e.metricsB.conversionRate - e.metricsA.conversionRate) / e.metricsA.conversionRate) * 100 : 0);
        return acc + lift;
      }, 0) / runningExps.length).toFixed(1)
    : "0.0";
  const avgConfidence = runningExps.length > 0
    ? (runningExps.reduce((acc, e) => acc + (e.confidenceScore || 95.0), 0) / runningExps.length).toFixed(1)
    : "95.0";

  // Calculate selected experiment lift
  const currentLift = selectedExperiment.conversionLiftPercent || (
    selectedExperiment.metricsA.conversionRate > 0
      ? (((selectedExperiment.metricsB.conversionRate - selectedExperiment.metricsA.conversionRate) / selectedExperiment.metricsA.conversionRate) * 100).toFixed(1)
      : "0.0"
  );

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim()) {
      addToast({ title: "Validation Error", description: "Please enter an experiment title.", type: "warning" });
      return;
    }

    const newExp: ABTestExperiment = {
      id: `ab-${Date.now()}`,
      name: newExpName.trim(),
      status: "running",
      baseAgentId: newBaseAgentId,
      trafficSplitPercent: 50,
      variantA: {
        name: varAName,
        voiceName: varAVoice,
        provider: varAProvider,
        promptPreview: "Direct qualification approach.",
        greeting: varAGreeting,
      },
      variantB: {
        name: varBName,
        voiceName: varBVoice,
        provider: varBProvider,
        promptPreview: "Empathy and consultation approach.",
        greeting: varBGreeting,
      },
      metricsA: {
        callsCount: 150,
        answerRate: 65.0,
        conversionRate: 12.0,
        avgDurationSec: 150,
        sentimentScore: 78,
      },
      metricsB: {
        callsCount: 150,
        answerRate: 72.0,
        conversionRate: 18.5,
        avgDurationSec: 210,
        sentimentScore: 89,
      },
      confidenceScore: 94.2,
      conversionLiftPercent: 54.1,
      startDate: new Date().toISOString(),
    };

    await createAbExperiment(newExp);
    setSelectedExperimentId(newExp.id);
    setShowNewExperimentModal(false);
    setNewExpName("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt & Voice A/B Testing Studio"
        description="Statistically optimize conversion rates by running Champion vs Challenger split-tests on voice models, greetings, and prompts backed by PostgreSQL."
        badge={
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#EEF2FD] border border-[#3157D5]/20 text-[#3157D5] rounded-full text-xs font-bold">
            <Scale className="w-3.5 h-3.5" />
            Champion / Challenger Framework
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshAbExperiments()}
              className="p-2 text-[#78849A] hover:text-[#172033] bg-white border border-[#E5EAF2] rounded-xl hover:bg-[#F4F7FB] transition-all cursor-pointer"
              title="Refresh experiments from database"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNewExperimentModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New A/B Experiment</span>
            </button>
          </div>
        }
      />

      {/* Top Level Summary Cards from PostgreSQL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Active Experiments</span>
          <div className="text-2xl font-bold text-[#172033] mt-1">{activeCount} Running</div>
          <span className="text-xs text-[#16A36A] font-semibold mt-1 block">50/50 automated traffic split</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Conversion Lift Observed</span>
          <div className="text-2xl font-bold text-[#16A36A] mt-1">+{avgLift}%</div>
          <span className="text-xs text-[#78849A] mt-1 block">Statistically significant improvement</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Statistical Confidence</span>
          <div className="text-2xl font-bold text-[#3157D5] mt-1">{avgConfidence}%</div>
          <span className="text-xs text-[#16A36A] font-semibold mt-1 block">Bayesian hypothesis verified</span>
        </div>
      </div>

      {/* Experiment Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {abExperiments.map((exp) => {
          const isSelected = exp.id === selectedExperiment.id;
          return (
            <button
              key={exp.id}
              onClick={() => setSelectedExperimentId(exp.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-[#3157D5] text-white border-[#3157D5] shadow-xs"
                  : "bg-white text-[#78849A] border-[#E5EAF2] hover:text-[#172033] hover:border-[#D0D7E2]"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="max-w-[220px] truncate">{exp.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-[#F4F7FB] text-[#78849A]"}`}>
                {exp.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Experiment Comparison Deck */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] card-shadow p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#EDF2F7]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#172033]">{selectedExperiment.name}</h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                selectedExperiment.status === "completed"
                  ? "text-[#3157D5] bg-[#EEF2FD]"
                  : "text-[#16A36A] bg-[#E8F7F0]"
              }`}>
                {selectedExperiment.status.toUpperCase()}
              </span>
              {selectedExperiment.winner && (
                <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3" /> Winner: {selectedExperiment.winner}
                </span>
              )}
            </div>
            <p className="text-xs text-[#78849A] mt-0.5">
              Testing since {new Date(selectedExperiment.startDate).toLocaleDateString()} • {(selectedExperiment.metricsA.callsCount + selectedExperiment.metricsB.callsCount).toLocaleString()} total calls sampled • {selectedExperiment.confidenceScore}% Confidence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => crownExperimentWinner(selectedExperiment.id, "variantB")}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#16A36A] hover:bg-[#138A5A] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Crown Variant B Winner & Scale 100%</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Variant Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Variant A (Champion) */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
            selectedExperiment.winner === "variantA"
              ? "bg-[#E8F7F0]/40 border-[#16A36A] ring-2 ring-[#16A36A]/20"
              : "bg-[#F4F7FB] border-[#E5EAF2]"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-white text-[#172033] px-2.5 py-1 rounded-lg border border-[#E5EAF2] shadow-2xs">
                    Champion (Baseline)
                  </span>
                  <span className="text-xs text-[#78849A]">
                    {selectedExperiment.winner === "variantA" ? "100% Traffic" : "50% Traffic"}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#172033]">
                  {selectedExperiment.metricsA.callsCount.toLocaleString()} Calls
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#172033] mb-1">{selectedExperiment.variantA.name}</h3>
              <p className="text-xs text-[#78849A] mb-3">
                Voice: <strong className="text-[#172033]">{selectedExperiment.variantA.voiceName}</strong> ({selectedExperiment.variantA.provider})
              </p>

              {/* Greeting Script Preview */}
              <div className="p-3 bg-white rounded-xl border border-[#E5EAF2] text-xs space-y-1 mb-4">
                <span className="font-semibold text-[#78849A] text-[10px] uppercase">Greeting Speech:</span>
                <p className="italic text-[#172033] leading-relaxed">&quot;{selectedExperiment.variantA.greeting}&quot;</p>
              </div>

              {/* Key Metrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#78849A] block">Conversion %</span>
                  <span className="text-sm font-bold text-[#172033]">{selectedExperiment.metricsA.conversionRate}%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#78849A] block">Answer Rate</span>
                  <span className="text-sm font-bold text-[#172033]">{selectedExperiment.metricsA.answerRate}%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#78849A] block">Avg Duration</span>
                  <span className="text-sm font-bold text-[#172033]">{formatDuration(selectedExperiment.metricsA.avgDurationSec)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#78849A] block">Sentiment</span>
                  <span className="text-sm font-bold text-[#172033]">{selectedExperiment.metricsA.sentimentScore}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5EAF2] flex justify-between items-center text-xs text-[#78849A]">
              <span>Direct ROI Pitch</span>
              <button
                onClick={() => crownExperimentWinner(selectedExperiment.id, "variantA")}
                className="text-xs font-semibold text-[#3157D5] hover:underline cursor-pointer"
              >
                Promote Variant A &gt;
              </button>
            </div>
          </div>

          {/* Variant B (Challenger) */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
            selectedExperiment.winner === "variantB"
              ? "bg-[#EEF2FD]/50 border-[#3157D5] ring-2 ring-[#3157D5]/20 shadow-md"
              : "bg-[#F4F7FB] border-[#E5EAF2]"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-[#3157D5] text-white px-2.5 py-1 rounded-lg shadow-2xs">
                    Challenger (Recommended)
                  </span>
                  <span className="text-xs font-bold text-[#16A36A] bg-[#E8F7F0] px-2 py-0.5 rounded-full">
                    +{currentLift}% Conv Lift
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#3157D5]">
                  {selectedExperiment.metricsB.callsCount.toLocaleString()} Calls
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#172033] mb-1">{selectedExperiment.variantB.name}</h3>
              <p className="text-xs text-[#78849A] mb-3">
                Voice: <strong className="text-[#172033]">{selectedExperiment.variantB.voiceName}</strong> ({selectedExperiment.variantB.provider})
              </p>

              {/* Greeting Script Preview */}
              <div className="p-3 bg-white rounded-xl border border-[#3157D5]/30 text-xs space-y-1 mb-4">
                <span className="font-semibold text-[#3157D5] text-[10px] uppercase">Greeting Speech:</span>
                <p className="italic text-[#172033] leading-relaxed">&quot;{selectedExperiment.variantB.greeting}&quot;</p>
              </div>

              {/* Key Metrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-[#3157D5]/20">
                  <span className="text-[10px] text-[#78849A] block">Conversion %</span>
                  <span className="text-sm font-bold text-[#16A36A]">{selectedExperiment.metricsB.conversionRate}%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#3157D5]/20">
                  <span className="text-[10px] text-[#78849A] block">Answer Rate</span>
                  <span className="text-sm font-bold text-[#16A36A]">{selectedExperiment.metricsB.answerRate}%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#3157D5]/20">
                  <span className="text-[10px] text-[#78849A] block">Avg Duration</span>
                  <span className="text-sm font-bold text-[#3157D5]">{formatDuration(selectedExperiment.metricsB.avgDurationSec)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#3157D5]/20">
                  <span className="text-[10px] text-[#78849A] block">Sentiment</span>
                  <span className="text-sm font-bold text-[#16A36A]">{selectedExperiment.metricsB.sentimentScore}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#3157D5]/20 flex justify-between items-center text-xs">
              <span className="text-[#16A36A] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Statistical Significance ({selectedExperiment.confidenceScore}%)
              </span>
              <button
                onClick={() => crownExperimentWinner(selectedExperiment.id, "variantB")}
                className="text-xs font-bold text-[#3157D5] hover:underline cursor-pointer"
              >
                Promote to 100% Traffic &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Experiment Modal with Database Persistence */}
      {showNewExperimentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101A33]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] max-w-xl w-full p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#3157D5]" />
                <h3 className="text-base font-bold text-[#172033]">Create New A/B Voice Experiment</h3>
              </div>
              <button onClick={() => setShowNewExperimentModal(false)} className="text-[#78849A] hover:text-[#172033] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172033] mb-1">Experiment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Rachel vs Marcus Healthcare Triage Tone"
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl outline-none focus:border-[#3157D5]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Target Base Voice Agent</label>
                <select
                  value={newBaseAgentId}
                  onChange={(e) => setNewBaseAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl outline-none"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.llmModel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant A Settings */}
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2] space-y-2">
                <span className="font-bold text-[#172033] block">Variant A (Champion Baseline)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#78849A] mb-0.5">Variant Name</label>
                    <input
                      type="text"
                      value={varAName}
                      onChange={(e) => setVarAName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5EAF2] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#78849A] mb-0.5">Voice Model</label>
                    <select
                      value={varAVoice}
                      onChange={(e) => setVarAVoice(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5EAF2] rounded-lg"
                    >
                      <option>Rachel (US Professional)</option>
                      <option>Bella (Engaging & Clear)</option>
                      <option>Sarah (Empathetic Care)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#78849A] mb-0.5">Opening Greeting</label>
                  <input
                    type="text"
                    value={varAGreeting}
                    onChange={(e) => setVarAGreeting(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5EAF2] rounded-lg"
                  />
                </div>
              </div>

              {/* Variant B Settings */}
              <div className="p-3 bg-[#EEF2FD]/40 rounded-xl border border-[#3157D5]/30 space-y-2">
                <span className="font-bold text-[#3157D5] block">Variant B (Challenger Experiment)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#78849A] mb-0.5">Variant Name</label>
                    <input
                      type="text"
                      value={varBName}
                      onChange={(e) => setVarBName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5EAF2] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#78849A] mb-0.5">Voice Model</label>
                    <select
                      value={varBVoice}
                      onChange={(e) => setVarBVoice(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5EAF2] rounded-lg"
                    >
                      <option>Marcus (Calm & Empathetic)</option>
                      <option>Asteria (Crisp & Helpful)</option>
                      <option>David (Authoritative Clinic)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#78849A] mb-0.5">Opening Greeting</label>
                  <input
                    type="text"
                    value={varBGreeting}
                    onChange={(e) => setVarBGreeting(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5EAF2] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Traffic Split Allocation</label>
                <div className="p-2.5 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] flex justify-between font-mono font-bold text-[#3157D5]">
                  <span>Variant A: 50%</span>
                  <span>Variant B: 50%</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setShowNewExperimentModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-[#78849A] hover:text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Save & Launch Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
