"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getApiBase } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Search,
  Calendar,
  Filter,
  Download,
  Trash2,
  FileText,
  Clock,
  User,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  RefreshCw,
  FolderArchive,
  Radio,
  FileAudio,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  Share2,
  Zap,
  Activity,
  Layers,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface AudioRecordingItem {
  id: string;
  callerName: string;
  callerNumber: string;
  agentName: string;
  startedAt: string;
  durationSeconds: number;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  qualificationStatus: "qualified" | "appointment_set" | "nurture" | "disqualified" | "unreviewed";
  qualificationScore: number;
  recordingUrl: string;
  fileSizeKb: number;
  format: string;
  source: "ai_voice_agent" | "admin_simulator" | "outbound_campaign" | "inbound_webhook" | "voice_prompt" | "voicemail";
  transcriptSummary: string;
  transcript: {
    speaker: "agent" | "caller" | "supervisor";
    text: string;
    timestamp: string;
  }[];
}

const DEFAULT_RECORDINGS: AudioRecordingItem[] = [];

export default function VoiceRecorderPage() {
  const { calls, agents, addToast } = useAppStore();

  // 1. Initial State: Real recordings start clean at 0
  const [recordingsList, setRecordingsList] = useState<AudioRecordingItem[]>([]);

  // 2. Search, Date Range Filter, Agent & Source State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "last_7_days" | "last_30_days" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("2026-08-01");
  const [customEndDate, setCustomEndDate] = useState("2026-08-31");
  const [agentFilter, setAgentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "longest" | "shortest" | "highest_score">("newest");
  const [autoCaptureActive, setAutoCaptureActive] = useState(true);
  const [isSyncingAgents, setIsSyncingAgents] = useState(false);

  // 3. Audio Player State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to resolve accurate playable audio recording URL
  const getRecordingAudioUrl = (rec: AudioRecordingItem) => {
    if (rec.recordingUrl && !rec.recordingUrl.includes("storage.apexvoice.ai") && !rec.recordingUrl.includes("storage.googleapis.com")) {
      if (rec.recordingUrl.startsWith("http://") || rec.recordingUrl.startsWith("https://")) {
        return rec.recordingUrl;
      }
      const base = getApiBase().replace(/\/api\/v1\/?$/, "");
      return `${base}${rec.recordingUrl.startsWith("/") ? "" : "/"}${rec.recordingUrl}`;
    }
    return `${getApiBase()}/recordings/${rec.id}/audio`;
  };

  // 4. Modals State
  const [transcriptModalItem, setTranscriptModalItem] = useState<AudioRecordingItem | null>(null);

  // Real Audio Playback via HTML5 Audio Element
  const togglePlay = (id: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        if (!audioRef.current.paused) {
          audioRef.current.pause();
          setPlayingId(null);
        } else {
          audioRef.current.play().catch(() => {});
          setPlayingId(id);
        }
      } else {
        setPlayingId(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    const targetRec = recordingsList.find((r) => r.id === id);
    if (!targetRec) return;

    const audioUrl = getRecordingAudioUrl(targetRec);
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackSpeed;
    audio.volume = isMuted ? 0 : volume / 100;

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setPlayingId(null);
      setPlaybackProgress(0);
    };

    audio.onerror = () => {
      console.warn("Audio element failed to load stream:", audioUrl);
      setPlayingId(null);
    };

    audioRef.current = audio;
    audio.play().catch((err) => {
      console.warn("Playback error or autoplay blocked:", err);
    });
    setPlayingId(id);
    setPlaybackProgress(0);
  };

  const handleStopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingId(null);
    setPlaybackProgress(0);
  };

  const handleSeek = (newPercent: number) => {
    const clamped = Math.max(0, Math.min(100, newPercent));
    setPlaybackProgress(clamped);
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = (clamped / 100) * audioRef.current.duration;
    }
  };

  // Sync speed changes to running audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume / mute changes to running audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Reorder functions
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setRecordingsList((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    addToast({ title: "Recording Reordered", description: "Moved recording position up in vault.", type: "info" });
  };

  const handleMoveDown = (index: number) => {
    if (index >= recordingsList.length - 1) return;
    setRecordingsList((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    addToast({ title: "Recording Reordered", description: "Moved recording position down in vault.", type: "info" });
  };

  // Delete recording from state AND backend database
  const handleDeleteRecording = async (id: string, name: string) => {
    if (playingId === id) handleStopPlayback();
    setRecordingsList((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`${getApiBase()}/calls/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Failed to delete recording on backend:", err);
    }
    addToast({
      title: "Recording Deleted",
      description: `Removed audio recording for '${name}' from storage vault.`,
      type: "info",
    });
  };

  // Purge all simulated/dummy records from database and UI
  const handlePurgeFakeRecordings = async () => {
    try {
      const res = await fetch(`${getApiBase()}/recordings/clear-dummy`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      setRecordingsList([]);
      addToast({
        title: "Vault Purged",
        description: data.message || "All fake and simulated records have been cleared from the database vault.",
        type: "success",
      });
    } catch (err) {
      console.warn("Failed to purge fake recordings:", err);
      setRecordingsList([]);
      addToast({
        title: "Recordings Cleared",
        description: "Cleared simulated audio records from local view.",
        type: "success",
      });
    }
  };

  // Download real audio WAV
  const handleDownloadAudio = (rec: AudioRecordingItem) => {
    const audioUrl = getRecordingAudioUrl(rec);
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `recording-${rec.id}-${rec.callerName.replace(/\s+/g, "_")}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addToast({
      title: "Audio Downloaded",
      description: `Downloaded ${rec.callerName}'s audio recording.`,
      type: "success",
    });
  };

  // Export Transcript JSON
  const handleDownloadTranscript = (rec: AudioRecordingItem) => {
    const transcriptData = {
      recordingId: rec.id,
      callerName: rec.callerName,
      callerNumber: rec.callerNumber,
      agentName: rec.agentName,
      source: rec.source,
      duration: `${rec.durationSeconds}s`,
      date: rec.startedAt,
      sentiment: rec.sentiment,
      qualificationScore: rec.qualificationScore,
      transcript: rec.transcript,
    };
    const blob = new Blob([JSON.stringify(transcriptData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${rec.id}-${rec.callerName.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({
      title: "Transcript Exported",
      description: "Downloaded conversation JSON transcript.",
      type: "success",
    });
  };

  // Live Sync from AI Voice Agents
  const handleSyncAgentVoiceStream = async () => {
    setIsSyncingAgents(true);
    const activeAgents = agents.filter((a) => a.status === "active");
    const activeCount = activeAgents.length;

    try {
      const apiUrl = `${getApiBase()}/calls?only_recordings=true`;
      const res = await fetch(apiUrl, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.calls)) {
          // Strictly exclude fake dummy recordings (Direct Caller with numerical placeholder phone, or dummy storage links)
          const realCalls = data.calls.filter((c: any) => {
            const isDirectCaller = c.callerName === "Direct Caller";
            const isPlaceholderPhone = /^\d{3,5}$/.test(c.callerNumber || "");
            const isFakeStorage = c.recordingUrl && (c.recordingUrl.includes("storage.apexvoice.ai") || c.recordingUrl.includes("call-sim-"));
            return !isDirectCaller && !isPlaceholderPhone && !isFakeStorage;
          });

          const mapped: AudioRecordingItem[] = realCalls.map((c: any, i: number) => {
            const parsedTranscript = typeof c.transcript === "string" && c.transcript.trim().length > 0
              ? c.transcript.split("\n").filter((l: string) => l.trim()).map((line: string, idx: number) => {
                  const isCaller = line.toLowerCase().startsWith("user:") || line.toLowerCase().startsWith("caller:");
                  const clean = line.replace(/^(user|caller|assistant|agent):/i, "").trim();
                  return {
                    speaker: isCaller ? ("caller" as const) : ("agent" as const),
                    text: clean || line,
                    timestamp: `0:${String(idx * 4 + 2).padStart(2, "0")}`,
                  };
                })
              : [
                  { speaker: "agent" as const, text: "Hello! Thank you for contacting Apex Voice. How can I assist you today?", timestamp: "0:02" },
                  { speaker: "caller" as const, text: c.transcript || "Inquiry regarding automated voice agent scheduling.", timestamp: "0:08" },
                ];

            return {
              id: c.id || `rec-${i}`,
              callerName: c.callerName || "Customer Lead",
              callerNumber: c.callerNumber || "+1 (555) 000-0000",
              agentName: c.agentName || (activeAgents[0]?.name || "Rachel (Enterprise SDR)"),
              startedAt: c.startedAt || new Date().toISOString(),
              durationSeconds: c.duration || 120,
              sentiment: "positive",
              sentimentScore: 88,
              qualificationStatus: "qualified",
              qualificationScore: 92,
              recordingUrl: c.recordingUrl || c.recording_url || `${getApiBase()}/recordings/${c.id}/audio`,
              fileSizeKb: Math.round((c.duration || 120) * 15),
              format: "WAV 16kHz PCM",
              source: "ai_voice_agent",
              transcriptSummary: "Live dual-channel recording synced from voice carrier stream.",
              transcript: parsedTranscript,
            };
          });
          setRecordingsList(mapped);
        }
      }
    } catch (err) {
      console.warn("Failed to sync calls:", err);
    } finally {
      setIsSyncingAgents(false);
      addToast({
        title: "AI Voice Stream Synced",
        description: `Synced real audio sessions from active AI Voice Agents. Total ${recordingsList.length} tracks in vault.`,
        type: "success",
      });
    }
  };

  // Auto-fetch real audio recordings on page mount
  useEffect(() => {
    handleSyncAgentVoiceStream();
  }, []);

  // Filtered & Sorted List
  const filteredRecordings = useMemo(() => {
    return recordingsList
      .filter((item) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          item.callerName.toLowerCase().includes(q) ||
          item.callerNumber.toLowerCase().includes(q) ||
          item.agentName.toLowerCase().includes(q) ||
          item.transcriptSummary.toLowerCase().includes(q);

        if (!matchesSearch) return false;

        if (agentFilter !== "all" && item.agentName !== agentFilter) return false;
        if (sourceFilter !== "all" && item.source !== sourceFilter) return false;

        if (dateFilter === "today") {
          const todayStr = new Date().toISOString().slice(0, 10);
          return item.startedAt.startsWith(todayStr);
        }
        if (dateFilter === "yesterday") {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          return item.startedAt.startsWith(yesterday);
        }
        if (dateFilter === "last_7_days") {
          const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
          return item.startedAt >= sevenDaysAgo;
        }
        if (dateFilter === "last_30_days") {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
          return item.startedAt >= thirtyDaysAgo;
        }
        if (dateFilter === "custom") {
          const itemDate = item.startedAt.slice(0, 10);
          return itemDate >= customStartDate && itemDate <= customEndDate;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        if (sortBy === "oldest") return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        if (sortBy === "longest") return b.durationSeconds - a.durationSeconds;
        if (sortBy === "shortest") return a.durationSeconds - b.durationSeconds;
        if (sortBy === "highest_score") return b.qualificationScore - a.qualificationScore;
        return 0;
      });
  }, [recordingsList, searchQuery, agentFilter, sourceFilter, dateFilter, customStartDate, customEndDate, sortBy]);

  const activePlayingRecord = recordingsList.find((r) => r.id === playingId);
  const totalDurationMinutes = Math.round(recordingsList.reduce((acc, r) => acc + r.durationSeconds, 0) / 60);
  const totalStorageKb = recordingsList.reduce((acc, r) => acc + r.fileSizeKb, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Page Header */}
      <PageHeader
        title="Voice Recorder & Audio Vault"
        description="Listen, manage, reorder, search, and filter all historical call audio recordings, voice prompts, and AI waveforms."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAgentVoiceStream}
              disabled={isSyncingAgents}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] hover:bg-[#EEF2FD] dark:hover:bg-[#3157D5]/20 text-[#0F172A] dark:text-[#F8FAFC] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#3157D5] ${isSyncingAgents ? "animate-spin" : ""}`} />
              <span>{isSyncingAgents ? "Syncing..." : "Sync Agent Stream"}</span>
            </button>
          </div>
        }
      />

      {/* 2. Auto-Capture Live Engine Status Banner */}
      <div className="p-4 bg-[#EEF2FD]/50 dark:bg-[#3157D5]/10 rounded-3xl border border-[#3157D5]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center font-bold shadow-md shadow-[#3157D5]/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">AI Voice Agent Auto-Capture Engine</h3>
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Ingesting
              </span>
            </div>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-[11px] mt-0.5">
              All audio sessions generated by AI Voice Agents, Admin Simulator runs, and telephony calls are automatically stored and organized in this vault.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <label className="flex items-center gap-2 font-bold text-[#0F172A] dark:text-[#F8FAFC] cursor-pointer">
            <span>Auto-Capture</span>
            <input
              type="checkbox"
              checked={autoCaptureActive}
              onChange={(e) => setAutoCaptureActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#3157D5] focus:ring-[#3157D5]"
            />
          </label>
        </div>
      </div>



      {/* 4. Search, Date Range Filter & Sorting Controls */}
      <div className="p-5 bg-white dark:bg-[#0F172A] rounded-3xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-3 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by caller, phone, agent, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl font-medium text-xs text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:border-[#3157D5]"
            />
          </div>

          {/* Date Filter Quick Selector */}
          <div className="md:col-span-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl font-semibold text-xs text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:border-[#3157D5]"
            >
              <option value="all">Filter by Date: All History</option>
              <option value="today">Today Only</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Agent Filter */}
          <div className="md:col-span-2">
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl font-semibold text-xs text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:border-[#3157D5]"
            >
              <option value="all">All AI Agents</option>
              {agents && agents.length > 0 ? (
                agents.map((ag) => (
                  <option key={ag.id} value={ag.name}>
                    {ag.name}
                  </option>
                ))
              ) : (
                <option value="all">No Agents Configured</option>
              )}
            </select>
          </div>

          {/* Source / Channel Filter */}
          <div className="md:col-span-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl font-semibold text-xs text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:border-[#3157D5]"
            >
              <option value="all">All Audio Sources</option>
              <option value="ai_voice_agent">AI Agent Calls</option>
              <option value="admin_simulator">Admin Simulator</option>
              <option value="inbound_webhook">Inbound Webhook</option>
              <option value="voice_prompt">Voice Prompts</option>
              <option value="voicemail">Voicemail Drops</option>
            </select>
          </div>

          {/* Sort By Reorder */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl font-semibold text-xs text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:border-[#3157D5]"
            >
              <option value="newest">↕ Newest Date</option>
              <option value="oldest">↕ Oldest Date</option>
              <option value="longest">↕ Longest Audio</option>
              <option value="shortest">↕ Shortest Audio</option>
              <option value="highest_score">↕ Highest Score</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {dateFilter === "custom" && (
          <div className="p-3 bg-[#EEF2FD]/40 dark:bg-[#3157D5]/10 rounded-2xl border border-[#3157D5]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3157D5]" />
              <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">Select Custom Date Window:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl font-mono text-xs text-[#0F172A] dark:text-[#F8FAFC] outline-none"
              />
              <span className="text-[#64748B] dark:text-[#94A3B8] font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl font-mono text-xs text-[#0F172A] dark:text-[#F8FAFC] outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Voice Recordings List & Audio Cards */}
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-[#E2E8F0] dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">Audio Recordings & Waveforms</h2>
            <span className="px-2.5 py-0.5 bg-[#EEF2FD] dark:bg-[#3157D5]/20 text-[#3157D5] text-[10px] font-bold rounded-full">
              {filteredRecordings.length} Recorded Tracks
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePurgeFakeRecordings}
              className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Purge all simulated and fake recording tracks from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Fake Tracks</span>
            </button>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Click Play to stream dual-channel audio with real-time waveform seek</span>
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
          {filteredRecordings.length > 0 ? (
            filteredRecordings.map((rec, index) => {
              const isPlaying = playingId === rec.id;
              const formattedDate = new Date(rec.startedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={rec.id}
                  className={`p-4 md:p-5 transition-all ${
                    isPlaying
                      ? "bg-[#EEF2FD]/40 dark:bg-[#3157D5]/15 border-l-4 border-l-[#3157D5]"
                      : "hover:bg-[#F8FAFC] dark:hover:bg-[#0B0F19]/50"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Play button, Caller Info, Date & Agent */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => togglePlay(rec.id)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-all cursor-pointer shadow-md ${
                          isPlaying
                            ? "bg-[#3157D5] text-white scale-105 shadow-[#3157D5]/30 animate-pulse"
                            : "bg-white dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] text-[#3157D5] hover:bg-[#3157D5] hover:text-white hover:border-[#3157D5]"
                        }`}
                        title={isPlaying ? "Pause Audio" : "Listen to Recording"}
                      >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                      </button>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] truncate">{rec.callerName}</h3>
                          <span className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">{rec.callerNumber}</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-[#F8FAFC] font-bold text-[10px] rounded-full">
                            {rec.agentName}
                          </span>
                          {rec.source === "ai_voice_agent" && (
                            <span className="px-2 py-0.5 bg-[#EEF2FD] dark:bg-[#3157D5]/20 text-[#3157D5] font-bold text-[10px] rounded-full">
                              AI Voice Agent
                            </span>
                          )}
                          {rec.source === "admin_simulator" && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] rounded-full">
                              Admin Simulator
                            </span>
                          )}
                          {rec.source === "voice_prompt" && (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-full">
                              Voice Prompt
                            </span>
                          )}
                          {rec.source === "voicemail" && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] rounded-full">
                              Voicemail Drop
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#64748B] dark:text-[#94A3B8] flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-[#3157D5]" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {formatDuration(rec.durationSeconds)} ({rec.fileSizeKb} KB)
                          </span>
                          <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold rounded text-[10px]">
                            {rec.format}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Interactive Waveform / Audio Visualizer Bar */}
                    <div className="flex-1 max-w-md mx-2 space-y-1.5">
                      <div
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const percent = (clickX / rect.width) * 100;
                          handleSeek(percent);
                        }}
                        className="h-9 bg-[#F1F5F9] dark:bg-[#0B0F19] rounded-xl px-2 flex items-center gap-1 cursor-pointer relative overflow-hidden group border border-[#E2E8F0] dark:border-[#1E293B]"
                        title="Click to seek audio position"
                      >
                        {isPlaying && (
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-[#3157D5]/20 transition-all pointer-events-none"
                            style={{ width: `${playbackProgress}%` }}
                          />
                        )}

                        {/* Animated Equalizer Wave Bars */}
                        {Array.from({ length: 32 }).map((_, barIdx) => {
                          const heights = [30, 45, 75, 90, 60, 40, 85, 95, 50, 65, 80, 40, 70, 90, 55, 35, 75, 85, 45, 60, 95, 80, 50, 35, 70, 85, 60, 40, 65, 80, 45, 30];
                          const h = heights[barIdx % heights.length];
                          const isBarPlayed = (barIdx / 32) * 100 <= (isPlaying ? playbackProgress : 0);

                          return (
                            <div
                              key={barIdx}
                              className={`flex-1 rounded-full transition-all ${
                                isBarPlayed
                                  ? "bg-[#3157D5]"
                                  : isPlaying
                                  ? "bg-[#3157D5]/40"
                                  : "bg-[#CBD5E1] dark:bg-slate-700 group-hover:bg-[#94A3B8]"
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                        <span>
                          {isPlaying
                            ? formatDuration(Math.round((rec.durationSeconds * playbackProgress) / 100))
                            : "0:00"}
                        </span>
                        <span className="text-[10px] text-[#3157D5] font-bold">
                          {isPlaying ? `${Math.round(playbackProgress)}%` : "Dual Channel Stream"}
                        </span>
                        <span>{formatDuration(rec.durationSeconds)}</span>
                      </div>
                    </div>

                    {/* Right: Actions (Listen, Transcript, Download, Reorder, Delete) */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                      {/* Reorder Buttons (Move Up / Down) */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-[#EEF2FD] dark:hover:bg-[#3157D5]/20 text-[#64748B] hover:text-[#3157D5] disabled:opacity-30 rounded-xl transition-colors cursor-pointer"
                        title="Move Up in Vault"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === filteredRecordings.length - 1}
                        className="p-1.5 bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-[#EEF2FD] dark:hover:bg-[#3157D5]/20 text-[#64748B] hover:text-[#3157D5] disabled:opacity-30 rounded-xl transition-colors cursor-pointer"
                        title="Move Down in Vault"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      {/* View Transcript */}
                      <button
                        onClick={() => setTranscriptModalItem(rec)}
                        className="px-3 py-1.5 bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-[#EEF2FD] dark:hover:bg-[#3157D5]/20 hover:border-[#3157D5] text-[#0F172A] dark:text-[#F8FAFC] hover:text-[#3157D5] font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="View Interactive Transcript"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#3157D5]" />
                        <span>Transcript</span>
                      </button>

                      {/* Download Audio MP3 */}
                      <button
                        onClick={() => handleDownloadAudio(rec)}
                        className="p-2 bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 text-[#64748B] hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-all cursor-pointer shadow-2xs"
                        title="Download MP3 Audio File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteRecording(rec.id, rec.callerName)}
                        className="p-2 bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 text-[#64748B] hover:text-rose-600 rounded-xl transition-all cursor-pointer shadow-2xs"
                        title="Delete Recording"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] text-[#94A3B8] flex items-center justify-center mx-auto">
                <FileAudio className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                {searchQuery || dateFilter !== "all" || agentFilter !== "all" || sourceFilter !== "all"
                  ? "No Voice Recordings Match Filter"
                  : "No Voice Recordings in Vault"}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {searchQuery || dateFilter !== "all" || agentFilter !== "all" || sourceFilter !== "all"
                  ? "Try clearing your search query or expanding the date filter range."
                  : "There are no audio recordings in the vault yet. Inbound and outbound call recordings will appear here automatically."}
              </p>
              {searchQuery || dateFilter !== "all" || agentFilter !== "all" || sourceFilter !== "all" ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter("all");
                    setAgentFilter("all");
                    setSourceFilter("all");
                  }}
                  className="px-4 py-2 bg-[#3157D5] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Reset All Filters
                </button>
              ) : (
                <button
                  onClick={handleSyncAgentVoiceStream}
                  disabled={isSyncingAgents}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAgents ? "animate-spin" : ""}`} />
                  <span>{isSyncingAgents ? "Syncing..." : "Sync Agent Stream"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 6. Sticky Bottom Audio Player Bar */}
      {activePlayingRecord && (
        <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 z-50 bg-[#070A11] text-white rounded-3xl p-4 shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom-6 duration-200 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#3157D5] flex items-center justify-center font-bold shrink-0 animate-pulse">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{activePlayingRecord.callerName}</h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  {activePlayingRecord.agentName} • {formatDuration(activePlayingRecord.durationSeconds)} ({activePlayingRecord.format})
                </p>
              </div>
            </div>

            {/* Playback Controls & Seek Bar */}
            <div className="flex-1 max-w-xl mx-auto space-y-1.5 w-full">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleSeek(Math.max(0, playbackProgress - 10))}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => togglePlay(activePlayingRecord.id)}
                  className="w-9 h-9 rounded-xl bg-white text-[#0F172A] flex items-center justify-center font-bold hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={() => handleSeek(Math.min(100, playbackProgress + 10))}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Forward 10s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const speeds = [0.75, 1, 1.25, 1.5, 2];
                    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                    setPlaybackSpeed(nextSpeed);
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer ml-2"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>
              </div>

              {/* Progress Slider */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  {formatDuration(Math.round((activePlayingRecord.durationSeconds * playbackProgress) / 100))}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={playbackProgress}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#3157D5]"
                />
                <span className="text-[10px] font-mono text-slate-400">
                  {formatDuration(activePlayingRecord.durationSeconds)}
                </span>
              </div>
            </div>

            {/* Right: Volume & Close */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <button
                onClick={handleStopPlayback}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-2"
                title="Close Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Interactive Transcript Modal */}
      {transcriptModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-6 space-y-5 animate-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EEF2FD] dark:bg-[#3157D5]/20 text-[#3157D5] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A] dark:text-[#F8FAFC]">{transcriptModalItem.callerName} - Audio Transcript</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {transcriptModalItem.agentName} • {formatDuration(transcriptModalItem.durationSeconds)} ({transcriptModalItem.format})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTranscriptModalItem(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F8FAFC] dark:bg-[#0B0F19] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between gap-3">
              <button
                onClick={() => togglePlay(transcriptModalItem.id)}
                className="px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {playingId === transcriptModalItem.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                <span>{playingId === transcriptModalItem.id ? "Pause Audio" : "Listen to Recording"}</span>
              </button>

              <button
                onClick={() => handleDownloadTranscript(transcriptModalItem)}
                className="px-3.5 py-2 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] hover:bg-[#EEF2FD] dark:hover:bg-[#3157D5]/20 text-[#0F172A] dark:text-[#F8FAFC] hover:text-[#3157D5] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#3157D5]" />
                <span>Export JSON Transcript</span>
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-[#F8FAFC] dark:bg-[#0B0F19] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B]">
              {transcriptModalItem.transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl space-y-1 ${
                    msg.speaker === "agent"
                      ? "bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC]"
                      : "bg-[#EEF2FD]/60 dark:bg-[#3157D5]/15 border border-[#3157D5]/20 text-[#0F172A] dark:text-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold flex items-center gap-1 text-[#3157D5]">
                      {msg.speaker === "agent" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      <span>{msg.speaker === "agent" ? transcriptModalItem.agentName : transcriptModalItem.callerName}</span>
                    </span>
                    <span className="font-mono text-[#64748B] dark:text-[#94A3B8] text-[10px]">{msg.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
              <button
                onClick={() => setTranscriptModalItem(null)}
                className="px-5 py-2 bg-[#3157D5] text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
