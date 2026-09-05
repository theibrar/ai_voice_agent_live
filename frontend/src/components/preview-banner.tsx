"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Eye, LogOut, Building2 } from "lucide-react";

export function PreviewBanner() {
  const { isPreview, tenant, tenantId, exitPreview } = useAuth();

  if (!isPreview) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between z-50 sticky top-0 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Eye className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-black">
            👑 Super Admin Preview Mode
          </span>
          <span className="text-amber-100 flex items-center gap-1">
            <Building2 className="w-3 h-3 inline" />
            Inspecting Workspace: <strong className="text-white underline decoration-white/40">{tenant?.tenantName || "Apex Organization"}</strong>
          </span>
          <span className="text-amber-200 font-mono text-[10px]">
            (Tenant #{tenantId || tenant?.id || 1})
          </span>
        </div>
      </div>

      <button
        onClick={() => exitPreview()}
        className="px-3 py-1 bg-white text-orange-700 hover:bg-orange-50 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
        title="Exit Super Admin Preview Mode and return to Super Admin Console"
      >
        <LogOut className="w-3 h-3" />
        <span>Exit Preview</span>
      </button>
    </div>
  );
}
