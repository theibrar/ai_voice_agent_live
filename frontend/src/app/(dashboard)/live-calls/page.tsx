"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatDuration } from "@/lib/utils";
import {
  PhoneCall,
  Search,
  Filter,
  Bot,
  User,
  Clock,
  Activity,
  ArrowRight,
  Sparkles,
  PhoneForwarded,
  Square,
  PhoneOff,
  Radio,
  SlidersHorizontal,
} from "lucide-react";

export default function LiveCallsPage() {
  const { calls, agents, campaigns, endCall, holdCall, activeCallCount } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");

  const filteredCalls = (calls || []).filter((call) => {
    const callerName = call?.callerName || call?.contactName || "";
    const callerNumber = call?.callerNumber || call?.contactPhone || "";
    const agentName = call?.agentName || "";

    const matchesSearch =
      callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      callerNumber.includes(searchQuery) ||
      agentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : call.status === statusFilter;

    const matchesAgent =
      agentFilter === "all" ? true : call.agentId === agentFilter;

    const matchesCampaign =
      campaignFilter === "all" ? true : call.campaignId === campaignFilter;

    return matchesSearch && matchesStatus && matchesAgent && matchesCampaign;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Call Telemetry & Monitoring"
        description="Real-time multi-channel voice monitoring, automated speech transcription, and interactive agent intervention."
        badge={
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#E8F7F0] border border-[#16A36A]/20 text-[#16A36A] rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-ping" />
            {activeCallCount} Active Concurrent Calls
          </span>
        }
      />

      {/* 3-Model GPU Live Stack Telemetry Strip */}
      <div className="p-3.5 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5EAF2] dark:border-[#1E293B] card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#3157D5]/10 text-[#3157D5] flex items-center justify-center font-bold">
            <Radio className="w-4 h-4 text-[#3157D5] animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-[#172033] dark:text-white flex items-center gap-2">
              <span>Active 3-Model GPU AI Stack</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold rounded-full">
                184.144.154.180
              </span>
            </div>
            <p className="text-[11px] text-[#78849A] dark:text-[#94A3B8]">Live calling routed through vLLM, Kokoro-82M, and Faster-Whisper GPU microservices</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="px-2.5 py-1 bg-[#F4F7FB] dark:bg-[#1E293B] border border-indigo-200/60 dark:border-indigo-800/40 rounded-lg text-indigo-700 dark:text-indigo-300 font-medium">
            🧠 Qwen 2.5 7B AWQ (45ms)
          </span>
          <span className="px-2.5 py-1 bg-[#F4F7FB] dark:bg-[#1E293B] border border-sky-200/60 dark:border-sky-800/40 rounded-lg text-sky-700 dark:text-sky-300 font-medium">
            🔊 Kokoro-82M (45ms)
          </span>
          <span className="px-2.5 py-1 bg-[#F4F7FB] dark:bg-[#1E293B] border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg text-emerald-700 dark:text-emerald-300 font-medium">
            🎙️ Faster-Whisper (180ms)
          </span>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[#78849A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by caller, phone, or agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] placeholder-[#78849A] outline-none focus:border-[#3157D5] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#F4F7FB] p-1 rounded-xl border border-[#E5EAF2]">
            {["all", "live", "ringing", "on_hold", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors capitalize ${
                  statusFilter === st
                    ? "bg-white text-[#3157D5] shadow-2xs"
                    : "text-[#78849A] hover:text-[#172033]"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Agent Filter Dropdown */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-medium text-[#172033] outline-none focus:border-[#3157D5]"
          >
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Campaign Filter Dropdown */}
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-medium text-[#172033] outline-none focus:border-[#3157D5]"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Calls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCalls.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
            <Radio className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#172033]">No calls matching filters</h3>
            <p className="text-xs text-[#78849A] mt-1">Try broadening your search or filter criteria.</p>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const isLive = call.status === "live";
            return (
              <div
                key={call.id}
                className={`p-5 bg-white rounded-2xl border transition-all card-shadow flex flex-col justify-between ${
                  isLive ? "border-[#3157D5]/40 ring-2 ring-[#3157D5]/5" : "border-[#E5EAF2]"
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <StatusPill status={call.status || "completed"} />
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-lg">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(call.durationSeconds || call.duration || 60)}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#172033]">{call.callerName || call.contactName || "Jonathan Vance"}</h3>
                      <p className="text-xs text-[#78849A] font-mono">{call.callerNumber || call.contactPhone || "+1 (555) 890-2341"}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#16A36A] block">Score {call.qualificationScore || 85}</span>
                      <span className="text-[10px] text-[#78849A] capitalize">{call.direction || "inbound"}</span>
                    </div>
                  </div>

                  {/* Agent & Campaign Meta */}
                  <div className="p-3 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] space-y-1.5 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#78849A] flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-[#3157D5]" /> Assigned Agent:
                      </span>
                      <span className="font-semibold text-[#172033] truncate max-w-[140px]">{call.agentName || "Rachel (Enterprise SDR)"}</span>
                    </div>
                    {call.campaignName && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#78849A]">Campaign:</span>
                        <span className="text-[#78849A] truncate max-w-[140px]">{call.campaignName}</span>
                      </div>
                    )}
                  </div>

                  {/* Live Waveform Indicator */}
                  {isLive && (
                    <div className="mb-3 p-2 bg-[#EEF2FD] rounded-xl border border-[#3157D5]/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#3157D5] animate-pulse" />
                        <span className="text-xs font-semibold text-[#3157D5]">Live Audio Activity</span>
                      </div>
                      <div className="flex items-end gap-0.5 h-4 w-16">
                        {[40, 80, 60, 95, 30, 70, 85].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-[#3157D5] rounded-full animate-wave-1"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {call.tags && call.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      {call.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-[#F4F7FB] border border-[#E5EAF2] px-2 py-0.5 rounded-md text-[#78849A] font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#EDF2F7] flex items-center justify-between gap-2">
                  {isLive ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => holdCall(call.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#FEF7EC] text-[#D99025] hover:bg-[#FDEBD0] rounded-lg transition-colors"
                      >
                        Hold
                      </button>
                      <button
                        onClick={() => endCall(call.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#FDF2F3] text-[#D95C68] hover:bg-[#FCE8EA] rounded-lg transition-colors"
                      >
                        End
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#78849A]">Call concluded</span>
                  )}

                  <Link
                    href={`/live-calls/${call.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3157D5] hover:underline"
                  >
                    <span>Inspect Call</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
