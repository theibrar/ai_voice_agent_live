"use client";

import React, { useState } from "react";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import {
  Lock,
  ShieldCheck,
  Key,
  Globe,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Zap,
} from "lucide-react";

export default function SuperAdminSecurityPage() {
  const { tenants, addToast } = useSuperAdminStore();

  const [zeroLogActive, setZeroLogActive] = useState(true);
  const [rateLimitRps, setRateLimitRps] = useState(100);

  const handleToggleZeroLog = () => {
    setZeroLogActive(!zeroLogActive);
    addToast({
      title: "Data Retention Rule Updated",
      description: `Zero-log audio recording retention is now ${!zeroLogActive ? "ENABLED" : "DISABLED"}.`,
      type: "info",
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Security & Compliance Inspector</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
                ● SOC2 & HIPAA Enforced
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Platform-wide API rate limiting, zero-log data retention policies, IP whitelisting, and compliance audit certificates.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Security Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#3157D5]" />
              <h3 className="font-bold text-[#0F172A]">Zero-Log Data Retention</h3>
            </div>
            <input
              type="checkbox"
              checked={zeroLogActive}
              onChange={handleToggleZeroLog}
              className="w-4 h-4 rounded text-[#3157D5] cursor-pointer"
            />
          </div>
          <p className="text-xs text-[#64748B]">
            In-memory stream processing. Call audio buffer is scrubbed immediately after conversation termination.
          </p>
          <span className="text-[10px] font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full inline-block">
            {zeroLogActive ? "Active • Maximum Privacy" : "Standard Logging"}
          </span>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#3157D5]" />
              <h3 className="font-bold text-[#0F172A]">Global API Rate Limiting</h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#0F172A]">{rateLimitRps} RPS</span>
          </div>
          <p className="text-xs text-[#64748B]">
            Per-tenant API key rate limit ceiling to prevent DDoS payload flooding and unauthorized scraping.
          </p>
          <input
            type="range"
            min={50}
            max={500}
            value={rateLimitRps}
            onChange={(e) => setRateLimitRps(Number(e.target.value))}
            className="w-full text-[#3157D5]"
          />
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#3157D5]" />
              <h3 className="font-bold text-[#0F172A]">TLS 1.3 & Mutual Auth</h3>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-[#64748B]">
            Enforced TLS 1.3 transport security across all SIP carriers and webhook delivery endpoints.
          </p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
            100% Encrypted Media (SRTP)
          </span>
        </div>
      </div>

      {/* 3. Tenant API Keys & Security Entitlements Table */}
      <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#0F172A]">Tenant API Keys & Security Policies</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3">Tenant Organization</th>
                <th className="p-3">Active API Keys</th>
                <th className="p-3">HIPAA BAA Status</th>
                <th className="p-3">SIP Encryption</th>
                <th className="p-3">IP Whitelist Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-[#EEF2FD]/40 transition-colors">
                  <td className="p-3 font-bold text-[#0F172A]">{t.orgName}</td>
                  <td className="p-3 font-mono text-[#3157D5] font-semibold">2 Active Keys</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FD] text-[#3157D5]">
                      {t.planName.includes("Enterprise") || t.planName.includes("Scale") ? "Signed BAA" : "Standard SLA"}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-emerald-600 font-bold">SRTP / TLS 1.3</td>
                  <td className="p-3 font-semibold text-[#0F172A]">Enforced (2 Static IPs)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
