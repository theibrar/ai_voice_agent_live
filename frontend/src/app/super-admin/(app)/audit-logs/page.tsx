"use client";

import React, { useState } from "react";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import {
  ShieldCheck,
  Search,
  Download,
  AlertTriangle,
  Info,
  XCircle,
  Activity,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function SuperAdminAuditLogsPage() {
  const { auditLogs, addToast } = useSuperAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,Actor Name,Actor Role,Action,Target,IP Address,Severity\n" +
      auditLogs
        .map(
          (l) =>
            `"${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.target}","${l.ipAddress}","${l.severity}"`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "super_admin_audit_ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: "Audit Ledger Exported",
      description: "Downloaded super_admin_audit_ledger.csv for compliance audit.",
      type: "success",
    });
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Audit Logs & Governance</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
                {auditLogs.length} Events Logged
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Immutable platform audit ledger tracking every super admin configuration change, tenant quota update, and carrier assignment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Global Core Infrastructure Uptime Health */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A]">SIP Carrier Gateways</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[10px] text-[#64748B]">Telnyx, Twilio, Bandwidth (100% OK)</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A]">AI Speech Synthesis</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[10px] text-[#64748B]">Cartesia & ElevenLabs (85ms latency)</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A]">STT Streaming Engine</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[10px] text-[#64748B]">Deepgram Nova-3 Websockets (0.01% WER)</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A]">SMTP & SMS Relays</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[10px] text-[#64748B]">Amazon SES & Twilio 10DLC (99.8% OK)</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, operators, targets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#3157D5]"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-xs w-fit">
          {["all", "info", "warning", "critical"].map((st) => (
            <button
              key={st}
              onClick={() => setSeverityFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors capitalize ${
                severityFilter === st
                  ? "bg-[#3157D5] text-white shadow-2xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Audit Table */}
      <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Super Admin Actor</th>
                <th className="p-3">Action Description</th>
                <th className="p-3">Target Entity</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredLogs.map((log) => {
                const isInfo = log.severity === "info";
                const isWarning = log.severity === "warning";
                const isCritical = log.severity === "critical";

                return (
                  <tr key={log.id} className="hover:bg-[#EEF2FD]/40 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div>
                        <p className="font-bold text-[#0F172A]">{log.actorName}</p>
                        <p className="text-[10px] text-[#3157D5] font-semibold">{log.actorRole}</p>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-[#0F172A]">{log.action}</td>
                    <td className="p-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">{log.target}</td>
                    <td className="p-3 font-mono text-[#64748B] whitespace-nowrap">{log.ipAddress}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isInfo
                            ? "bg-[#EEF2FD] text-[#3157D5]"
                            : isWarning
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
