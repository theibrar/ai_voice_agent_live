"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 bg-white border border-[#E5EAF2] rounded-xl shadow-lg shadow-[#101A33]/10 animate-in slide-in-from-right-5 fade-in duration-200"
        >
          {toast.type === "success" && (
            <div className="p-1 rounded-lg bg-[#E8F7F0] text-[#16A36A] shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          {toast.type === "warning" && (
            <div className="p-1 rounded-lg bg-[#FEF7EC] text-[#D99025] shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
          {toast.type === "error" && (
            <div className="p-1 rounded-lg bg-[#FDF2F3] text-[#D95C68] shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          {toast.type === "info" && (
            <div className="p-1 rounded-lg bg-[#EEF2FD] text-[#3157D5] shrink-0">
              <Info className="w-4 h-4" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-[#172033]">{toast.title}</h4>
            {toast.description && <p className="text-xs text-[#78849A] mt-0.5 leading-relaxed">{toast.description}</p>}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#78849A] hover:text-[#172033] p-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
