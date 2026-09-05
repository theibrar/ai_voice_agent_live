"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { formatDuration } from "@/lib/utils";
import {
  Headphones,
  Mic,
  MessageSquarePlus,
  Send,
  PhoneCall,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function SupervisorCockpitPage() {
  const { calls, injectSupervisorWhisper, takeoverCallBySupervisor, addToast } = useAppStore();

  const liveCalls = calls.filter((c) => c.status === "live" || c.status === "ringing" || c.status === "on_hold");
  const [selectedCallId, setSelectedCallId] = useState<string>(liveCalls[0]?.id || calls[0]?.id || "call-1");
  const [supervisorMode, setSupervisorMode] = useState<"eavesdrop" | "whisper" | "takeover">("whisper");
  const [whisperInput, setWhisperInput] = useState("");
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);

  const activeCall = calls.find((c) => c.id === selectedCallId) || calls[0];

  const handleSendWhisper = (customText?: string) => {
    const text = customText || whisperInput;
    if (!text.trim() || !activeCall) return;
    injectSupervisorWhisper(activeCall.id, text.trim());
    setWhisperInput("");
  };

  const handleToggleTakeover = () => {
    if (!activeCall) return;
    if (!isTakeoverActive) {
      setIsTakeoverActive(true);
      setSupervisorMode("takeover");
      takeoverCallBySupervisor(activeCall.id);
    } else {
      setIsTakeoverActive(false);
      setSupervisorMode("eavesdrop");
      addToast({
        title: "Agent Resumed Line",
        description: "Supervisor released takeover. Automated agent resumed conversation.",
        type: "info",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Call Supervision & Assistance"
        description="Monitor active voice calls in real-time. Ingest coach guidance directly into the active speech context without the caller hearing, or take over the line with your microphone."
        badge={
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#EEF2FD] text-[#3157D5] border border-[#3157D5]/20 rounded-full text-xs font-bold">
            <Headphones className="w-3.5 h-3.5" />
            {liveCalls.length} Active Channels
          </span>
        }
      />

      {/* Main Grid: Left Call Selector, Right Cockpit Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Live Calls Channel List */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] card-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDF2F7]">
            <h2 className="text-sm font-bold text-[#0F172A]">Active Call Channels</h2>
            <span className="text-xs font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
              {liveCalls.length} Live
            </span>
          </div>

          <div className="space-y-2.5">
            {liveCalls.length > 0 ? (
              liveCalls.map((call) => {
                const isSelected = selectedCallId === call.id;
                return (
                  <button
                    key={call.id}
                    type="button"
                    onClick={() => setSelectedCallId(call.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-[#000000] text-white border-[#000000] shadow-md ring-2 ring-[#3157D5]/40"
                        : "bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] hover:bg-[#EEF2FD]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs">{call.callerName}</span>
                      <span className="font-mono text-xs text-[#5C82FF] font-bold">
                        {formatDuration(call.durationSeconds)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] opacity-75">
                      <span>Agent: {call.agentName}</span>
                      <span className="font-mono">{call.callerNumber}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-[#64748B] text-xs">
                No active call channels currently running in database.
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Clean Solid Black Command Deck */}
        <div className="lg:col-span-2 bg-[#000000] text-white p-6 rounded-3xl border border-[#1F1F1F] shadow-xl space-y-6">
          {activeCall ? (
            <>
              {/* Deck Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F1F1F]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      Monitoring: {activeCall.callerName}
                    </h2>
                    <span className="text-[10px] font-bold text-[#3157D5] bg-[#3157D5]/20 px-2 py-0.5 rounded-full border border-[#3157D5]/30">
                      ● Channel Connected
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    {activeCall.callerNumber} • Agent: {activeCall.agentName} • Duration: {formatDuration(activeCall.durationSeconds)}
                  </p>
                </div>

                {/* 3 Intervention Mode Buttons */}
                <div className="flex items-center gap-1.5 bg-[#0A0A0A] p-1.5 rounded-2xl border border-[#1F1F1F]">
                  <button
                    onClick={() => setSupervisorMode("eavesdrop")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      supervisorMode === "eavesdrop" ? "bg-[#3157D5] text-white shadow-xs" : "text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    1. Listen
                  </button>
                  <button
                    onClick={() => setSupervisorMode("whisper")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      supervisorMode === "whisper" ? "bg-[#3157D5] text-white shadow-xs" : "text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    2. Whisper
                  </button>
                  <button
                    onClick={handleToggleTakeover}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isTakeoverActive
                        ? "bg-[#3157D5] text-white animate-pulse"
                        : "bg-[#171717] hover:bg-[#262626] text-white"
                    }`}
                  >
                    3. {isTakeoverActive ? "Release" : "Takeover"}
                  </button>
                </div>
              </div>

              {/* Audio Waveform & Status Box */}
              <div className="p-4 bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                  <span>Audio Channel: <strong className="text-white">{isTakeoverActive ? "Supervisor Mic Live" : "Agent Active"}</strong></span>
                  <span className="text-[#3157D5] font-mono font-bold">275ms Latency</span>
                </div>

                {/* Clean Royal Blue Bars (Deterministic integer values to prevent float hydration mismatch) */}
                <div className="flex items-end gap-1 h-14 px-1">
                  {[25, 45, 65, 35, 75, 90, 50, 65, 80, 40, 70, 85, 35, 60, 95, 45, 55, 75, 85, 65, 30, 50, 70, 40, 80, 90, 60, 45, 75, 85, 35, 55, 65, 45, 70, 80, 40, 60, 85, 50].map((height, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-full bg-[#3157D5] transition-all duration-150"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Prompt Injections */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider block">
                  Quick Coaching Injections:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    "Offer 15% discount for 1-year prepayment",
                    "Verify their active cloud infrastructure footprint",
                    "Ask for full-time agent headcount",
                    "Propose Thursday 2:00 PM PST with Alex Chen",
                    "Ask if they have an active SOC2 requirement",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendWhisper(chip)}
                      className="text-xs bg-[#0A0A0A] hover:bg-[#3157D5] text-white px-3.5 py-1.5 rounded-xl border border-[#1F1F1F] transition-all font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Whisper Input */}
              <div className="space-y-2 pt-2 border-t border-[#1F1F1F]">
                <label className="text-xs font-semibold text-white block">Inject Guidance to Agent:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={whisperInput}
                    onChange={(e) => setWhisperInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendWhisper()}
                    placeholder="Type guidance to inject into live speech turn..."
                    className="flex-1 text-xs px-4 py-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl text-white placeholder-[#71717A] outline-none focus:border-[#3157D5]"
                  />
                  <button
                    onClick={() => handleSendWhisper()}
                    className="px-5 py-3 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-[#A1A1AA] space-y-3">
              <Headphones className="w-10 h-10 text-[#3157D5] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-white">No Active Call Selected</h3>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                When a live inbound or outbound call connects, supervisors can listen, inject whisper coaching, or take over the line in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
