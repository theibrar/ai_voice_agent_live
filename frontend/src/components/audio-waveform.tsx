"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Mic, Volume2 } from "lucide-react";

interface AudioWaveformProps {
  active?: boolean;
  audioLevel?: number;
  barsCount?: number;
  color?: string;
  speaker?: "agent" | "caller" | "mic";
  label?: string;
  className?: string;
}

export function AudioWaveform({
  active = true,
  audioLevel = 50,
  barsCount = 28,
  color = "#3157D5",
  speaker = "agent",
  label,
  className,
}: AudioWaveformProps) {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: 28 }, (_, i) => 20 + ((i * 7) % 50))
  );

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setHeights((prev) =>
        prev.map(() => {
          const factor = (audioLevel / 100) * 80;
          return Math.max(12, Math.min(95, Math.floor(Math.random() * factor) + 15));
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [active, audioLevel, barsCount]);

  return (
    <div className={cn("flex flex-col gap-2 p-3 bg-[#F4F7FB] rounded-2xl border border-[#E5EAF2]", className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-[#172033]">
          {speaker === "agent" ? (
            <Volume2 className="w-3.5 h-3.5 text-[#3157D5]" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-[#16A36A]" />
          )}
          <span>{label || (speaker === "agent" ? "AI Voice Synthesis Audio" : "Caller Inbound Stream")}</span>
        </div>
        <span className="text-[11px] font-mono font-semibold text-[#78849A]">
          {active ? `${audioLevel}% Level` : "Idle"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 h-12 px-1">
        {heights.map((h, idx) => (
          <div
            key={idx}
            className="flex-1 rounded-full transition-all duration-100 ease-out"
            style={{
              height: `${active ? h : 10}%`,
              backgroundColor: active ? color : "#CBD5E1",
              opacity: active ? 0.7 + (h / 100) * 0.3 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
