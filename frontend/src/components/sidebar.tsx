"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { translate } from "@/lib/languages";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  PhoneCall,
  Bot,
  Workflow,
  Megaphone,
  BookOpen,
  Users,
  Calendar,
  Phone,
  Radio,
  History,
  TrendingUp,
  FileText,
  Coins,
  Settings,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Zap,
  LogOut,
  X,
  Scale,
  Layers,
  Voicemail,
  Wrench,
  FileSpreadsheet,
  Mic,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "live" | "info" | "neutral";
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    activeCallCount,
    activeWorkspace,
    language,
  } = useAppStore();

  const userInitials = (user?.name || "Admin")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "AD";

  const navSections: NavSection[] = [
    {
      items: [
        { label: translate("overview", language), href: "/dashboard", icon: BarChart3 },
      ],
    },
    {
      title: translate("voice_operations", language),
      items: [
        {
          label: translate("live_calls", language),
          href: "/live-calls",
          icon: PhoneCall,
          badge: activeCallCount > 0 ? `${activeCallCount} Live` : undefined,
          badgeVariant: "live",
        },
        {
          label: translate("live_supervisor", language),
          href: "/supervisor",
          icon: Headphones,
          badge: "Cockpit",
          badgeVariant: "info",
        },
        { label: translate("voice_agents", language), href: "/agents", icon: Bot },
        { label: translate("flow_builder", language), href: "/flow-builder", icon: Workflow },
        { label: translate("campaigns", language), href: "/campaigns", icon: Megaphone },
      ],
    },
    {
      title: translate("data_context", language),
      items: [
        { label: translate("knowledge_base", language), href: "/knowledge-base", icon: BookOpen },
        { label: translate("contacts_leads", language), href: "/contacts", icon: Users },
        { label: translate("calendar_bookings", language), href: "/appointments", icon: Calendar, badge: "Sync" },
      ],
    },
    {
      title: translate("tools_integrations", language),
      items: [
        { label: translate("tools", language), href: "/tools", icon: Wrench, badge: "6 Tools" },
        { label: translate("google_sheets", language), href: "/google-sheets", icon: FileSpreadsheet, badge: "Live" },
        { label: translate("phone_numbers", language), href: "/phone-numbers", icon: Phone },
        { label: translate("smart_amd", language), href: "/smart-amd", icon: Voicemail, badge: "Tone Drop" },
      ],
    },
    {
      title: translate("intelligence_logs", language),
      items: [
        { label: translate("analytics", language), href: "/analytics", icon: TrendingUp, badge: "Live Intel" },
        { label: translate("ab_testing", language), href: "/ab-testing", icon: Scale, badge: "A/B" },
        { label: "Voice Recorder", href: "/voice-recorder", icon: Mic, badge: "Audio Vault" },
        { label: translate("call_history", language), href: "/call-history", icon: History },
      ],
    },
    {
      title: translate("workspace", language),
      items: [
        { label: translate("templates", language), href: "/templates", icon: FileText },
        { label: translate("credits_billing", language), href: "/credits", icon: Coins, badge: `$${Math.round(activeWorkspace.credits)}` },
        { label: translate("settings", language), href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white text-[#0F172A] border-r border-[#E2E8F0] shadow-xs transition-all duration-300 ease-in-out select-none",
          sidebarCollapsed ? "w-20" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header / Brand Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#E2E8F0] shrink-0 bg-white">
          <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#3157D5] flex items-center justify-center font-black text-white text-base tracking-wider shrink-0 shadow-md group-hover:scale-105 transition-transform">
              {((tenant?.tenantName || user?.company || activeWorkspace.name || "A")[0]).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black text-sm tracking-tight text-[#0F172A] truncate">
                    {tenant?.tenantName || user?.company || activeWorkspace.name || "Apex Voice"}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#64748B] tracking-wider uppercase truncate">
                  {tenant?.planName || activeWorkspace.plan || "AI Voice"} Platform
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && !sidebarCollapsed && (
                <p className="px-3 text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group relative",
                      isActive
                        ? "bg-[#3157D5] text-white font-bold shadow-md shadow-[#3157D5]/20"
                        : "text-[#0F172A] hover:bg-[#EEF2FD] hover:text-[#3157D5]"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-[#64748B] group-hover:text-[#3157D5]")} />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {/* Badges */}
                    {!sidebarCollapsed && item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-extrabold rounded-full tracking-wide shrink-0",
                          item.badgeVariant === "live"
                            ? isActive ? "bg-white text-[#3157D5] font-black animate-pulse" : "bg-emerald-100 text-emerald-700 animate-pulse"
                            : item.badgeVariant === "info"
                            ? isActive ? "bg-white/20 text-white" : "bg-[#EEF2FD] text-[#3157D5]"
                            : isActive ? "bg-white/20 text-white" : "bg-[#F1F5F9] text-[#64748B]"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer / Account & Usage Widget */}
        <div className="p-3 border-t border-[#E2E8F0] space-y-3 shrink-0 bg-white">
          {!sidebarCollapsed ? (
            <>
              {/* Credit Status Box */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                    <Zap className="w-3.5 h-3.5 text-[#3157D5]" />
                    <span>{translate("voice_credits", language)}</span>
                  </div>
                  <span className="font-mono font-bold text-[#0F172A]">${activeWorkspace.credits.toFixed(2)}</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#3157D5] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, (activeWorkspace.credits / 1000) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#64748B]">
                  <span>~{Math.round(activeWorkspace.credits / 0.08).toLocaleString()} mins left</span>
                  <Link href="/credits" className="text-[#3157D5] hover:underline font-bold">
                    {translate("add_funds", language)}
                  </Link>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#3157D5] flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0">
                    {userInitials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#0F172A] leading-tight truncate">{user?.name || "Admin"}</span>
                    <span className="text-[10px] text-[#64748B] truncate">{user?.role === "super_admin" ? "Super Admin" : "Admin"} • {tenant?.tenantName || user?.company || activeWorkspace.name}</span>
                  </div>
                </div>
                <button onClick={logout} className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-[#F1F5F9] cursor-pointer shrink-0" title={translate("sign_out", language)}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-1">
              <Link
                href="/credits"
                className="w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#3157D5] hover:bg-[#3157D5] hover:text-white transition-colors"
                title={`$${activeWorkspace.credits.toFixed(2)} Credits`}
              >
                <Zap className="w-4 h-4" />
              </Link>
              <div className="w-8 h-8 rounded-xl bg-[#3157D5] flex items-center justify-center font-bold text-xs text-white" title={user?.name || "Admin"}>
                {userInitials}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
