"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { getApiBase } from "@/lib/auth-context";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import {
  Terminal,
  Activity,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Mic,
  MicOff,
  Play,
  Pause,
  RefreshCw,
  Search,
  Filter,
  Download,
  Trash2,
  Building2,
  Cpu,
  Clock,
  ShieldAlert,
  Server,
  Zap,
  Radio,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Info,
  X,
} from "lucide-react";

interface DebuggingCallLog {
  id: string;
  callId: string;
  tenantId: number;
  tenantName: string;
  agentId: string;
  agentName: string;
  agentConnected: boolean;
  callerName: string;
  callerNumber: string;
  calledDid: string;
  status: string; // completed, failed, no_answer, busy, agent_unreachable
  duration: number;
  recordingUrl: string;
  recordingRecorded: boolean;
  sipStatusCode: number;
  disconnectReason: string;
  errorReason: string;
  llmModel: string;
  ttsModel: string;
  sttModel: string;
  jitterMs: number;
  packetLoss: number;
  transcript: string;
  createdAt: string;
}

interface DebuggingMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  agentsNotConnected: number;
  recordingsMissing: number;
  avgDurationSec: number;
  avgLatencyMs: number;
  packetLossAvg: number;
}

export default function SuperAdminDebuggingLogsPage() {
  const { addToast } = useSuperAdminStore();

  const [logs, setLogs] = useState<DebuggingCallLog[]>([]);
  const [metrics, setMetrics] = useState<DebuggingMetrics>({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    agentsNotConnected: 0,
    recordingsMissing: 0,
    avgDurationSec: 0,
    avgLatencyMs: 110,
    packetLossAvg: 0.01,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [inspectModalLog, setInspectModalLog] = useState<DebuggingCallLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio Playback State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch real telemetry debugging logs from backend
  const fetchLogs = async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`${getApiBase()}/superadmin/debugging-logs`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        if (showToast) {
          addToast({
            title: "Telemetry Refreshed",
            description: `Loaded ${data.logs?.length || 0} real call & agent diagnostic logs from database.`,
            type: "success",
          });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch debugging logs:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Auto-refresh every 15s if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle Audio Player
  const togglePlayAudio = (log: DebuggingCallLog) => {
    if (playingId === log.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    let url = log.recordingUrl;
    if (!url.startsWith("http")) {
      url = `${getApiBase()}${url.startsWith("/") ? "" : "/"}${url}`;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch((err) => {
      console.warn("Audio play error:", err);
      addToast({
        title: "Playback Notice",
        description: "Audio stream loading or synthesising from vault...",
        type: "info",
      });
    });

    audio.onended = () => {
      setPlayingId(null);
    };

    setPlayingId(log.id);
  };

  // Delete Log
  const handleDeleteLog = async (id: string) => {
    try {
      const res = await fetch(`${getApiBase()}/superadmin/debugging-logs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== id));
        addToast({
          title: "Log Removed",
          description: "Diagnostic record deleted from telemetry vault.",
          type: "info",
        });
      }
    } catch (err) {
      console.warn("Delete log failed:", err);
    }
  };

  // Purge Failed/Error Logs
  const handlePurgeFailed = async () => {
    try {
      const res = await fetch(`${getApiBase()}/superadmin/debugging-logs/purge`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        addToast({
          title: "Errors Purged",
          description: data.message || "Failed and error telemetry logs cleared from database.",
          type: "success",
        });
        fetchLogs();
      }
    } catch (err) {
      console.warn("Purge failed:", err);
    }
  };

  // Copy JSON Diagnostics
  const handleCopyDiagnostics = (log: DebuggingCallLog) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    addToast({
      title: "JSON Copied",
      description: "Full call telemetry diagnostic payload copied to clipboard.",
      type: "success",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Export all logs as JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ metrics, logs }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `superadmin-debugging-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast({
      title: "Export Completed",
      description: "Downloaded comprehensive diagnostic logs file.",
      type: "success",
    });
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        log.callId.toLowerCase().includes(q) ||
        log.callerNumber.toLowerCase().includes(q) ||
        log.calledDid.toLowerCase().includes(q) ||
        log.agentName.toLowerCase().includes(q) ||
        log.tenantName.toLowerCase().includes(q) ||
        log.errorReason.toLowerCase().includes(q) ||
        log.disconnectReason.toLowerCase().includes(q) ||
        String(log.sipStatusCode).includes(q);

      if (!matchesSearch) return false;

      if (tenantFilter !== "all" && String(log.tenantId) !== tenantFilter) return false;

      if (statusFilter === "failed") {
        return log.status === "failed" || log.sipStatusCode >= 400 || log.errorReason.length > 0;
      }
      if (statusFilter === "agent_not_connected") {
        return !log.agentConnected;
      }
      if (statusFilter === "recording_missing") {
        return !log.recordingRecorded;
      }
      if (statusFilter === "completed") {
        return log.status === "completed" && log.agentConnected;
      }

      return true;
    });
  }, [logs, searchQuery, statusFilter, tenantFilter]);

  const uniqueTenants = useMemo(() => {
    const map = new Map<number, string>();
    logs.forEach((l) => map.set(l.tenantId, l.tenantName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3157D5] to-[#5C82FF] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
                Call & Agent Diagnostic Debugging Logs
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5] border border-[#3157D5]/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Ingesting
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Real-time deep diagnostics for failed calls, unreachable agents, SIP disconnect codes, and missing audio vault recordings.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[#3157D5] focus:ring-0 cursor-pointer"
            />
            <span>Auto-Stream (15s)</span>
          </label>

          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#0F172A] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Refresh logs from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#3157D5]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePurgeFailed}
            className="px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Clear all failed/error traces"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Failures</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-[#3157D5] hover:bg-[#2546B8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-[#3157D5]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* 2. Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Calls</span>
            <PhoneCall className="w-4 h-4 text-[#3157D5]" />
          </div>
          <p className="text-2xl font-black text-[#0F172A] mt-2">{metrics.totalCalls}</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            {metrics.successfulCalls} connected successfully
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Failed Calls</span>
            <PhoneOff className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{metrics.failedCalls}</p>
          <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">
            {metrics.failedCalls > 0 ? "Requires Carrier Review" : "0 Connection Failures"}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Agent Disconnects</span>
            <Server className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{metrics.agentsNotConnected}</p>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">
            {metrics.agentsNotConnected > 0 ? "Worker timeout / unassigned" : "All Agents Responsive"}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vault Missing</span>
            <MicOff className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{metrics.recordingsMissing}</p>
          <span className="text-[10px] text-purple-600 font-semibold mt-0.5 block">
            Unrecorded or dropped egress
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Latency</span>
            <Zap className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-[#0F172A] mt-2">{metrics.avgLatencyMs}ms</p>
          <span className="text-[10px] text-cyan-600 font-semibold mt-0.5 block">
            Sub-150ms GPU Target
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Call Time</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-[#0F172A] mt-2">
            {Math.floor(metrics.avgDurationSec / 60)}m {metrics.avgDurationSec % 60}s
          </p>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
            {(metrics.packetLossAvg * 100).toFixed(2)}% Packet Loss
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Call ID, Phone, DID, Agent, Tenant, Error Reason, SIP Code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3157D5] focus:bg-white transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">All Telemetry Logs ({logs.length})</option>
            <option value="failed">⚠️ Failed & Error Calls ({metrics.failedCalls})</option>
            <option value="agent_not_connected">🤖 Agent Not Connected ({metrics.agentsNotConnected})</option>
            <option value="recording_missing">🎙️ Recording Not Recorded ({metrics.recordingsMissing})</option>
            <option value="completed">✅ Successfully Connected ({metrics.successfulCalls})</option>
          </select>

          {/* Tenant Filter */}
          {uniqueTenants.length > 1 && (
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="all">All Tenant Orgs</option>
              {uniqueTenants.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 4. Logs List & Diagnostics Cards */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#0F172A]">Real-Time Call & Agent Telemetry Stream</h2>
            <span className="px-2.5 py-0.5 bg-[#EEF2FD] text-[#3157D5] text-[10px] font-bold rounded-full">
              {filteredLogs.length} Filtered Entries
            </span>
          </div>
          <span className="text-[11px] text-[#64748B]">Click any card to inspect full database diagnostic payload</span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isPlaying = playingId === log.id;
              const isFailed = log.status === "failed" || log.sipStatusCode >= 400 || log.errorReason.length > 0;
              const formattedDate = new Date(log.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div
                  key={log.id}
                  className={`p-4 md:p-5 transition-all ${
                    isFailed
                      ? "bg-rose-50/30 hover:bg-rose-50/50 border-l-4 border-l-rose-500"
                      : !log.agentConnected
                      ? "bg-amber-50/30 hover:bg-amber-50/50 border-l-4 border-l-amber-500"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Status Icon, Call ID, Tenant, Agent & Numbers */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-sm ${
                          isFailed
                            ? "bg-rose-100 text-rose-700"
                            : !log.agentConnected
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isFailed ? (
                          <PhoneOff className="w-5 h-5" />
                        ) : !log.agentConnected ? (
                          <Server className="w-5 h-5" />
                        ) : (
                          <PhoneCall className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded-md">
                            {log.callId}
                          </span>
                          <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formattedDate}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-[#3157D5] border border-blue-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            {log.tenantName}
                          </span>
                        </div>

                        {/* Caller Routing & Agent Info */}
                        <div className="flex items-center gap-3 text-xs text-[#0F172A] flex-wrap font-medium">
                          <span className="font-mono text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded">
                            {log.callerNumber}
                          </span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-mono text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded">
                            DID: {log.calledDid}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-[#3157D5] flex items-center gap-1">
                            <Radio className="w-3 h-3 text-[#3157D5]" />
                            {log.agentName}
                          </span>
                        </div>

                        {/* Diagnostic Pills */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {/* Agent Connected Pill */}
                          {log.agentConnected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Agent Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Agent NOT Connected
                            </span>
                          )}

                          {/* Recording Recorded Pill */}
                          {log.recordingRecorded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Mic className="w-2.5 h-2.5 text-blue-600" />
                              Audio Recorded (Vault Synced)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <MicOff className="w-2.5 h-2.5 text-purple-600" />
                              Recording Not Recorded
                            </span>
                          )}

                          {/* SIP Status Code */}
                          <span
                            className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold border ${
                              log.sipStatusCode === 200
                                ? "bg-slate-50 text-slate-700 border-slate-200"
                                : log.sipStatusCode >= 500
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            SIP {log.sipStatusCode}
                          </span>

                          {/* Duration */}
                          <span className="font-mono text-[10px] text-slate-600">
                            Duration: {Math.floor(log.duration / 60)}m {log.duration % 60}s
                          </span>
                        </div>

                        {/* Error Reason Banner if Failure */}
                        {log.errorReason && (
                          <div className="mt-1.5 p-2 bg-rose-100/60 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span className="font-mono text-[11px] leading-tight">{log.errorReason}</span>
                          </div>
                        )}

                        {/* Disconnect Reason */}
                        {log.disconnectReason && !log.errorReason && (
                          <p className="text-[11px] text-slate-500 font-mono">
                            Disconnect Cause: <span className="font-semibold text-slate-700">{log.disconnectReason}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: AI Pipeline Specs & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                      {/* AI Specs */}
                      <div className="text-[11px] font-mono text-slate-500 space-y-0.5 text-left lg:text-right">
                        <div className="flex items-center lg:justify-end gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-bold">
                            {log.llmModel.split("/").pop()}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-bold">
                            {log.ttsModel}
                          </span>
                        </div>
                        <div>Jitter: {log.jitterMs}ms • Loss: {(log.packetLoss * 100).toFixed(1)}%</div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Play recording audio if available */}
                        {log.recordingRecorded && (
                          <button
                            onClick={() => togglePlayAudio(log)}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isPlaying
                                ? "bg-[#3157D5] text-white border-[#3157D5] animate-pulse"
                                : "bg-white border-slate-200 text-[#3157D5] hover:bg-blue-50"
                            }`}
                            title={isPlaying ? "Pause Stream" : "Play Recording Audio"}
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            <span className="text-[10px]">Play WAV</span>
                          </button>
                        )}

                        {/* Inspect Raw Telemetry Modal */}
                        <button
                          onClick={() => setInspectModalLog(log)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#3157D5]" />
                          <span>Inspect</span>
                        </button>

                        {/* Copy JSON */}
                        <button
                          onClick={() => handleCopyDiagnostics(log)}
                          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                          title="Copy JSON Payload"
                        >
                          {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete Log */}
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                          title="Delete Diagnostic Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Terminal className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-sm text-[#0F172A]">No Matching Telemetry Logs</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                No diagnostic records match your active query or filter. Real call logs will automatically stream in.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTenantFilter("all");
                }}
                className="px-4 py-2 bg-[#3157D5] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Deep Inspection Modal */}
      {inspectModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3157D5] text-white flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Diagnostic Telemetry Details</h3>
                  <p className="text-xs font-mono text-[#64748B]">{inspectModalLog.callId}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectModalLog(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Tenant Organization</span>
                  <p className="font-bold text-slate-800 text-xs">{inspectModalLog.tenantName} (ID: {inspectModalLog.tenantId})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Agent Name & ID</span>
                  <p className="font-bold text-slate-800 text-xs">{inspectModalLog.agentName} ({inspectModalLog.agentId})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Caller & Number</span>
                  <p className="font-bold text-slate-800 text-xs">{inspectModalLog.callerName} ({inspectModalLog.callerNumber})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Destination DID</span>
                  <p className="font-bold text-slate-800 text-xs">{inspectModalLog.calledDid}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">SIP Status Code</span>
                  <p className="font-bold text-slate-800 text-xs">SIP {inspectModalLog.sipStatusCode}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Audio Vault Status</span>
                  <p className="font-bold text-slate-800 text-xs">
                    {inspectModalLog.recordingRecorded ? "Recorded & Synchronized" : "Unrecorded / Missing Egress"}
                  </p>
                </div>
              </div>

              {/* Error Detail */}
              {inspectModalLog.errorReason && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                  <span className="text-[10px] text-rose-700 uppercase font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Error Trace & Diagnosis
                  </span>
                  <p className="text-rose-800 text-xs">{inspectModalLog.errorReason}</p>
                </div>
              )}

              {/* Transcript */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#3157D5]" />
                  Call Conversation Transcript
                </span>
                <pre className="p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                  {inspectModalLog.transcript || "No speech transcript recorded for this session."}
                </pre>
              </div>

              {/* Raw JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Raw Diagnostic JSON Payload</span>
                  <button
                    onClick={() => handleCopyDiagnostics(inspectModalLog)}
                    className="text-[10px] text-[#3157D5] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Copy JSON
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[10px] overflow-x-auto max-h-48">
                  {JSON.stringify(inspectModalLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectModalLog(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
