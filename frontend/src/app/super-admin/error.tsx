"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw, Home, LogIn } from "lucide-react";

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for remote debugging
    console.error("Super Admin Runtime Exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0F172A] border border-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Super Admin Console Diagnostics
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The super admin console encountered a client runtime condition. You can reload the console state or return to the login screen.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-black/40 border border-slate-800 rounded-2xl text-left font-mono text-[11px] text-rose-300 max-h-32 overflow-y-auto break-all">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#3157D5]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Console</span>
          </button>

          <Link
            href="/super-admin/login"
            className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Go to Login</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
