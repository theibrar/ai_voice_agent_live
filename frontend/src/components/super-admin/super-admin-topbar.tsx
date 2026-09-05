"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import {
  Search,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Activity,
  LogOut,
  Settings,
  Users,
  Bell,
  Check,
  ChevronDown,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";

import { LanguageSelector } from "@/components/language-selector";

export function SuperAdminTopbar() {
  const router = useRouter();
  const {
    language,
    setLanguage,
    superAdminTheme,
    toggleSuperAdminTheme,
    superAdminNotifications,
    unreadNotificationCount,
    markAllNotificationsAsRead,
    currentSuperAdmin,
    tenants,
    addToast,
  } = useSuperAdminStore();

  const [tenantSwitcherOpen, setTenantSwitcherOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/super-admin/admins?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#3157D5] text-white shadow-md">
      {/* Left side: Global Super Admin Search */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-64 md:w-80">
          <Search className="w-4 h-4 text-white/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenants, gateways, carriers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl text-xs text-white placeholder-white/70 outline-none focus:border-white/50 transition-all font-medium"
          />
        </form>
      </div>

      {/* Right side: Global System Health, Language Selector, Theme Switcher, Notifications & Super Admin Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Global Infrastructure Health Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/20 rounded-xl text-xs font-semibold text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Telephony & AI Engines: 99.98% Healthy</span>
        </div>

        {/* Tenant Quick Preview Switcher */}
        <div className="relative">
          <button
            onClick={() => setTenantSwitcherOpen((prev) => !prev)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white text-[#3157D5] rounded-xl text-xs font-bold shadow-xs hover:bg-white/95 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-[#3157D5]" />
            <span>Select Tenant Org</span>
            <ChevronDown className="w-3 h-3 text-[#3157D5]" />
          </button>

          {tenantSwitcherOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setTenantSwitcherOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white text-[#0F172A] rounded-2xl shadow-2xl border border-[#E2E8F0] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#E2E8F0] text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                  Tenant Organizations ({tenants.length})
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTenantSwitcherOpen(false);
                        addToast({
                          title: "Tenant Selected",
                          description: `Inspecting ${t.orgName} (${t.planName})`,
                          type: "info",
                        });
                        router.push(`/super-admin/admins?selected=${t.id}`);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#0F172A] hover:bg-[#EEF2FD] transition-colors text-left"
                    >
                      <div>
                        <p className="font-bold text-[#0F172A]">{t.orgName}</p>
                        <p className="text-[10px] text-[#64748B]">{t.planName} • {t.creditsBalance.toFixed(2)}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 20 Basic Languages Selector */}
        <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />

        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleSuperAdminTheme}
          className="p-2 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
          title={superAdminTheme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {superAdminTheme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Super Admin Notifications Dropdown Drawer */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative p-2 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition-colors"
            title="Super Admin Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-[#3157D5]" />
            )}
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white text-[#0F172A] rounded-3xl shadow-2xl border border-[#E2E8F0] p-4 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-[#0F172A]">Super Admin System Alerts</h3>
                    {unreadNotificationCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#EEF2FD] text-[#3157D5]">
                        {unreadNotificationCount} new
                      </span>
                    )}
                  </div>

                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] font-bold text-[#3157D5] hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
                  {superAdminNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        !n.read ? "bg-[#EEF2FD]/50 border-[#3157D5]/30 font-semibold" : "bg-white border-[#E2E8F0]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[#0F172A]">{n.title}</p>
                        <span className="text-[10px] text-[#64748B] font-mono shrink-0">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{n.message}</p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setNotificationsOpen(false)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3157D5] hover:underline mt-1.5"
                        >
                          <span>Open Console</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Super Admin User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/15 transition-colors focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-white text-[#3157D5] flex items-center justify-center font-black text-xs shadow-xs border-2 border-white/50">
              {currentSuperAdmin.avatar}
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white text-[#0F172A] rounded-2xl shadow-2xl border border-[#E2E8F0] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-[#E2E8F0]">
                  <p className="text-xs font-bold text-[#0F172A]">{currentSuperAdmin.name}</p>
                  <p className="text-[11px] text-[#64748B]">{currentSuperAdmin.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-[#EEF2FD] text-[#3157D5] rounded-md border border-[#3157D5]/20">
                    {currentSuperAdmin.role}
                  </span>
                </div>

                <div className="py-1 text-xs">
                  <Link
                    href="/super-admin/team"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#0F172A] hover:bg-[#EEF2FD]"
                  >
                    <Users className="w-3.5 h-3.5 text-[#3157D5]" />
                    <span>Super Admin Team</span>
                  </Link>
                  <Link
                    href="/super-admin/audit-logs"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#0F172A] hover:bg-[#EEF2FD]"
                  >
                    <Activity className="w-3.5 h-3.5 text-[#3157D5]" />
                    <span>Audit Logs</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#0F172A] hover:bg-[#EEF2FD]"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#3157D5]" />
                    <span>Tenant Admin View</span>
                  </Link>
                </div>

                <div className="border-t border-[#E2E8F0] pt-1">
                  <Link
                    href="/super-admin/login"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit Master Console</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
