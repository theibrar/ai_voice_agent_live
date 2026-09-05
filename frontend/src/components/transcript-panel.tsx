"use client";

import React, { useRef, useEffect, useState } from "react";
import { TranscriptMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bot, User, Wrench, Search, Zap, CheckCircle2, Copy } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  agentName?: string;
  callerName?: string;
  isLive?: boolean;
  className?: string;
}

export function TranscriptPanel({
  messages,
  agentName = "AI Voice Agent",
  callerName = "Caller",
  isLive = false,
  className,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filterText, setFilterText] = useState("");
  const { addToast } = useAppStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filtered = messages.filter((m) =>
    m.text.toLowerCase().includes(filterText.toLowerCase())
  );

  const copyTranscript = () => {
    const raw = messages
      .map((m) => `[${m.timestamp}] ${m.speaker === "agent" ? agentName : callerName}: ${m.text}`)
      .join("\n");
    navigator.clipboard.writeText(raw);
    addToast({ title: "Transcript Copied", description: "Copied full transcript to clipboard.", type: "success" });
  };

  return (
    <div className={cn("flex flex-col bg-white rounded-2xl border border-[#E5EAF2] card-shadow overflow-hidden", className)}>
      {/* Header with Search and Copy */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5EAF2] bg-[#F4F7FB]/70">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
            Live Conversation Transcript
          </h3>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#16A36A] bg-[#E8F7F0] px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] animate-ping" />
              Streaming
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#78849A] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="text-xs pl-8 pr-2.5 py-1 bg-white border border-[#E5EAF2] rounded-lg text-[#172033] placeholder-[#78849A] outline-none focus:border-[#3157D5] w-36 sm:w-48"
            />
          </div>

          <button
            onClick={copyTranscript}
            title="Copy transcript text"
            className="p-1.5 text-[#78849A] hover:text-[#172033] hover:bg-white rounded-lg border border-[#E5EAF2] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px] min-h-[280px]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#78849A] text-xs">
            <Bot className="w-8 h-8 text-[#94A3B8] mb-2 stroke-[1.5]" />
            <p className="font-medium">No transcript turns yet.</p>
            <p className="text-[11px]">Speech turns will appear here as the conversation unfolds.</p>
          </div>
        ) : (
          filtered.map((msg) => {
            const isAgent = msg.speaker === "agent";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150",
                  isAgent ? "items-start" : "items-start flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-[10px] shadow-2xs mt-0.5",
                    isAgent ? "bg-[#3157D5]" : "bg-[#101A33]"
                  )}
                >
                  {isAgent ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div className={cn("flex flex-col max-w-[82%]", isAgent ? "items-start" : "items-end")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[11px] text-[#172033]">
                      {isAgent ? agentName : callerName}
                    </span>
                    <span className="text-[10px] text-[#78849A] font-mono">{msg.timestamp}</span>
                    {msg.latencyMs && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#3157D5] bg-[#EEF2FD] px-1.5 py-0.2 rounded font-mono font-medium">
                        <Zap className="w-2.5 h-2.5" />
                        {msg.latencyMs}ms
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-2xl leading-relaxed text-xs",
                      isAgent
                        ? "bg-[#F4F7FB] text-[#172033] rounded-tl-xs border border-[#E5EAF2]"
                        : "bg-[#3157D5] text-white rounded-tr-xs shadow-xs"
                    )}
                  >
                    {msg.text}
                  </div>

                  {/* Tool Call telemetry badge if executed */}
                  {msg.toolCall && (
                    <div className="mt-1.5 p-2 bg-[#EEF2FD] border border-[#3157D5]/20 rounded-xl text-[11px] text-[#101A33] flex items-center gap-2 max-w-full">
                      <div className="w-5 h-5 rounded-md bg-[#3157D5] text-white flex items-center justify-center shrink-0">
                        <Wrench className="w-3 h-3" />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-[#3157D5]">Tool Executed: {msg.toolCall.name}()</span>
                        {msg.toolCall.resultSummary && (
                          <p className="text-[10px] text-[#78849A] truncate">{msg.toolCall.resultSummary}</p>
                        )}
                      </div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A] ml-auto shrink-0" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
