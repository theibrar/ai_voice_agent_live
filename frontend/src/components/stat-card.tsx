"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle2,
  Award,
  Calendar,
  Clock,
  Megaphone,
  Coins,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive?: boolean;
  period?: string;
  iconName: string;
  sparkline?: number[];
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle2,
  Award,
  Calendar,
  Clock,
  Megaphone,
  Coins,
};

export function StatCard({
  title,
  value,
  change,
  isPositive = true,
  period,
  iconName,
  sparkline,
  className,
}: StatCardProps) {
  const Icon = iconMap[iconName] || PhoneCall;

  return (
    <div
      className={cn(
        "p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow card-hover flex flex-col justify-between relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-[#F4F7FB] text-[#3157D5] flex items-center justify-center shrink-0 border border-[#E5EAF2]">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold text-[#172033] tracking-tight">{value}</div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md bg-[#EEF2FD] text-[#3157D5]">
            <TrendingUp className="w-3 h-3 text-[#3157D5]" />
            {change}
          </span>
          {period && <span className="text-[11px] text-[#78849A] truncate">{period}</span>}
        </div>
      </div>

      {/* Mini SVG Sparkline */}
      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 pt-2 border-t border-[#EDF2F7] flex items-end gap-1 h-6">
          {sparkline.map((val, i) => {
            const max = Math.max(...sparkline);
            const min = Math.min(...sparkline);
            const range = max - min || 1;
            const heightPercent = Math.max(15, Math.round(((val - min) / range) * 100));
            return (
              <div
                key={i}
                className="flex-1 bg-[#EEF2FD] hover:bg-[#3157D5] rounded-xs transition-colors group relative"
                style={{ height: `${heightPercent}%` }}
                title={`Value: ${val}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
