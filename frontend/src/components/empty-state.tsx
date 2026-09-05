"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
      <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#172033] mb-1">{title}</h3>
      <p className="text-xs md:text-sm text-[#78849A] max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
