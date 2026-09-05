"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { translate, getStoredLanguage } from "@/lib/languages";
import {
  ShieldAlert,
  BarChart3,
  Users,
  Building2,
  CreditCard,
  Mail,
  PhoneCall,
  Cpu,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Radio,
  ExternalLink,
  TrendingUp,
  Lock,
  Megaphone,
  Zap,
  Activity,
  DollarSign,
  Layers,
  PieChart,
  Server,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "live" | "info" | "neutral" | "warning";
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

function SuperAdminSidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const {
    superAdminSidebarCollapsed,
    setSuperAdminSidebarCollapsed,
    currentSuperAdmin,
    superAdmins,
    tenants,
    globalCalls,
    sipCarriers,
    engines,
  } = useSuperAdminStore();

  const { setActiveWorkspace } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLiveCalls = globalCalls.filter((c) => c.status === "in_progress").length;
  const totalSipChannels = sipCarriers.reduce((acc, c) => acc + (c.allocatedChannels || 0), 0);

  const navSections: NavSection[] = [
    {
      items: [
        { label: "Mission Control", href: "/super-admin", icon: BarChart3 },
      ],
    },
    {
      title: "Platform Control",
      items: [
        {
          label: "Team & Super Admins",
          href: "/super-admin/team",
          icon: Users,
          badge: `${superAdmins.length} Admin${superAdmins.length === 1 ? '' : 's'}`,
          badgeVariant: "info",
        },
        {
          label: "Tenant Organizations",
          href: "/super-admin/admins",
          icon: Building2,
          badge: `${tenants.length} Orgs`,
          badgeVariant: "live",
        },
        {
          label: "Global Calls Inspector",
          href: "/super-admin/calls",
          icon: PhoneCall,
          badge: `${activeLiveCalls} Live`,
          badgeVariant: "live",
        },
      ],
    },
    {
      title: "Analytics & Intelligence",
      items: [
        {
          label: "Master Analytics Suite",
          href: "/super-admin/analytics",
          icon: TrendingUp,
          badge: `${tenants.length > 0 ? '99.9%' : '0.0%'}`,
          badgeVariant: "live",
        },
        {
          label: "P&L Financial Ledger",
          href: "/super-admin/analytics?tab=financial",
          icon: DollarSign,
          badge: "Ledger",
          badgeVariant: "neutral",
        },
        {
          label: "Voice & SIP Telemetry",
          href: "/super-admin/analytics?tab=telephony",
          icon: Activity,
          badge: `${totalSipChannels} Lines`,
          badgeVariant: "info",
        },
        {
          label: "AI Model & Token Burn",
          href: "/super-admin/analytics?tab=models",
          icon: Cpu,
          badge: `${engines.length} Models`,
          badgeVariant: "info",
        },
        {
          label: "Tenant Unit Economics",
          href: "/super-admin/analytics?tab=tenants",
          icon: Layers,
          badge: "Cohort",
          badgeVariant: "neutral",
        },
      ],
    },
    {
      title: "Monetization & Plans",
      items: [
        {
          label: "Plans & Credit Manager",
          href: "/super-admin/plans",
          icon: CreditCard,
          badge: "Rates",
          badgeVariant: "info",
        },
      ],
    },
    {
      title: "Infrastructure & Gateways",
      items: [
        {
          label: "External Server & APIs",
          href: "/super-admin/external-server",
          icon: Server,
          badge: "9 APIs",
          badgeVariant: "live",
        },
        {
          label: "Email & SMS Gateways",
          href: "/super-admin/gateways",
          icon: Mail,
          badge: "SES / Twilio",
          badgeVariant: "neutral",
        },
        {
          label: "SIP & Carrier Networks",
          href: "/super-admin/telephony",
          icon: Radio,
          badge: "Telnyx / SBC",
          badgeVariant: "live",
        },
      ],
    },
    {
      title: "Voice AI Engines & Models",
      items: [
        {
          label: "LLM, TTS & STT Hub",
          href: "/super-admin/engines",
          icon: Cpu,
          badge: `${engines.length} Models`,
          badgeVariant: "info",
        },
      ],
    },
    {
      title: "Governance & Broadcasts",
      items: [
        {
          label: "Security & Compliance",
          href: "/super-admin/security",
          icon: Lock,
        },
        {
          label: "System Announcements",
          href: "/super-admin/announcements",
          icon: Megaphone,
          badge: "Broadcast",
        },
        {
          label: "Audit Logs & Security",
          href: "/super-admin/audit-logs",
          icon: ShieldCheck,
        },
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

      {/* Super Admin Sidebar Container (Pure White #FFFFFF) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white text-[#0F172A] border-r border-[#E2E8F0] shadow-sm transition-all duration-300 ease-in-out select-none",
          superAdminSidebarCollapsed ? "w-20" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Logo Header */}
        <div className={cn(
          "flex items-center h-16 border-b border-[#E2E8F0] shrink-0 bg-white transition-all",
          superAdminSidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {superAdminSidebarCollapsed ? (
            <button
              onClick={() => setSuperAdminSidebarCollapsed(false)}
              className="w-10 h-10 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-md shadow-[#3157D5]/30 group relative shrink-0 transition-transform active:scale-95"
              title="Click to Expand Super Admin Console"
            >
              <ShieldAlert className="w-5 h-5" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-[#E2E8F0] text-[#3157D5] flex items-center justify-center shadow-xs">
                <ChevronRight className="w-2.5 h-2.5" />
              </div>
            </button>
          ) : (
            <>
              <Link href="/super-admin" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#3157D5]/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-[#0F172A]">APEX</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#3157D5] text-white rounded-md tracking-wider">
                      SUPER ADMIN
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-semibold tracking-wide">
                    MASTER CONSOLE
                  </span>
                </div>
              </Link>

              {/* Desktop Collapse Button */}
              <button
                onClick={() => setSuperAdminSidebarCollapsed(true)}
                className="hidden md:flex items-center justify-center w-7 h-7 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 sidebar-white-scrollbar bg-white">
          {navSections.map((section, idx) => {
            const lang = typeof window !== "undefined" ? getStoredLanguage() : "en";
            return (
            <div key={idx} className="space-y-1">
              {section.title && !superAdminSidebarCollapsed && (
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
                  {translate(section.title, lang)}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                
                // Match logic for query params vs plain paths
                const isUrlMatch = item.href.includes("?tab=")
                  ? pathname === "/super-admin/analytics" && currentTab === item.href.split("tab=")[1]
                  : item.href === "/super-admin/analytics"
                  ? pathname === "/super-admin/analytics" && !currentTab
                  : pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 py-2.5 rounded-2xl text-xs font-bold transition-all group relative",
                      superAdminSidebarCollapsed ? "justify-center px-0" : "px-3.5",
                      isUrlMatch
                        ? "bg-[#3157D5] text-white shadow-md shadow-[#3157D5]/30 font-extrabold"
                        : "text-[#0F172A] hover:bg-[#3157D5] hover:text-white hover:shadow-md hover:shadow-[#3157D5]/20"
                    )}
                    title={superAdminSidebarCollapsed ? translate(item.label, lang) : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isUrlMatch ? "text-white" : "text-[#64748B] group-hover:text-white"
                      )}
                    />

                    {!superAdminSidebarCollapsed && (
                      <span className="flex-1 truncate group-hover:text-white">{translate(item.label, lang)}</span>
                    )}

                    {!superAdminSidebarCollapsed && item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors",
                          isUrlMatch
                            ? "bg-white/20 text-white"
                            : item.badgeVariant === "live"
                            ? "bg-[#EEF2FD] text-[#3157D5] group-hover:bg-white/20 group-hover:text-white border border-[#3157D5]/30 group-hover:border-white/30"
                            : "bg-[#F1F5F9] text-[#64748B] group-hover:bg-white/20 group-hover:text-white"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
        </div>

        {/* Footer: Super Admin Profile */}
        <div className="p-3 border-t border-[#E2E8F0] space-y-3 shrink-0 bg-white">
          {!superAdminSidebarCollapsed ? (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#3157D5] text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-[#3157D5]/20">
                  {currentSuperAdmin.avatar}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0F172A] leading-tight truncate max-w-[110px]">
                    {currentSuperAdmin.name}
                  </span>
                  <span className="text-[10px] text-[#3157D5] font-semibold">
                    {currentSuperAdmin.role}
                  </span>
                </div>
              </div>
              <Link
                href="/super-admin/login"
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-[#F1F5F9]"
                title="Sign out of Super Admin"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-1">
              <div className="w-9 h-9 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-[#3157D5]/20">
                {currentSuperAdmin.avatar}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function SuperAdminSidebar() {
  return (
    <Suspense fallback={<div className="w-64 bg-white border-r border-[#E2E8F0]" />}>
      <SuperAdminSidebarContent />
    </Suspense>
  );
}
