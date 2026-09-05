"use client";

import React, { useState } from "react";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import {
  Megaphone,
  Plus,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  Search,
  Trash2,
  Building2,
  Users,
} from "lucide-react";

export default function SuperAdminAnnouncementsPage() {
  const { announcements, tenants, addAnnouncement, toggleAnnouncement, deleteAnnouncement, addToast } = useSuperAdminStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("warning");
  const [targetTenants, setTargetTenants] = useState<string>("all");

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    let targetTenantName = "All Tenant Orgs";
    if (targetTenants === "enterprise_only") {
      targetTenantName = "Enterprise Tier Only";
    } else if (targetTenants === "growth_only") {
      targetTenantName = "Growth Tier Only";
    } else if (targetTenants === "starter_only") {
      targetTenantName = "Starter Tier Only";
    } else if (targetTenants.startsWith("tenant-")) {
      const tId = targetTenants.replace("tenant-", "");
      const found = tenants.find((t) => t.id === targetTenants || t.id === tId);
      targetTenantName = found ? found.orgName : "Specific Tenant";
    }

    addAnnouncement({
      title: title.trim(),
      message: message.trim(),
      severity,
      targetTenants,
      targetTenantName,
    });

    setTitle("");
    setMessage("");
    setTargetTenants("all");
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">System Announcements & Notices</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
                {announcements.filter((a) => a.active).length} Active Banners
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Broadcast maintenance schedules, new AI engine releases, and emergency notices to all or specific tenant admins in real time.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Broadcast Announcement</span>
        </button>
      </div>

      {/* 2. Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-[#E2E8F0] text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0F172A]">No Announcements Broadcasted</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                No active announcements found. Click &quot;Broadcast Announcement&quot; to send maintenance notices or alerts to tenant admins.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast Announcement</span>
            </button>
          </div>
        ) : (
          announcements.map((anc) => {
            const isInfo = anc.severity === "info";
            const isWarning = anc.severity === "warning";

            return (
              <div
                key={anc.id}
                className={`p-6 bg-white rounded-3xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  anc.active ? "border-[#3157D5]/40" : "border-[#E2E8F0] opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 mt-0.5 ${
                    isInfo ? "bg-[#3157D5]" : isWarning ? "bg-amber-500" : "bg-rose-600"
                  }`}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-[#0F172A]">{anc.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isInfo ? "bg-[#EEF2FD] text-[#3157D5]" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {anc.severity}
                      </span>
                      <span className="text-[10px] font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
                        Target: {anc.targetTenantName || anc.targetTenants.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{anc.message}</p>
                    <p className="text-[10px] text-[#94A3B8] font-mono pt-1">Published: {anc.publishedAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAnnouncement(anc.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      anc.active
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                        : "bg-[#EEF2FD] hover:bg-[#3157D5] text-[#3157D5] hover:text-white"
                    }`}
                  >
                    {anc.active ? "Deactivate Banner" : "Re-Activate Banner"}
                  </button>

                  <button
                    onClick={() => deleteAnnouncement(anc.id)}
                    className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Create Announcement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Broadcast System Notice</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-[#64748B] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Maintenance Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e: any) => setSeverity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <option value="info">Info / Release</option>
                    <option value="warning">Warning / Maintenance</option>
                    <option value="critical">Critical / Incident</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Target Audience</label>
                  <select
                    value={targetTenants}
                    onChange={(e) => setTargetTenants(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <optgroup label="Global Broadcast & Tiers">
                      <option value="all">All Tenant Orgs</option>
                      <option value="enterprise_only">Enterprise Tier Only</option>
                      <option value="growth_only">Growth Tier Only</option>
                      <option value="starter_only">Starter Tier Only</option>
                    </optgroup>
                    {tenants.length > 0 && (
                      <optgroup label="Specific Tenant Admins">
                        {tenants.map((t) => (
                          <option key={t.id} value={`tenant-${t.id}`}>
                            {t.orgName} ({t.primaryAdminName || t.primaryAdminEmail || 'Admin'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Notice Message</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Full announcement text to display on tenant dashboards in real time..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
