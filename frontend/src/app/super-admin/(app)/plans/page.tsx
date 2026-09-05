"use client";

import React, { useState, useEffect } from "react";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import { PlatformPlan } from "@/lib/mock-data/super-admin";
import {
  CreditCard,
  Plus,
  Coins,
  Check,
  Building2,
  X,
  Edit3,
  Trash2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export default function SuperAdminPlansPage() {
  const {
    plans,
    refreshPlans,
    tenants,
    addPlan,
    updatePlan,
    deletePlan,
    updateTenantPlan,
  } = useSuperAdminStore();

  useEffect(() => {
    refreshPlans();
  }, [refreshPlans]);

  const [activeCycleTab, setActiveCycleTab] = useState<"monthly" | "6_months" | "yearly" | "pay_as_you_go">("monthly");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);

  // Edit plan modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [editPlanName, setEditPlanName] = useState("");
  const [editMonthlyPrice, setEditMonthlyPrice] = useState(499);
  const [editSixMonthsPrice, setEditSixMonthsPrice] = useState(429);
  const [editYearlyPrice, setEditYearlyPrice] = useState(379);
  const [editPaygoRate, setEditPaygoRate] = useState(0.09);
  const [editIncludedMinutes, setEditIncludedMinutes] = useState(5000);
  const [editConcurrency, setEditConcurrency] = useState(30);
  const [editDescription, setEditDescription] = useState("");
  const [editIsPopular, setEditIsPopular] = useState(false);

  // Delete plan modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<PlatformPlan | null>(null);

  // Assign plan state
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id || "");
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "");
  const [assignCycle, setAssignCycle] = useState<"monthly" | "6_months" | "yearly" | "pay_as_you_go">("yearly");

  // Create plan state
  const [newPlanName, setNewPlanName] = useState("");
  const [newMonthlyPrice, setNewMonthlyPrice] = useState(499);
  const [newSixMonthsPrice, setNewSixMonthsPrice] = useState(429);
  const [newYearlyPrice, setNewYearlyPrice] = useState(379);
  const [newPaygoRate, setNewPaygoRate] = useState(0.09);
  const [newIncludedMinutes, setNewIncludedMinutes] = useState(5000);
  const [newConcurrency, setNewConcurrency] = useState(30);
  const [newDescription, setNewDescription] = useState("");
  const [newIsPopular, setNewIsPopular] = useState(false);

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTID = selectedTenantId || (tenants[0]?.id ? String(tenants[0].id) : "tenant-7");
    const targetPID = selectedPlanId || (plans[0]?.id ? plans[0].id : "plan-scale");

    const plan = plans.find((p) => p.id === targetPID);
    if (!plan) return;

    await updateTenantPlan(targetTID, plan.id, plan.name, assignCycle);
    setAssignModalOpen(false);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    await addPlan({
      name: newPlanName.trim(),
      slug: newPlanName.toLowerCase().replace(/\s+/g, "_"),
      description: newDescription.trim() || "Configured platform tier for high-volume automated voice fleets.",
      monthlyPrice: newMonthlyPrice,
      sixMonthsPrice: newSixMonthsPrice,
      yearlyPrice: newYearlyPrice,
      payAsYouGoRatePerMinute: newPaygoRate,
      creditMultiplier: 1.2,
      includedMinutes: newIncludedMinutes,
      maxConcurrency: newConcurrency,
      features: [
        `${newConcurrency} Concurrent SIP Lines`,
        `${newIncludedMinutes.toLocaleString()} Included Minutes / Mo`,
        "Real-Time Speech Synthesis & STT",
        "Smart AMD 2.0 Tone Drop",
        "Webhooks & CRM Integrations",
      ],
      allowedEnginesCount: 8,
      isPopular: newIsPopular,
      status: "active",
    });

    setNewPlanName("");
    setNewDescription("");
    setNewIsPopular(false);
    setCreatePlanModalOpen(false);
  };

  const openEditModal = (plan: PlatformPlan) => {
    setEditingPlan(plan);
    setEditPlanName(plan.name);
    setEditMonthlyPrice(plan.monthlyPrice);
    setEditSixMonthsPrice(plan.sixMonthsPrice);
    setEditYearlyPrice(plan.yearlyPrice);
    setEditPaygoRate(plan.payAsYouGoRatePerMinute);
    setEditIncludedMinutes(plan.includedMinutes);
    setEditConcurrency(plan.maxConcurrency);
    setEditDescription(plan.description);
    setEditIsPopular(!!plan.isPopular);
    setEditModalOpen(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editPlanName.trim()) return;

    await updatePlan(editingPlan.id, {
      name: editPlanName.trim(),
      monthlyPrice: editMonthlyPrice,
      sixMonthsPrice: editSixMonthsPrice,
      yearlyPrice: editYearlyPrice,
      payAsYouGoRatePerMinute: editPaygoRate,
      includedMinutes: editIncludedMinutes,
      maxConcurrency: editConcurrency,
      description: editDescription.trim(),
      isPopular: editIsPopular,
      features: [
        `${editConcurrency} Concurrent SIP Lines`,
        `${editIncludedMinutes.toLocaleString()} Included Minutes / Mo`,
        "Real-Time Speech Synthesis & STT",
        "Smart AMD 2.0 Tone Drop",
        "Webhooks & CRM Integrations",
      ],
    });

    setEditModalOpen(false);
    setEditingPlan(null);
  };

  const openDeleteModal = (plan: PlatformPlan) => {
    setDeletingPlan(plan);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlan) return;
    await deletePlan(deletingPlan.id);
    setDeleteModalOpen(false);
    setDeletingPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Platform Plans & Credit Rates</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
                {plans.length} Database Tiers
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Configure Monthly, 6-Month, Yearly, and Pay-As-You-Go subscription rates, minute credit multipliers, and edit or delete tiers stored in PostgreSQL database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setAssignModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5] rounded-xl text-xs font-bold transition-all shadow-2xs whitespace-nowrap shrink-0"
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Assign Plan to Tenant</span>
          </button>

          <button
            onClick={() => setCreatePlanModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Create Plan Tier</span>
          </button>
        </div>
      </div>

      {/* 2. Billing Cycle Switcher Pills */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E2E8F0] shadow-xs">
          {[
            { id: "monthly", label: "Monthly Billing" },
            { id: "6_months", label: "6 Months (15% Off)" },
            { id: "yearly", label: "Yearly (25% Off)" },
            { id: "pay_as_you_go", label: "Pay-As-You-Go (Metered)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCycleTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeCycleTab === tab.id
                  ? "bg-[#3157D5] text-white shadow-md shadow-[#3157D5]/20"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#EEF2FD] text-[#3157D5] rounded-xl text-xs font-bold border border-[#3157D5]/20">
          <Coins className="w-3.5 h-3.5" />
          <span>Platform Minute Rate Engine: 1 Credit = 1 Minute</span>
        </div>
      </div>

      {/* 3. Platform Plan Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const price =
            activeCycleTab === "monthly"
              ? plan.monthlyPrice
              : activeCycleTab === "6_months"
              ? plan.sixMonthsPrice
              : activeCycleTab === "yearly"
              ? plan.yearlyPrice
              : 0;

          const assignedCount = tenants.filter((t) => t.planId === plan.id).length;

          return (
            <div
              key={plan.id}
              className={`p-5 bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-4 relative group ${
                plan.isPopular ? "border-[#3157D5] ring-2 ring-[#3157D5]/30" : "border-[#E2E8F0] hover:border-[#3157D5]/40"
              }`}
            >
              <div className="space-y-3">
                {/* Header with Title, Status & Clean Popular Badge */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-[#0F172A] tracking-tight">{plan.name}</h3>
                    {plan.isPopular && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#3157D5] text-white px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                        Popular
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#3157D5] bg-[#EEF2FD] px-2.5 py-1 rounded-lg inline-block whitespace-nowrap">
                      {assignedCount} Tenants Active
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div>
                  {activeCycleTab === "pay_as_you_go" || plan.slug === "pay_as_you_go" ? (
                    <div className="space-y-0.5">
                      <div className="text-2xl font-black text-[#0F172A] font-mono">
                        ${plan.payAsYouGoRatePerMinute.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-[#64748B] font-semibold">per active voice minute</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-2xl font-black text-[#0F172A] font-mono">
                        ${price}
                        <span className="text-xs font-normal text-[#64748B]">/mo</span>
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        + ${plan.payAsYouGoRatePerMinute.toFixed(2)}/min overage
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed line-clamp-3">
                  {plan.description}
                </p>

                {/* Quota Highlights */}
                <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Concurrency:</span>
                    <span className="font-bold text-[#0F172A]">{plan.maxConcurrency} lines</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Included Mins:</span>
                    <span className="font-bold text-[#0F172A]">{plan.includedMinutes.toLocaleString()} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Minute Rate:</span>
                    <span className="font-mono text-[#3157D5] font-bold">${plan.payAsYouGoRatePerMinute}/min</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-1.5 pt-1 text-xs">
                  {(plan.features || []).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-[#0F172A]">
                      <Check className="w-3.5 h-3.5 text-[#3157D5] shrink-0" />
                      <span className="text-[11px] font-medium leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons at bottom */}
              <div className="pt-3 border-t border-[#EDF2F7] flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setAssignModalOpen(true);
                  }}
                  className="flex-1 py-2 bg-white hover:bg-[#3157D5] text-[#0F172A] hover:text-white border border-[#E2E8F0] hover:border-[#3157D5] rounded-xl text-xs font-bold transition-all shadow-2xs text-center"
                >
                  Assign to Tenant
                </button>
                <button
                  onClick={() => openEditModal(plan)}
                  title="Edit Plan Settings"
                  className="p-2 bg-[#F8FAFC] hover:bg-[#EEF2FD] text-[#64748B] hover:text-[#3157D5] border border-[#E2E8F0] hover:border-[#3157D5]/40 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(plan)}
                  title="Delete Plan Tier"
                  className="p-2 bg-[#F8FAFC] hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#EF4444] border border-[#E2E8F0] hover:border-[#EF4444]/40 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Assign Plan Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Assign Plan to Tenant Admin</h3>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignPlan} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Target Tenant Organization</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.orgName} (Current: {t.planName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">New Plan Tier</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.monthlyPrice}/mo - ${p.payAsYouGoRatePerMinute}/min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Billing Interval</label>
                <select
                  value={assignCycle}
                  onChange={(e: any) => setAssignCycle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="6_months">6 Months (15% discount applied)</option>
                  <option value="yearly">Yearly (25% discount applied)</option>
                  <option value="pay_as_you_go">Pay-As-You-Go (Usage Metered)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create Plan Tier Modal */}
      {createPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Create Platform Plan Tier</h3>
              </div>
              <button
                onClick={() => setCreatePlanModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Plan Tier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agency Pro Fleet"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Monthly ($)</label>
                  <input
                    type="number"
                    value={newMonthlyPrice}
                    onChange={(e) => setNewMonthlyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">6-Mo ($/mo)</label>
                  <input
                    type="number"
                    value={newSixMonthsPrice}
                    onChange={(e) => setNewSixMonthsPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Yearly ($/mo)</label>
                  <input
                    type="number"
                    value={newYearlyPrice}
                    onChange={(e) => setNewYearlyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Rate ($/min)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPaygoRate}
                    onChange={(e) => setNewPaygoRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Included Mins</label>
                  <input
                    type="number"
                    value={newIncludedMinutes}
                    onChange={(e) => setNewIncludedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Max SIP Lines</label>
                  <input
                    type="number"
                    value={newConcurrency}
                    onChange={(e) => setNewConcurrency(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Plan Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Target customer profile and high-level limits..."
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <input
                  type="checkbox"
                  id="newIsPopular"
                  checked={newIsPopular}
                  onChange={(e) => setNewIsPopular(e.target.checked)}
                  className="rounded text-[#3157D5] focus:ring-[#3157D5]"
                />
                <label htmlFor="newIsPopular" className="text-xs font-semibold text-[#0F172A] cursor-pointer flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3157D5]" />
                  Mark as &quot;Popular&quot; Plan Tier
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setCreatePlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors"
                >
                  Create Plan Tier (Save to Database)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Plan Tier Modal */}
      {editModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Edit Platform Plan Tier</h3>
                  <p className="text-[11px] text-[#64748B]">Updating {editingPlan.name} in PostgreSQL database</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Plan Tier Name</label>
                <input
                  type="text"
                  required
                  value={editPlanName}
                  onChange={(e) => setEditPlanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Monthly ($)</label>
                  <input
                    type="number"
                    value={editMonthlyPrice}
                    onChange={(e) => setEditMonthlyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">6-Mo ($/mo)</label>
                  <input
                    type="number"
                    value={editSixMonthsPrice}
                    onChange={(e) => setEditSixMonthsPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Yearly ($/mo)</label>
                  <input
                    type="number"
                    value={editYearlyPrice}
                    onChange={(e) => setEditYearlyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Rate ($/min)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPaygoRate}
                    onChange={(e) => setEditPaygoRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Included Mins</label>
                  <input
                    type="number"
                    value={editIncludedMinutes}
                    onChange={(e) => setEditIncludedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Max SIP Lines</label>
                  <input
                    type="number"
                    value={editConcurrency}
                    onChange={(e) => setEditConcurrency(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Plan Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <input
                  type="checkbox"
                  id="editIsPopular"
                  checked={editIsPopular}
                  onChange={(e) => setEditIsPopular(e.target.checked)}
                  className="rounded text-[#3157D5] focus:ring-[#3157D5]"
                />
                <label htmlFor="editIsPopular" className="text-xs font-semibold text-[#0F172A] cursor-pointer flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3157D5]" />
                  Mark as &quot;Popular&quot; Plan Tier
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors"
                >
                  Save Changes (Database Sync)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Plan Confirmation Modal */}
      {deleteModalOpen && deletingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <div className="w-10 h-10 rounded-2xl bg-[#FEE2E2] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Delete Platform Plan Tier</h3>
                <p className="text-xs text-[#64748B]">This action is permanent in database.</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to permanently delete plan tier <strong className="text-[#0F172A]">&quot;{deletingPlan.name}&quot;</strong>? It will be removed immediately from PostgreSQL database table <code className="bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#0F172A]">platform_plans</code>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingPlan(null);
                }}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-xs font-bold shadow-md shadow-[#EF4444]/20 transition-colors"
              >
                Permanently Delete from Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
