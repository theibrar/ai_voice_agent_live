"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import { useAppStore } from "@/lib/store";
import { getApiBase } from "@/lib/auth-context";
import {
  Building2,
  Users,
  CreditCard,
  PhoneCall,
  ArrowRight,
  TrendingUp,
  Crown,
  Coins,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SuperAdminMissionControl() {
  const {
    tenants,
    refreshTenants,
    superAdmins,
    sipCarriers,
    auditLogs,
  } = useSuperAdminStore();

  const [dbAnalytics, setDbAnalytics] = useState<any>({ call_analytics: [], lead_analytics: [] });
  const [platformRevenueTrend, setPlatformRevenueTrend] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    refreshTenants();
    async function loadAnalytics() {
      try {
        const apiUrl = getApiBase() + '/analytics/daily';
        const res = await fetch(apiUrl, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDbAnalytics(data);
          if (data && data.call_analytics && data.call_analytics.length > 0) {
            const trend = data.call_analytics.map((item: any) => ({
              month: item.date,
              revenue: item.completed_calls * 10,
              minutes: item.avg_duration_seconds * item.total_calls,
            }));
            setPlatformRevenueTrend(trend);
          }
        }
      } catch (err) {
        console.warn("Database API connection standby:", err);
      }
    }
    loadAnalytics();
  }, []);

  const totalMonthlySpend = tenants.reduce((acc, t) => acc + (t.monthlySpend || 0), 0);
  const totalActiveCalls = tenants.reduce((acc, t) => acc + (t.activeCallsNow || 0), 0);
  const totalMinutesThisMonth = tenants.reduce((acc, t) => acc + (t.totalMinutesUsedThisMonth || 0), 0);
  const totalCreditsAllocated = tenants.reduce((acc, t) => acc + (t.creditsBalance || 0), 0);

  return (
    <div className="space-y-8">
      {/* 1. Master Super Admin Fleet Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#3157D5] text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 max-w-2xl z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full border border-white/30 flex items-center gap-1.5 shadow-2xs">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              1 MASTER SUPER ADMIN CONTROL CONSOLE
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              ● Central Multi-Tenant Authority
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Super Admin Mission Control & Fleet Orchestration
          </h1>
          <p className="text-xs md:text-sm text-white/80 leading-relaxed">
            Single Master Super Admin authority over <strong>{tenants.length} Tenant Organizations</strong>, each with its dedicated Lead Admin, SIP channels, credit allocation, and full workspace autonomy.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Link
              href="/super-admin/admins"
              className="px-4 py-2.5 bg-white text-[#0F172A] hover:bg-white/95 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-[#3157D5]" />
              <span>Manage Tenant Orgs ({tenants.length})</span>
            </Link>
            <Link
              href="/super-admin/team"
              className="px-4 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Admin Team ({superAdmins.length})</span>
            </Link>
            <Link
              href="/super-admin/plans"
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/30"
            >
              <CreditCard className="w-4 h-4 text-emerald-300" />
              <span>Platform Plans & Rates</span>
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 border border-white/20 shrink-0 z-10 text-center space-y-1 backdrop-blur-xs">
          <div className="w-14 h-14 rounded-2xl bg-white text-[#0F172A] flex items-center justify-center font-black text-lg shadow-lg">
            AV
          </div>
          <span className="text-xs font-bold text-white">Alexander Vance</span>
          <span className="text-[10px] text-amber-300 font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/20">
            👑 Root Super Admin
          </span>
        </div>
      </div>

      {/* 2. Global Platform KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
              Total Monthly Spend (MRR)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] tracking-tight">
            ${totalMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-[#3157D5] font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Active platform revenue ledger
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
              Tenant Organizations
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] tracking-tight">
            {tenants.length} Tenant Workspaces
          </div>
          <span className="text-xs text-[#16A36A] font-bold">
            1 Designated Lead Admin per Org
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
              Total Credits Pool
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] tracking-tight">
            ${totalCreditsAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-[#64748B] font-semibold">
            Allocated across client balances
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
              Live SIP Lines Allocated
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] tracking-tight">
            {tenants.reduce((acc, t) => acc + t.maxConcurrency, 0)} Channels
          </div>
          <span className="text-xs text-[#3157D5] font-bold">
            Elastic Carrier Trunking Active
          </span>
        </div>
      </div>

      {/* 3. Platform Revenue Velocity & Infrastructure Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EDF2F7]">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Platform Revenue Velocity</h2>
              <p className="text-xs text-[#64748B]">Aggregated multi-tenant call billing & consumption trends</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3157D5]" />
                Actual Revenue ($)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformRevenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="superRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3157D5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3157D5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "none",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Platform Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3157D5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#superRevenueGrad)"
                  name="Platform Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Carrier Backbone Distribution (1 col) */}
        <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF2F7]">
              <h2 className="text-base font-bold text-[#0F172A]">SIP Carrier Interconnects</h2>
              <Link href="/super-admin/telephony" className="text-xs font-bold text-[#3157D5] hover:underline">
                Manage &gt;
              </Link>
            </div>

            <div className="space-y-3 mt-3">
              {sipCarriers.map((carrier) => (
                <div
                  key={carrier.id}
                  className="p-3 bg-white hover:bg-[#EEF2FD] rounded-2xl border border-[#E2E8F0] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                    <span>{carrier.name}</span>
                    <span className="font-mono text-[#3157D5]">{carrier.allocatedChannels} / {carrier.maxChannels} ch</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-[#3157D5] h-full rounded-full"
                      style={{ width: `${(carrier.allocatedChannels / carrier.maxChannels) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#64748B] mt-1.5">
                    <span>Rate: ${carrier.ratePerMinuteWholesale}/min wholesale</span>
                    <span className="font-semibold text-emerald-600">● {carrier.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDF2F7] flex items-center justify-between text-xs text-[#64748B]">
            <span>Global POPs Active</span>
            <span className="font-bold text-[#0F172A]">US-East, US-West, EU, AP</span>
          </div>
        </div>
      </div>

      {/* 4. Tenant Organizations Leaderboard & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Orgs (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDF2F7]">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Tenant Organizations Overview</h2>
              <p className="text-xs text-[#64748B]">Ranked by total monthly consumption, credits, and active SIP lines</p>
            </div>
            <Link
              href="/super-admin/admins"
              className="text-xs font-bold text-[#3157D5] hover:underline flex items-center gap-1"
            >
              <span>View All Tenants ({tenants.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3">Organization</th>
                  <th className="p-3">Plan Tier</th>
                  <th className="p-3">Credits Balance</th>
                  <th className="p-3">Minutes (Mo)</th>
                  <th className="p-3">Monthly Spend</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-[#EEF2FD]/40 transition-colors">
                    <td className="p-3 font-bold text-[#0F172A]">
                      <div>
                        <p>{t.orgName}</p>
                        <p className="text-[10px] text-[#64748B] font-normal">{t.primaryAdminEmail}</p>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-[#3157D5]">{t.planName}</td>
                    <td className="p-3 font-mono font-bold text-[#0F172A]">${t.creditsBalance.toFixed(2)}</td>
                    <td className="p-3 font-mono text-[#64748B]">{t.totalMinutesUsedThisMonth.toLocaleString()}</td>
                    <td className="p-3 font-bold text-[#0F172A] font-mono">${t.monthlySpend.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === "active"
                          ? "bg-[#EEF2FD] text-[#3157D5]"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Super Admin Activity Stream (1 col) */}
        <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDF2F7]">
            <h2 className="text-base font-bold text-[#0F172A]">Super Admin Audit Log</h2>
            <Link href="/super-admin/audit-logs" className="text-xs font-bold text-[#3157D5] hover:underline">
              Full Logs &gt;
            </Link>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 bg-white rounded-2xl border border-[#E2E8F0] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">{log.actorName}</span>
                  <span className="text-[10px] text-[#64748B] font-mono">{log.timestamp.substring(11, 16)}</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-snug">{log.action}</p>
                <span className="text-[10px] font-semibold text-[#3157D5]">{log.actorRole}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
