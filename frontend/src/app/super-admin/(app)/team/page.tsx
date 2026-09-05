"use client";

import React, { useState } from "react";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Lock,
  Mail,
  X,
  Plus,
  Search,
  Crown,
  Shield,
  Key,
  Copy,
  Trash2,
} from "lucide-react";

export default function SuperAdminTeamPage() {
  const {
    superAdmins,
    addSuperAdmin,
    updateSuperAdminStatus,
    deleteSuperAdmin,
    currentSuperAdmin,
    addToast,
  } = useSuperAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteAdminModal, setDeleteAdminModal] = useState<any | null>(null);

  // Form state for creating new Admin
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Platform Admin" | "Billing Admin" | "Infrastructure Lead" | "Support Engineer" | "Security & Compliance Admin">("Platform Admin");
  const [twoFactorRequired, setTwoFactorRequired] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "billing_override",
    "plan_management",
    "credit_allocation",
  ]);

  const allAvailablePermissions = [
    { id: "billing_override", label: "Billing & Plans", desc: "Manage subscription plans, discounts & credit rates" },
    { id: "infrastructure_control", label: "Telephony & Carriers", desc: "Configure SIP trunks, SBC routing & codecs" },
    { id: "model_engines", label: "Voice AI Models", desc: "Enable/disable LLMs, TTS voices & STT engines" },
    { id: "tenant_impersonation", label: "Tenant Preview & Log in", desc: "Simulate tenant workspace access" },
    { id: "audit_logs", label: "Audit & Security Logs", desc: "View immutable platform security ledger" },
  ];

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addSuperAdmin({
      name: name.trim(),
      email: email.trim(),
      role: role as any,
      permissions: selectedPermissions,
      twoFactorEnabled: twoFactorRequired,
      status: "active",
    });

    addToast({
      title: "Admin Created",
      description: `Successfully provisioned ${name.trim()} as ${role}.`,
      type: "success",
    });

    setName("");
    setEmail("");
    setModalOpen(false);
  };

  const masterCount = superAdmins.filter((a) => a.role === "Master Super Admin").length;
  const delegatedCount = superAdmins.filter((a) => a.role !== "Master Super Admin").length;

  const filteredAdmins = superAdmins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Super Admin & Platform Team</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
                {masterCount} Master Super Admin • {delegatedCount} Delegated Admins
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage platform master authority, delegated administrators, 2FA security, and permission scopes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#3157D5]"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* 2. Admin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAdmins.map((admin) => {
          const isCurrentUser = admin.id === currentSuperAdmin.id;
          const isMaster = admin.role === "Master Super Admin";

          return (
            <div
              key={admin.id}
              className={`p-5 bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                isMaster ? "border-[#3157D5]/60 ring-2 ring-[#3157D5]/10" : "border-[#E2E8F0] hover:border-[#3157D5]/40"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                    isMaster ? "bg-[#3157D5] text-white" : "bg-[#0F172A] text-white"
                  }`}>
                    {admin.avatar}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      admin.status === "active" ? "bg-[#EEF2FD] text-[#3157D5]" : "bg-rose-50 text-rose-600 border border-rose-200"
                    }`}>
                      {admin.status}
                    </span>
                    {isMaster && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" /> Master Super Admin
                      </span>
                    )}
                    {isCurrentUser && !isMaster && (
                      <span className="text-[9px] font-bold text-[#3157D5] bg-[#EEF2FD] px-1.5 py-0.2 rounded">
                        You
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">{admin.name}</h3>
                  <p className={`text-xs font-bold ${isMaster ? "text-[#3157D5]" : "text-[#475569]"}`}>{admin.role}</p>
                  <p className="text-[11px] text-[#64748B] truncate mt-0.5">{admin.email}</p>
                </div>

                <div className="pt-2 border-t border-[#EDF2F7] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">2FA Status:</span>
                    <span className={`font-bold flex items-center gap-1 ${admin.twoFactorEnabled ? "text-emerald-600" : "text-amber-600"}`}>
                      {admin.twoFactorEnabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {admin.twoFactorEnabled ? "Enforced" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">Last Active:</span>
                    <span className="font-mono text-[#0F172A]">{admin.lastActive}</span>
                  </div>
                </div>

                {/* Permissions Chips */}
                <div className="pt-1 flex flex-wrap gap-1">
                  {admin.permissions.map((perm) => (
                    <span
                      key={perm}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${
                        isMaster ? "bg-[#EEF2FD] text-[#3157D5] font-bold" : "bg-[#F1F5F9] text-[#0F172A]"
                      }`}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#EDF2F7] flex items-center justify-between gap-2">
                {isMaster ? (
                  <div className="w-full py-2 bg-[#EEF2FD] border border-[#3157D5]/20 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-[#3157D5]">
                    <Lock className="w-3.5 h-3.5 text-[#3157D5]" />
                    <span>Root Master Super Admin (Permanent • Cannot Be Deleted)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() =>
                        updateSuperAdminStatus(
                          admin.id,
                          admin.status === "active" ? "suspended" : "active"
                        )
                      }
                      className="flex-1 py-2 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
                    >
                      {admin.status === "active" ? "Suspend" : "Activate"}
                    </button>
                    <button
                      onClick={() => setDeleteAdminModal(admin)}
                      className="p-2 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-500 rounded-xl transition-colors cursor-pointer"
                      title="Delete Delegated Admin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Add Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Add New Admin</h3>
                  <p className="text-[11px] text-[#64748B]">Provision platform administrative privileges & permission scopes</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Admin Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="jordan.hayes@apexvoice.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Administrative Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  <option value="Platform Admin">Platform Admin (General Management)</option>
                  <option value="Billing Admin">Billing Admin (Plans, Invoices & Credits)</option>
                  <option value="Infrastructure Lead">Infrastructure Lead (Telephony & SBC)</option>
                  <option value="Security & Compliance Admin">Security & Compliance Admin (Audit & 2FA)</option>
                  <option value="Support Engineer">Support Engineer (Tenant Support & Diagnostics)</option>
                </select>
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className="font-bold text-[#0F172A] block mb-1.5">Assigned Security Entitlements</label>
                <div className="space-y-2 border border-[#E2E8F0] p-3 rounded-2xl max-h-40 overflow-y-auto">
                  {allAvailablePermissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className="flex items-start gap-2.5 p-1.5 hover:bg-[#F8FAFC] rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions((prev) => [...prev, perm.id]);
                            } else {
                              setSelectedPermissions((prev) => prev.filter((p) => p !== perm.id));
                            }
                          }}
                          className="rounded border-[#CBD5E1] text-[#3157D5] mt-0.5"
                        />
                        <div>
                          <p className="font-bold text-[#0F172A] leading-none">{perm.label}</p>
                          <p className="text-[10px] text-[#64748B] mt-0.5">{perm.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                <div>
                  <span className="font-bold text-[#0F172A] block">Enforce 2-Factor Authentication</span>
                  <span className="text-[10px] text-[#64748B]">Require Hardware / TOTP key at login</span>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorRequired}
                  onChange={(e) => setTwoFactorRequired(e.target.checked)}
                  className="rounded text-[#3157D5] w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDF2F7]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-[#64748B] hover:text-[#0F172A] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white font-bold rounded-xl shadow-md shadow-[#3157D5]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Admin Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Confirm Delete Delegated Admin Modal */}
      {deleteAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Revoke & Delete Admin Account</h3>
                <p className="text-xs text-rose-600 font-semibold">Delegated Administrator Removal</p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Admin Name:</span>
                <span className="font-bold text-[#0F172A]">{deleteAdminModal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Admin Role:</span>
                <span className="font-bold text-[#3157D5]">{deleteAdminModal.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Email Address:</span>
                <span className="font-mono text-[#0F172A]">{deleteAdminModal.email}</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete <strong>{deleteAdminModal.name}</strong>? This administrator&apos;s credentials and administrative privileges will be permanently revoked from the platform.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDF2F7]">
              <button
                type="button"
                onClick={() => setDeleteAdminModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSuperAdmin(deleteAdminModal.id);
                  setDeleteAdminModal(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Revoke & Delete Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
