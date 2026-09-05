"use client";

import React from "react";
import { SuperAdminSidebar } from "./super-admin-sidebar";
import { SuperAdminTopbar } from "./super-admin-topbar";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

interface SuperAdminShellProps {
  children: React.ReactNode;
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const { superAdminSidebarCollapsed, toasts, removeToast } = useSuperAdminStore();

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A11] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col selection:bg-[#3157D5]/20 selection:text-[#0F172A]">
      {/* Super Admin Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
          superAdminSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        {/* Super Admin Topbar */}
        <SuperAdminTopbar />

        {/* Dynamic Super Admin Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Super Admin Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isWarning = toast.type === "warning";
          const isDanger = toast.type === "danger";

          return (
            <div
              key={toast.id}
              className="pointer-events-auto p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-150"
            >
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-[#3157D5] shrink-0 mt-0.5" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              ) : isDanger ? (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-[#3157D5] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0F172A]">{toast.title}</p>
                {toast.description && (
                  <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
