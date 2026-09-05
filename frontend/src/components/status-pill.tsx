"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  status:
    | "live"
    | "ringing"
    | "on_hold"
    | "transferred"
    | "completed"
    | "active"
    | "paused"
    | "draft"
    | "indexed"
    | "processing"
    | "error"
    | "qualified"
    | "unqualified"
    | "confirmed"
    | "pending"
    | "rescheduled"
    | "cancelled"
    | "connected"
    | "warning"
    | "offline"
    | (string & {});
  size?: "sm" | "md";
  className?: string;
}

export function StatusPill({ status, size = "md", className }: StatusPillProps) {
  const configMap: Record<
    string,
    { label: string; bg: string; text: string; dot: string; isLive?: boolean }
  > = {
    live: { label: "Live Call", bg: "bg-[#E8F7F0]", text: "text-[#16A36A]", dot: "bg-[#16A36A]", isLive: true },
    ringing: { label: "Ringing", bg: "bg-[#FEF7EC]", text: "text-[#D99025]", dot: "bg-[#D99025]", isLive: true },
    on_hold: { label: "On Hold", bg: "bg-[#FEF7EC]", text: "text-[#D99025]", dot: "bg-[#D99025]" },
    transferred: { label: "Transferred", bg: "bg-[#EEF2FD]", text: "text-[#3157D5]", dot: "bg-[#3157D5]" },
    completed: { label: "Completed", bg: "bg-[#F4F7FB]", text: "text-[#78849A]", dot: "bg-[#94A3B8]" },
    active: { label: "Active", bg: "bg-[#E8F7F0]", text: "text-[#16A36A]", dot: "bg-[#16A36A]" },
    paused: { label: "Paused", bg: "bg-[#FEF7EC]", text: "text-[#D99025]", dot: "bg-[#D99025]" },
    draft: { label: "Draft", bg: "bg-[#F4F7FB]", text: "text-[#78849A]", dot: "bg-[#94A3B8]" },
    indexed: { label: "Indexed", bg: "bg-[#E8F7F0]", text: "text-[#16A36A]", dot: "bg-[#16A36A]" },
    processing: { label: "Processing", bg: "bg-[#EEF2FD]", text: "text-[#3157D5]", dot: "bg-[#3157D5]", isLive: true },
    error: { label: "Error", bg: "bg-[#FDF2F3]", text: "text-[#D95C68]", dot: "bg-[#D95C68]" },
    qualified: { label: "Qualified", bg: "bg-[#E8F7F0]", text: "text-[#16A36A]", dot: "bg-[#16A36A]" },
    unqualified: { label: "Unqualified", bg: "bg-[#FDF2F3]", text: "text-[#D95C68]", dot: "bg-[#D95C68]" },
    confirmed: { label: "Confirmed", bg: "bg-[#E8F7F0]", text: "text-[#16A36A]", dot: "bg-[#16A36A]" },
    pending: { label: "Pending", bg: "bg-[#FEF7EC]", text: "text-[#D99025]", dot: "bg-[#D99025]" },
    rescheduled: { label: "Rescheduled", bg: "bg-[#FEF7EC]", text: "text-[#D99025]", dot: "bg-[#D99025]" },
    cancelled: { label: "Cancelled", bg: "bg-[#FDF2F3]", text: "text-[#D95C68]", dot: "bg-[#D95C68]" },
    connected: { label: "Connected", bg: "bg-[#E8F7F0]", text: "text-[#16A36A]", dot: "bg-[#16A36A]" },
    warning: { label: "Degraded", bg: "bg-[#FEF7EC]", text: "text-[#D99025]", dot: "bg-[#D99025]" },
    offline: { label: "Offline", bg: "bg-[#FDF2F3]", text: "text-[#D95C68]", dot: "bg-[#D95C68]" },
  };

  const current = configMap[status] || {
    label: String(status).replace("_", " "),
    bg: "bg-[#F4F7FB]",
    text: "text-[#78849A]",
    dot: "bg-[#94A3B8]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border border-black/5 capitalize",
        current.bg,
        current.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          current.dot,
          current.isLive && "animate-pulse"
        )}
      />
      <span>{current.label}</span>
    </span>
  );
}
