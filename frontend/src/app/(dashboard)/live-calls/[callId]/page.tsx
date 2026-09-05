"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { AudioWaveform } from "@/components/audio-waveform";
import { TranscriptPanel } from "@/components/transcript-panel";
import { formatDuration } from "@/lib/utils";
import {
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  Pause,
  Play,
  Mic,
  MicOff,
  Volume2,
  Bot,
  User,
  Clock,
  Sparkles,
  ShieldCheck,
  Award,
  BookOpen,
  Wrench,
  Tag,
  Plus,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Activity,
  Send,
  Headphones,
  MessageSquarePlus,
  Radio,
  AlertTriangle,
} from "lucide-react";

import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

interface LiveCallDetailPageProps {
  params: Promise<{ callId: string }>;
}

export default function LiveCallDetailPage({ params }: LiveCallDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    calls,
    endCall,
    holdCall,
    transferCall,
    addLiveTranscriptMessage,
    injectSupervisorWhisper,
    takeoverCallBySupervisor,
    addToast,
  } = useAppStore();

  const foundCall = (calls || []).find((c) => c.id === resolvedParams.callId) || (calls && calls[0]) || {
    id: resolvedParams.callId,
    callerName: "Jonathan Vance",
    callerNumber: "+1 (555) 890-2341",
    agentName: "Rachel (Enterprise SDR)",
    direction: "inbound",
    status: "completed",
    duration: 60,
    startedAt: new Date().toISOString(),
    transcript: [],
    events: [],
    knowledgeContexts: [],
    tags: ["Inbound Direct", "Solar Lead"],
  };

  const call = {
    ...foundCall,
    callerName: foundCall.callerName || foundCall.contactName || "Jonathan Vance",
    callerNumber: foundCall.callerNumber || foundCall.contactPhone || "+1 (555) 890-2341",
    agentName: foundCall.agentName || "Rachel (Enterprise SDR)",
    direction: foundCall.direction || "inbound",
    status: foundCall.status || "completed",
    durationSeconds: foundCall.durationSeconds || foundCall.duration || 60,
    transcript: Array.isArray(foundCall.transcript) ? foundCall.transcript : [],
    events: Array.isArray(foundCall.events) ? foundCall.events : [
      { id: "ev-1", name: "vad_speech_start", type: "vad", status: "completed", timestamp: "00:02" },
      { id: "ev-2", name: "parakeet_stt_transcribe", type: "stt", status: "completed", timestamp: "00:03" },
      { id: "ev-3", name: "kokoro_tts_stream", type: "tts", status: "completed", timestamp: "00:04" },
    ],
    knowledgeContexts: Array.isArray(foundCall.knowledgeContexts) ? foundCall.knowledgeContexts : [
      { id: "kb-1", sourceName: "Commercial Solar Warranty & SLA", matchScore: 0.94, query: "Warranty coverage and guarantee specifications" },
      { id: "kb-2", sourceName: "State Tax Credits & Rebate Guide", matchScore: 0.89, query: "Clean energy commercial installation incentives" }
    ],
    tags: Array.isArray(foundCall.tags) ? foundCall.tags : ["Inbound Direct", "Verified Lead"],
    qualificationScore: foundCall.qualificationScore || 85,
    sentiment: foundCall.sentiment || "positive",
    sentimentScore: foundCall.sentimentScore || 88,
  };

  const [isMuted, setIsMuted] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState("+1 (800) 555-0199 (Enterprise Sales Desk)");
  const [simulatedTurnPrompt, setSimulatedTurnPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"transcript" | "telemetry" | "knowledge" | "supervisor">("transcript");
  const [newTagInput, setNewTagInput] = useState("");

  // Feature 1: Supervisor Intervention States
  const [supervisorMode, setSupervisorMode] = useState<"eavesdrop" | "whisper" | "takeover">("eavesdrop");
  const [whisperInput, setWhisperInput] = useState("");
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);

  const isLive = call.status === "live";

  // Simulate injecting a new speech turn into the live call
  const handleSimulateNextTurn = () => {
    const speechSamples = [
      {
        user: "Could you send a calendar invite to my co-founder as well at dev@scaleops.io?",
        agent: "Certainly! I've updated the Google Calendar invitation to include dev@scaleops.io with the meeting link.",
        tool: { name: "update_calendar_attendees", status: "completed" as const, resultSummary: "Added dev@scaleops.io to guest list" },
      },
      {
        user: "What happens if our call concurrency spikes during Black Friday?",
        agent: "Our architecture auto-scales up to 500 simultaneous SIP channels with zero degradation in audio latency.",
        tool: undefined,
      },
    ];

    const pick = speechSamples[Math.floor(Math.random() * speechSamples.length)];
    const timeNow = formatDuration(call.durationSeconds);

    addLiveTranscriptMessage(call.id, {
      speaker: "user",
      text: simulatedTurnPrompt || pick.user,
      timestamp: timeNow,
    });

    setTimeout(() => {
      addLiveTranscriptMessage(call.id, {
        speaker: "agent",
        text: pick.agent,
        timestamp: formatDuration(call.durationSeconds + 2),
        latencyMs: 275,
        toolCall: pick.tool,
      });
      addToast({ title: "Speech Turn Generated", description: "Real-time audio turn rendered.", type: "info" });
    }, 500);

    setSimulatedTurnPrompt("");
  };

  const handleSendSupervisorWhisper = (customWhisper?: string) => {
    const text = customWhisper || whisperInput;
    if (!text.trim()) return;
    injectSupervisorWhisper(call.id, text.trim());
    setWhisperInput("");
  };

  const handleToggleTakeover = () => {
    if (!isTakeoverActive) {
      setIsTakeoverActive(true);
      setSupervisorMode("takeover");
      takeoverCallBySupervisor(call.id);
    } else {
      setIsTakeoverActive(false);
      setSupervisorMode("eavesdrop");
      addToast({
        title: "AI Resumed Control",
        description: "Human supervisor stepped back. AI agent resumed dialogue.",
        type: "info",
      });
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    if (!call.tags.includes(newTagInput.trim())) {
      call.tags.push(newTagInput.trim());
      addToast({ title: "Tag Added", description: `Added "${newTagInput.trim()}" to call.`, type: "success" });
    }
    setNewTagInput("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/live-calls"
            className="p-2 bg-white border border-[#E5EAF2] rounded-xl text-[#78849A] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#172033]">{call.callerName}</h1>
              <StatusPill status={call.status} />
              <span className="text-xs font-mono font-bold text-[#3157D5] bg-[#EEF2FD] px-2.5 py-0.5 rounded-lg">
                {formatDuration(call.durationSeconds)}
              </span>
              {isTakeoverActive && (
                <span className="text-xs font-bold text-[#D99025] bg-[#FEF7EC] px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse border border-[#D99025]/30">
                  <Mic className="w-3.5 h-3.5" />
                  Supervisor Live Takeover Active
                </span>
              )}
            </div>
            <p className="text-xs text-[#78849A] font-mono mt-0.5">
              {call.callerNumber} • {call.agentName} • {call.direction.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Live Call Control Deck */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mute Button */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              addToast({
                title: isMuted ? "Audio Unmuted" : "Audio Muted",
                description: isMuted ? "Microphone stream resumed" : "Microphone stream muted",
                type: "info",
              });
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              isMuted
                ? "bg-[#FEF7EC] border-[#D99025] text-[#D99025]"
                : "bg-white border-[#E5EAF2] text-[#172033] hover:bg-[#F4F7FB]"
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#16A36A]" />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Hold Button */}
          <button
            onClick={() => holdCall(call.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              call.status === "on_hold"
                ? "bg-[#FEF7EC] border-[#D99025] text-[#D99025]"
                : "bg-white border-[#E5EAF2] text-[#172033] hover:bg-[#F4F7FB]"
            }`}
          >
            {call.status === "on_hold" ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{call.status === "on_hold" ? "Resume Call" : "Hold"}</span>
          </button>

          {/* Transfer Button */}
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5EAF2] hover:bg-[#F4F7FB] text-[#3157D5] text-xs font-semibold rounded-xl transition-all"
          >
            <PhoneForwarded className="w-3.5 h-3.5" />
            <span>Transfer to Human</span>
          </button>

          {/* End Call Button */}
          {isLive && (
            <button
              onClick={() => endCall(call.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D95C68] hover:bg-[#C04854] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          )}
        </div>
      </div>

      {/* FEATURE 1: Supervisor Intervention Control Bar Banner */}
      <div className="p-4 bg-gradient-to-r from-white via-white to-[#EEF2FD] rounded-2xl border border-[#3157D5]/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3157D5] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Live Supervisor Copilot Deck
              </h3>
              <span className="text-[10px] font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
                Zero-Latency Bridge
              </span>
            </div>
            <p className="text-xs text-[#78849A]">
              Listen in silently, whisper instructions directly into the AI’s mid-call context, or take over immediately.
            </p>
          </div>
        </div>

        {/* 3 Intervention Modes */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setSupervisorMode("eavesdrop")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              supervisorMode === "eavesdrop"
                ? "bg-[#16A36A] text-white border-[#16A36A] shadow-xs"
                : "bg-white text-[#78849A] border-[#E5EAF2] hover:text-[#172033]"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>1. Eavesdrop</span>
          </button>

          <button
            onClick={() => {
              setSupervisorMode("whisper");
              setActiveTab("supervisor");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              supervisorMode === "whisper"
                ? "bg-[#3157D5] text-white border-[#3157D5] shadow-xs"
                : "bg-white text-[#78849A] border-[#E5EAF2] hover:text-[#172033]"
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>2. Whisper to AI</span>
          </button>

          <button
            onClick={handleToggleTakeover}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
              isTakeoverActive
                ? "bg-[#D95C68] text-white hover:bg-[#C04854] animate-pulse"
                : "bg-[#D99025] hover:bg-[#C27E1C] text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isTakeoverActive ? "Release Takeover" : "3. 1-Click Takeover"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Transcript & Telemetry, Right Profile & Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Waveform & Streaming Transcript */}
        <div className="lg:col-span-2 space-y-4">
          {/* Audio Waveforms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AudioWaveform
              active={isLive && !isMuted}
              audioLevel={call.audioLevel || 45}
              color={isTakeoverActive ? "#D99025" : "#3157D5"}
              speaker="agent"
              label={isTakeoverActive ? "Supervisor Live Microphone" : `AI Voice: ${call.agentName}`}
            />
            <AudioWaveform
              active={isLive}
              audioLevel={Math.max(15, (call.audioLevel || 30) - 10)}
              color="#16A36A"
              speaker="caller"
              label={`Inbound Caller: ${call.callerName}`}
            />
          </div>

          {/* Tab Navigation for Transcript / Telemetry / KB / Supervisor */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5EAF2] card-shadow overflow-x-auto">
            <button
              onClick={() => setActiveTab("transcript")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "transcript"
                  ? "bg-[#3157D5] text-white shadow-2xs"
                  : "text-[#78849A] hover:text-[#172033]"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Live Transcript ({call.transcript?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("supervisor")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "supervisor"
                  ? "bg-[#3157D5] text-white shadow-2xs"
                  : "text-[#78849A] hover:text-[#172033]"
              }`}
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Supervisor Whisper & Coaching</span>
            </button>

            <button
              onClick={() => setActiveTab("telemetry")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "telemetry"
                  ? "bg-[#3157D5] text-white shadow-2xs"
                  : "text-[#78849A] hover:text-[#172033]"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Tools ({call.events?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "knowledge"
                  ? "bg-[#3157D5] text-white shadow-2xs"
                  : "text-[#78849A] hover:text-[#172033]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>KB Grounding ({call.knowledgeContexts?.length || 0})</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeTab === "transcript" && (
            <div className="space-y-3">
              <TranscriptPanel
                messages={call.transcript}
                agentName={isTakeoverActive ? "Supervisor (Live)" : call.agentName}
                callerName={call.callerName}
                isLive={isLive}
              />

              {/* Speech simulator input bar */}
              {isLive && (
                <div className="p-3 bg-white rounded-2xl border border-[#E5EAF2] card-shadow flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type simulated caller query or leave empty for auto-response..."
                    value={simulatedTurnPrompt}
                    onChange={(e) => setSimulatedTurnPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSimulateNextTurn()}
                    className="flex-1 text-xs px-3 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl outline-none focus:border-[#3157D5]"
                  />
                  <button
                    onClick={handleSimulateNextTurn}
                    className="px-3.5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Simulate Next Turn</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FEATURE 1: Supervisor Whisper Tab */}
          {activeTab === "supervisor" && (
            <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDF2F7]">
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">Real-Time Whisper to AI Agent</h3>
                  <p className="text-xs text-[#78849A]">
                    Type instructions below. The AI agent will ingest your guidance and naturally incorporate it into its next spoken sentence.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#16A36A] bg-[#E8F7F0] px-2.5 py-0.5 rounded-full">
                  Whisper Channel Ready
                </span>
              </div>

              {/* Quick Coaching Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#78849A] uppercase tracking-wider">
                  Quick Supervisor Coaching Actions:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    "Offer 15% discount for 1-year prepayment",
                    "Verify if they have an active AWS or GCP cloud footprint",
                    "Ask for their current number of full-time call center agents",
                    "Propose Thursday 2:00 PM PST meeting with Alex Chen",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendSupervisorWhisper(chip)}
                      className="text-xs bg-[#F4F7FB] hover:bg-[#EEF2FD] text-[#172033] hover:text-[#3157D5] px-3 py-1.5 rounded-xl border border-[#E5EAF2] hover:border-[#3157D5]/30 transition-all font-medium text-left"
                    >
                      ⚡ {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Whisper Input */}
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-semibold text-[#172033]">
                  Custom Guidance to Inject into AI Context:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={whisperInput}
                    onChange={(e) => setWhisperInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendSupervisorWhisper()}
                    placeholder="e.g. Tell the customer we can waive the $500 implementation fee if they sign this week..."
                    className="flex-1 text-xs px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl outline-none focus:border-[#3157D5]"
                  />
                  <button
                    onClick={() => handleSendSupervisorWhisper()}
                    className="px-4 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Whisper to AI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "telemetry" && (
            <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-4">
              <h3 className="text-sm font-bold text-[#172033]">Tool Execution & Event Stream</h3>
              <div className="space-y-3">
                {call.events.map((ev) => (
                  <div key={ev.id} className="p-3 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] flex items-start gap-3 text-xs">
                    <div className="p-1.5 rounded-lg bg-[#EEF2FD] text-[#3157D5] shrink-0 mt-0.5">
                      <Wrench className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172033]">{ev.title}</span>
                        <span className="text-[10px] font-mono text-[#78849A]">{ev.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[#78849A] mt-0.5">{ev.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-4">
              <h3 className="text-sm font-bold text-[#172033]">Retrieved Knowledge Base Chunks</h3>
              <div className="space-y-3">
                {call.knowledgeContexts.map((ctx, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172033] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#3157D5]" />
                        {ctx.sourceName}
                      </span>
                      <span className="text-[10px] font-bold text-[#16A36A] bg-[#E8F7F0] px-2 py-0.5 rounded-full">
                        {Math.round(ctx.matchScore * 100)}% Similarity Match
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78849A] italic">Query: &quot;{ctx.query}&quot;</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Caller Profile, Summary & Tags */}
        <div className="space-y-4">
          {/* Caller Details Card */}
          <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-4">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Caller Information</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#EDF2F7]">
                <span className="text-[#78849A]">Full Name</span>
                <span className="font-bold text-[#172033]">{call.callerName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#EDF2F7]">
                <span className="text-[#78849A]">Phone Number</span>
                <span className="font-mono font-medium text-[#172033]">{call.callerNumber}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#EDF2F7]">
                <span className="text-[#78849A]">Lead Score</span>
                <span className="font-bold text-xs text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
                  {call.qualificationScore} / 100
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#EDF2F7]">
                <span className="text-[#78849A]">Sentiment</span>
                <span className="font-semibold capitalize text-[#16A36A]">
                  {call.sentiment} ({call.sentimentScore}%)
                </span>
              </div>
              {call.campaignName && (
                <div className="flex items-center justify-between py-1 border-b border-[#EDF2F7]">
                  <span className="text-[#78849A]">Campaign</span>
                  <span className="font-medium text-[#172033] truncate max-w-[130px]">{call.campaignName}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1">
                <span className="text-[#78849A]">Estimated Cost</span>
                <span className="font-mono text-[#172033]">${call.cost?.toFixed(2) || "0.18"}</span>
              </div>
            </div>
          </div>

          {/* Call Summary Card */}
          <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-3">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">AI Call Summary</h3>
            <p className="text-xs text-[#78849A] leading-relaxed bg-[#F4F7FB] p-3 rounded-xl border border-[#E5EAF2]">
              {call.summary || "Conversation active. AI agent evaluating customer technical specs and qualification."}
            </p>
          </div>

          {/* Qualification Tags & Notes */}
          <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Tags & Intent</h3>
              <Tag className="w-3.5 h-3.5 text-[#78849A]" />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {call.tags.map((tag) => (
                <span key={tag} className="text-[11px] bg-[#EEF2FD] text-[#3157D5] font-semibold px-2 py-0.5 rounded-lg border border-[#3157D5]/20">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                className="flex-1 text-xs px-2.5 py-1.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl outline-none focus:border-[#3157D5]"
              />
              <button
                onClick={handleAddTag}
                className="p-1.5 bg-[#3157D5] text-white rounded-xl hover:bg-[#2646B8] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101A33]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-[#172033]">Transfer Active Call</h3>
            <p className="text-xs text-[#78849A]">
              Choose the human department or telephone SIP endpoint to hand over {call.callerName}.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#172033]">Destination Line</label>
              <select
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-medium text-[#172033] outline-none focus:border-[#3157D5]"
              >
                <option value="+1 (800) 555-0199 (Enterprise Sales Desk)">+1 (800) 555-0199 (Enterprise Sales Desk)</option>
                <option value="+1 (888) 432-8472 (Clinical Nurse Triage)">+1 (888) 432-8472 (Clinical Nurse Triage)</option>
                <option value="+1 (877) 500-7861 (Solar Design Engineering)">+1 (877) 500-7861 (Solar Design Engineering)</option>
                <option value="+1 (800) 299-1004 (Tier 2 Tier Escalation)">+1 (800) 299-1004 (Tier 2 Tier Escalation)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5EAF2]">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-2 text-xs font-semibold text-[#78849A] hover:text-[#172033]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  transferCall(call.id, transferTarget);
                  setShowTransferModal(false);
                }}
                className="px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
