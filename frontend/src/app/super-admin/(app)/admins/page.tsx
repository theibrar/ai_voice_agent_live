"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import {
  Building2,
  Users,
  Plus,
  Coins,
  Shield,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sliders,
  LogOut,
  Zap,
  Power,
  Edit3,
  Key,
  Mail,
  User,
  X,
  Trash2,
  AlertTriangle,
} from "lucide-react";

function SuperAdminTenantsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const selectedParam = searchParams.get("selected") || "";

  const {
    tenants,
    refreshTenants,
    plans,
    sipCarriers,
    addTenant,
    deleteTenant,
    adjustTenantCredits,
    updateTenantStatus,
    updateTenantQuotas,
    updateTenantAccount,
    addToast: addSuperToast,
  } = useSuperAdminStore();

  React.useEffect(() => {
    refreshTenants();
  }, [refreshTenants]);

  const { setActiveWorkspace, addToast: addAdminToast } = useAppStore();
  const { startPreview } = useAuth();

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalTenant, setDeleteModalTenant] = useState<any | null>(null);

  // Credit Modal State
  const [creditModalTenant, setCreditModalTenant] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState(500);
  const [creditReason, setCreditReason] = useState("Promotional platform grant");

  // Quota Modal State
  const [quotaModalTenant, setQuotaModalTenant] = useState<string | null>(null);
  const [editConcurrency, setEditConcurrency] = useState(100);
  const [editCarrier, setEditCarrier] = useState("Telnyx Elastic Tier-1");
  const [editRate, setEditRate] = useState(0.08);

  // Customize Account Modal State
  const [customizeModalTenant, setCustomizeModalTenant] = useState<string | null>(null);
  const [custOrgName, setCustOrgName] = useState("");
  const [custAdminName, setCustAdminName] = useState("");
  const [custAdminEmail, setCustAdminEmail] = useState("");
  const [custPasswordReset, setCustPasswordReset] = useState("");

  // Create Form State
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("Admin@123");
  const [selectedPlanId, setSelectedPlanId] = useState("plan-growth");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "6_months" | "yearly" | "pay_as_you_go">("monthly");
  const [initialCredits, setInitialCredits] = useState(250);
  const [maxConcurrency, setMaxConcurrency] = useState(40);
  const [assignedCarrier, setAssignedCarrier] = useState("Telnyx Elastic Tier-1");

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !adminEmail.trim()) return;

    const planObj = plans.find((p) => p.id === selectedPlanId) || plans[0];

    addTenant({
      orgName: orgName.trim(),
      primaryAdminName: adminName.trim() || "Lead Admin",
      primaryAdminEmail: adminEmail.trim(),
      password: adminPassword.trim() || "Admin@123",
      planId: planObj.id,
      planName: planObj.name,
      billingCycle,
      creditsBalance: initialCredits,
      creditRatePerMinute: planObj.payAsYouGoRatePerMinute,
      maxConcurrency,
      assignedSipCarrier: assignedCarrier,
      assignedEmailGateway: "Amazon SES Primary",
      assignedSmsGateway: "Twilio 10DLC Pool",
      allowedLLMs: ["Qwen/Qwen2.5-7B-Instruct-AWQ"],
      allowedTTS: ["kokoro-82m"],
      allowedSTT: ["distil-large-v3"],
      status: "active",
    });

    setOrgName("");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("Admin@123");
    setCreateModalOpen(false);
  };

  const handleImpersonateTenant = async (tenant: any) => {
    const rawId = typeof tenant.id === "string" ? tenant.id.replace("tenant-", "") : tenant.id;
    const numericID = parseInt(rawId) || 1;

    setActiveWorkspace({
      id: tenant.id,
      name: tenant.orgName,
      plan: tenant.planName.includes("Enterprise")
        ? "Enterprise"
        : tenant.planName.includes("Scale")
        ? "Scale"
        : "Growth",
      credits: tenant.creditsBalance,
      activeCalls: tenant.activeCallsNow,
    });

    addAdminToast({
      title: "Initializing Preview Mode",
      description: `Authorizing server preview token for '${tenant.orgName}'...`,
      type: "success",
    });

    const success = await startPreview(numericID);
    if (!success) {
      window.location.href = "/dashboard";
    }
  };

  const handleApplyCreditAdjustment = () => {
    if (!creditModalTenant) return;
    adjustTenantCredits(creditModalTenant, creditAmount, creditReason);
    setCreditModalTenant(null);
  };

  const handleSaveQuotas = () => {
    if (!quotaModalTenant) return;
    updateTenantQuotas(quotaModalTenant, editConcurrency, editCarrier, editRate);
    setQuotaModalTenant(null);
  };

  const handleSaveCustomizeAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customizeModalTenant) return;

    updateTenantAccount(customizeModalTenant, {
      orgName: custOrgName.trim(),
      primaryAdminName: custAdminName.trim(),
      primaryAdminEmail: custAdminEmail.trim(),
      passwordReset: custPasswordReset.trim(),
    });

    setCustomizeModalTenant(null);
    setCustPasswordReset("");
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.primaryAdminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.primaryAdminName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Tenant Organizations & Admins</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5] border border-[#3157D5]/20">
                1 Master Super Admin Control • {tenants.length} Tenant Workspaces
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Each tenant organization has 1 designated Lead Admin, managed and supervised globally by the Master Super Admin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tenant orgs or admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#3157D5]"
            />
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision Tenant</span>
          </button>
        </div>
      </div>

      {/* 2. Status Filter Pills */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-xs w-fit">
        {[
          { id: "all", label: `All (${tenants.length})` },
          { id: "active", label: `Active (${tenants.filter((t) => t.status === "active").length})` },
          { id: "trial", label: `Trial (${tenants.filter((t) => t.status === "trial").length})` },
          { id: "suspended", label: `Suspended (${tenants.filter((t) => t.status === "suspended").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              statusFilter === tab.id
                ? "bg-[#3157D5] text-white shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tenant Organizations Cards / Table */}
      {filteredTenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTenants.map((tenant) => {
            const isHighlighted = selectedParam === tenant.id;

            return (
              <div
                key={tenant.id}
                className={`p-6 bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                  isHighlighted ? "border-[#3157D5] ring-2 ring-[#3157D5]/30 shadow-md" : "border-[#E2E8F0] hover:border-[#3157D5]/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#3157D5]/20">
                        {tenant.orgName.substring(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#0F172A] leading-tight">{tenant.orgName}</h3>
                        <p className="text-[11px] text-[#64748B]">{tenant.primaryAdminEmail}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tenant.status === "active" ? "bg-[#EEF2FD] text-[#3157D5]" : "bg-rose-50 text-rose-600 border border-rose-200"
                    }`}>
                      {tenant.status}
                    </span>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Assigned Plan:</span>
                      <span className="font-bold text-[#3157D5]">{tenant.planName} ({tenant.billingCycle})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Credits Balance:</span>
                      <span className="font-bold text-[#0F172A] font-mono">${tenant.creditsBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Rate / Minute:</span>
                      <span className="font-mono text-[#0F172A]">${tenant.creditRatePerMinute.toFixed(2)} / min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Max Concurrency:</span>
                      <span className="font-bold text-[#0F172A]">{tenant.maxConcurrency} SIP channels</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#EDF2F7]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCreditModalTenant(tenant.id);
                        setCreditAmount(500);
                      }}
                      className="flex-1 py-2 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Adjust Credits</span>
                    </button>

                    <button
                      onClick={() => {
                        setCustomizeModalTenant(tenant.id);
                        setCustOrgName(tenant.orgName);
                        setCustAdminName(tenant.primaryAdminName);
                        setCustAdminEmail(tenant.primaryAdminEmail);
                        setCustPasswordReset(tenant.password || "Admin@123");
                      }}
                      className="p-2 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] rounded-xl text-[#3157D5] transition-colors cursor-pointer"
                      title="Edit Organization & Change Password"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setQuotaModalTenant(tenant.id);
                        setEditConcurrency(tenant.maxConcurrency);
                        setEditCarrier(tenant.assignedSipCarrier);
                        setEditRate(tenant.creditRatePerMinute);
                      }}
                      className="p-2 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                      title="Edit Resource Quotas"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => updateTenantStatus(tenant.id, tenant.status === "active" ? "suspended" : "active")}
                      className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                        tenant.status === "active"
                          ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                          : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                      }`}
                      title={tenant.status === "active" ? "Deactivate / Suspend Tenant Access" : "Activate Tenant Access"}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{tenant.status === "active" ? "Deactivate" : "Activate"}</span>
                    </button>

                    <button
                      onClick={() => setDeleteModalTenant(tenant)}
                      className="p-2 bg-white hover:bg-rose-50 border border-[#E2E8F0] hover:border-rose-300 text-rose-500 rounded-xl transition-colors cursor-pointer"
                      title="Delete Organization & Revoke Admin Access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleImpersonateTenant(tenant)}
                    className="w-full py-2 bg-[#EEF2FD] hover:bg-[#3157D5] text-[#3157D5] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#3157D5]/30 shadow-2xs group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                    <span>Log in as Tenant (1-Click Preview)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">No Tenant Organizations Provisioned</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Your database contains 0 active tenant organizations. Click &apos;Provision Tenant&apos; to onboard a new company.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#2646B8] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision Tenant</span>
          </button>
        </div>
      )}

      {/* 4. Customize Tenant Account Modal */}
      {customizeModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Customize Tenant Admin Account</h3>
              </div>
              <button onClick={() => setCustomizeModalTenant(null)} className="p-1 text-[#64748B] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomizeAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Organization Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={custOrgName}
                    onChange={(e) => setCustOrgName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Primary Admin Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={custAdminName}
                    onChange={(e) => setCustAdminName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Primary Admin Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={custAdminEmail}
                    onChange={(e) => setCustAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Reset Password (Optional)</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Enter new password to reset..."
                    value={custPasswordReset}
                    onChange={(e) => setCustPasswordReset(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <span className="text-[10px] text-[#64748B] mt-1 block">Leave blank to keep existing tenant credentials.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setCustomizeModalTenant(null)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors"
                >
                  Save Tenant Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Provision New Tenant Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Provision New Tenant Organization</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-[#64748B] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Financial AI"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Primary Admin Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@zenithai.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Admin Initial Login Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Admin@123"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  The admin will use this email and password to log in at <span className="text-[#3157D5] font-mono font-bold">/login</span> to open their workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Initial Subscription Tier</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={(e: any) => setBillingCycle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <option value="monthly">Monthly Subscription</option>
                    <option value="6_months">6 Months (15% off)</option>
                    <option value="yearly">Yearly (25% off)</option>
                    <option value="pay_as_you_go">Pay-As-You-Go Metered</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Initial Voice Credits ($)</label>
                  <input
                    type="number"
                    value={initialCredits}
                    onChange={(e) => setInitialCredits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Max SIP Concurrency</label>
                  <input
                    type="number"
                    value={maxConcurrency}
                    onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Adjust Credits Modal */}
      {creditModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Adjust Tenant Voice Credits</h3>
              </div>
              <button onClick={() => setCreditModalTenant(null)} className="p-1 text-[#64748B] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Adjustment Amount ($)</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  placeholder="+500 or -100"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono text-sm font-bold"
                />
                <span className="text-[10px] text-[#64748B] mt-1 block">Use positive value to add credits, negative to deduct.</span>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Audit Ledger Reason</label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="e.g. Promotional grant, custom wire payment, refund"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setCreditModalTenant(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCreditAdjustment}
                className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors"
              >
                Apply Credit Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Resource Quotas Modal */}
      {quotaModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Edit Tenant Resource Quotas</h3>
              </div>
              <button onClick={() => setQuotaModalTenant(null)} className="p-1 text-[#64748B] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Max Concurrent SIP Lines</label>
                <input
                  type="number"
                  value={editConcurrency}
                  onChange={(e) => setEditConcurrency(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Assigned Carrier Network</label>
                <select
                  value={editCarrier}
                  onChange={(e) => setEditCarrier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  {sipCarriers.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Minute Rate ($/min)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editRate}
                  onChange={(e) => setEditRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setQuotaModalTenant(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuotas}
                className="px-5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-colors"
              >
                Save Quotas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Edit Tenant Account & Password Modal */}
      {customizeModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Edit Organization & Password</h3>
              </div>
              <button onClick={() => setCustomizeModalTenant(null)} className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomizeAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Organization / Company Name</label>
                <input
                  type="text"
                  required
                  value={custOrgName}
                  onChange={(e) => setCustOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  placeholder="e.g. Apex Financial Services"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Lead Admin Name</label>
                  <input
                    type="text"
                    required
                    value={custAdminName}
                    onChange={(e) => setCustAdminName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={custAdminEmail}
                    onChange={(e) => setCustAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                    placeholder="admin@apexvoice.ai"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1 flex items-center justify-between">
                  <span>Dashboard Login Password</span>
                  <span className="text-[10px] text-[#3157D5] font-semibold">PostgreSQL Live Hash</span>
                </label>
                <input
                  type="text"
                  required
                  value={custPasswordReset}
                  onChange={(e) => setCustPasswordReset(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  placeholder="Enter new password (e.g. Admin@123)"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Updating this changes the tenant&apos;s active login credentials across both PostgreSQL database tables.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setCustomizeModalTenant(null)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors cursor-pointer"
                >
                  Save Organization & Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Confirm Delete Tenant Organization Modal */}
      {deleteModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Delete Tenant Organization</h3>
                <p className="text-xs text-rose-600 font-semibold">Irreversible Platform Deletion</p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Organization Name:</span>
                <span className="font-bold text-[#0F172A]">{deleteModalTenant.orgName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Lead Admin Account:</span>
                <span className="font-mono font-bold text-[#3157D5]">{deleteModalTenant.primaryAdminEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Plan / Credits:</span>
                <span className="font-mono text-emerald-600">${deleteModalTenant.creditsBalance.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete <strong>{deleteModalTenant.orgName}</strong>? This action will permanently wipe the tenant workspace, delete its voice bots, SIP trunks, call records, and revoke all administrator login access from the PostgreSQL database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDF2F7]">
              <button
                type="button"
                onClick={() => setDeleteModalTenant(null)}
                className="px-4 py-2.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTenant(deleteModalTenant.id);
                  setDeleteModalTenant(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Organization & Revoke Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminTenantsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#64748B]">Loading Tenant Directory...</div>}>
      <SuperAdminTenantsContent />
    </Suspense>
  );
}
