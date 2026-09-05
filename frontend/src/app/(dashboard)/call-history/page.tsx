"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Call } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import {
  History,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  FileText,
  Volume2,
  PhoneCall,
  Calendar,
  Clock,
  ArrowRight,
  X,
  Bot,
  User,
  Zap,
} from "lucide-react";

export default function CallHistoryPage() {
  const { calls, addToast } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [selectedCallForAudio, setSelectedCallForAudio] = useState<Call | null>(null);
  const [selectedCallForTranscript, setSelectedCallForTranscript] = useState<Call | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentTimeSec, setCurrentTimeSec] = useState(32);

  const filteredCalls = (calls || []).filter((call) => {
    const callerName = call?.callerName || call?.contactName || "";
    const callerNumber = call?.callerNumber || call?.contactPhone || "";
    const agentName = call?.agentName || "";

    const matchesSearch =
      callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      callerNumber.includes(searchQuery) ||
      agentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDirection =
      directionFilter === "all" ? true : call.direction === directionFilter;

    const matchesSentiment =
      sentimentFilter === "all" ? true : call.sentiment === sentimentFilter;

    return matchesSearch && matchesDirection && matchesSentiment;
  });

  const handleExportCSV = () => {
    addToast({
      title: "Export Generated",
      description: `Downloaded ${filteredCalls.length} call logs with audio timestamps.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call History & Recordings"
        description="Comprehensive audit log of all completed voice sessions, recordings, AI sentiment analysis, and transcripts."
        actions={
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F4F7FB] border border-[#E5EAF2] text-[#172033] text-xs font-semibold rounded-xl transition-all"
          >
            <Download className="w-4 h-4 text-[#78849A]" />
            <span>Export Call Logs (CSV)</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#78849A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search calls by caller name, number, agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] placeholder-[#78849A] outline-none focus:border-[#3157D5]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-medium text-[#172033] outline-none focus:border-[#3157D5]"
          >
            <option value="all">All Directions</option>
            <option value="inbound">Inbound Only</option>
            <option value="outbound">Outbound Only</option>
          </select>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-medium text-[#172033] outline-none focus:border-[#3157D5]"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FB] text-[#78849A] uppercase tracking-wider font-semibold border-b border-[#E5EAF2]">
              <tr>
                <th className="p-4">Caller & Direction</th>
                <th className="p-4">Assigned Agent</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Sentiment</th>
                <th className="p-4">Qualification</th>
                <th className="p-4">Cost</th>
                <th className="p-4 text-right">Playback & Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF2]">
              {filteredCalls.map((call) => (
                <tr key={call.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-[#172033]">{call.callerName}</span>
                    <p className="text-[10px] font-mono text-[#78849A]">
                      {call.callerNumber} • <span className="capitalize">{call.direction}</span>
                    </p>
                  </td>
                  <td className="p-4 font-medium text-[#172033]">{call.agentName}</td>
                  <td className="p-4 font-mono">{formatDuration(call.durationSeconds)}</td>
                  <td className="p-4">
                    <span
                      className={`font-semibold capitalize px-2 py-0.5 rounded-full text-[10px] ${
                        call.sentiment === "positive"
                          ? "bg-[#E8F7F0] text-[#16A36A]"
                          : call.sentiment === "negative"
                          ? "bg-[#FDF2F3] text-[#D95C68]"
                          : "bg-[#FEF7EC] text-[#D99025]"
                      }`}
                    >
                      {call.sentiment} ({call.sentimentScore}%)
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusPill status={call.qualificationStatus as any} size="sm" />
                  </td>
                  <td className="p-4 font-mono text-[#78849A]">${call.cost?.toFixed(2) || "0.18"}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCallForAudio(call);
                        setIsPlaying(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF2FD] text-[#3157D5] font-semibold rounded-lg hover:bg-[#E0E7FB] transition-colors"
                    >
                      <Play className="w-3 h-3" /> Audio
                    </button>
                    <button
                      onClick={() => setSelectedCallForTranscript(call)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5EAF2] text-[#172033] font-semibold rounded-lg hover:bg-[#F4F7FB] transition-colors"
                    >
                      <FileText className="w-3 h-3" /> Transcript
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audio Playback Modal */}
      {selectedCallForAudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101A33]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Recording Playback</h3>
                <p className="text-[11px] text-[#78849A]">
                  {selectedCallForAudio.callerName} • {selectedCallForAudio.agentName}
                </p>
              </div>
              <button onClick={() => setSelectedCallForAudio(null)} className="text-[#78849A] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Waveform Scrubber Simulation */}
            <div className="p-4 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] space-y-3">
              <div className="flex items-end justify-between gap-1 h-14 px-2">
                {Array.from({ length: 32 }).map((_, idx) => {
                  const isPassed = idx <= Math.floor((currentTimeSec / selectedCallForAudio.durationSeconds) * 32);
                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentTimeSec(Math.floor((idx / 32) * selectedCallForAudio.durationSeconds))}
                      className={`flex-1 rounded-full cursor-pointer transition-all ${
                        isPassed ? "bg-[#3157D5]" : "bg-[#CBD5E1]"
                      }`}
                      style={{ height: `${(idx % 5 + 2) * 18}%` }}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-[#78849A]">
                <span>{formatDuration(currentTimeSec)}</span>
                <span>{formatDuration(selectedCallForAudio.durationSeconds)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs">
                {[1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-0.5 rounded font-mono ${
                      playbackSpeed === s ? "bg-[#3157D5] text-white font-bold" : "text-[#78849A] hover:text-[#172033]"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-[#3157D5] text-white flex items-center justify-center hover:bg-[#2646B8] shadow-md shadow-[#3157D5]/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  addToast({ title: "Downloading WAV", description: "Audio master track saved.", type: "success" });
                }}
                className="text-xs font-semibold text-[#3157D5] hover:underline"
              >
                Download WAV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {selectedCallForTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101A33]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] max-w-xl w-full p-6 space-y-4 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2] shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Call Transcript Log</h3>
                <p className="text-[11px] text-[#78849A]">
                  Session #{selectedCallForTranscript.id} • {selectedCallForTranscript.callerName}
                </p>
              </div>
              <button onClick={() => setSelectedCallForTranscript(null)} className="text-[#78849A] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs">
              {selectedCallForTranscript.transcript.length === 0 ? (
                <div className="py-8 text-center text-[#78849A]">No full transcript turns stored for this call.</div>
              ) : (
                selectedCallForTranscript.transcript.map((msg) => {
                  const isAgent = msg.speaker === "agent";
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isAgent ? "items-start" : "items-start flex-row-reverse"}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0 ${isAgent ? "bg-[#3157D5]" : "bg-[#101A33]"}`}>
                        {isAgent ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`p-3 rounded-xl max-w-[80%] ${isAgent ? "bg-[#F4F7FB] text-[#172033]" : "bg-[#3157D5] text-white"}`}>
                        <div className="flex justify-between text-[10px] opacity-80 mb-1">
                          <span className="font-bold">{isAgent ? selectedCallForTranscript.agentName : selectedCallForTranscript.callerName}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#E5EAF2] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCallForTranscript(null)}
                className="px-4 py-2 bg-[#F4F7FB] hover:bg-[#E5EAF2] text-[#172033] text-xs font-semibold rounded-xl"
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
