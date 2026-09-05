"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { ToastContainer } from "./toast-provider";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Megaphone, X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed, notifications } = useAppStore();
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);

  // Find active broadcast system notices that haven't been dismissed
  const activeBanners = notifications.filter(
    (n) => n.type === "system" && n.id.startsWith("anc-") && !dismissedBanners.includes(n.id) && n.activeBanner !== false
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A11] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col selection:bg-[#3157D5]/20 selection:text-[#0F172A]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
          sidebarCollapsed ? "md:pl-18" : "md:pl-64"
        )}
      >
        {/* Topbar */}
        <Topbar />

        {/* Global Broadcast Announcement Banners */}
        {activeBanners.map((banner) => (
          <div
            key={banner.id}
            className="bg-linear-to-r from-[#3157D5] via-[#4361EE] to-[#2646B8] text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md border-b border-white/10 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1 pr-4">
              <span className="p-1 rounded-lg bg-white/20 shrink-0">
                <Megaphone className="w-3.5 h-3.5" />
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="font-bold">{banner.title}:</strong>
                <span className="text-white/90">{banner.message}</span>
              </div>
            </div>
            <button
              onClick={() => setDismissedBanners((prev) => [...prev, banner.id])}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}
