"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth, getApiBase } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";
import {
  Coins,
  Plus,
  CreditCard,
  Download,
  Loader2,
  X,
} from "lucide-react";

interface BillingInvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  numericAmount: number;
  status: string;
  transactionType: string;
  receiptUrl: string;
}

interface BillingDetailsData {
  tenantId: number;
  tenantName: string;
  creditsBalance: number;
  planId: string;
  planName: string;
  billingCycle: string;
  creditRatePerMinute: number;
  maxConcurrency: number;
  mrr: number;
  invoices: BillingInvoiceItem[];
}

export default function CreditsPage() {
  const { activeWorkspace, setActiveWorkspace, addToast } = useAppStore();
  const { tenant, user, refreshAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingDetailsData>({
    tenantId: tenant?.id || 5,
    tenantName: tenant?.tenantName || "My Organization",
    creditsBalance: tenant?.creditsBalance || 250.00,
    planId: "plan-growth",
    planName: "Growth Fleet",
    billingCycle: "monthly",
    creditRatePerMinute: 0.08,
    maxConcurrency: 40,
    mrr: 599.00,
    invoices: [],
  });

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState(500);
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState(true);
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  const fetchBillingDetails = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + "/billing/details";
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data: BillingDetailsData = await res.json();
        setBillingData(data);

        // Synchronize AppStore activeWorkspace balance and plan name
        setActiveWorkspace({
          ...activeWorkspace,
          name: data.tenantName || activeWorkspace.name,
          plan: (data.planName || activeWorkspace.plan) as any,
          credits: data.creditsBalance,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch billing details:", err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace, setActiveWorkspace]);

  useEffect(() => {
    fetchBillingDetails();
  }, [fetchBillingDetails]);

  const handleTopUp = async () => {
    setIsProcessingTopUp(true);
    try {
      const apiUrl = getApiBase() + "/billing/top-up";
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedTopUpAmount }),
      });

      if (res.ok) {
        const json = await res.json();
        await fetchBillingDetails();
        await refreshAuth();
        setShowTopUpModal(false);
        addToast({
          title: "Voice Credits Added",
          description: `Added $${selectedTopUpAmount}.00 to voice balance. New balance: $${json.creditsBalance?.toFixed(2) || (billingData.creditsBalance + selectedTopUpAmount).toFixed(2)}.`,
          type: "success",
        });
      } else {
        addToast({
          title: "Top-up Failed",
          description: "Unable to process credit purchase.",
          type: "error",
        });
      }
    } catch (err) {
      console.warn("Database API credit sync error:", err);
      addToast({
        title: "Connection Error",
        description: "Failed to connect to billing server.",
        type: "error",
      });
    } finally {
      setIsProcessingTopUp(false);
    }
  };

  const rate = billingData.creditRatePerMinute || 0.08;
  const currentBalance = billingData.creditsBalance !== undefined ? billingData.creditsBalance : activeWorkspace.credits;
  const availableMinutes = Math.round(currentBalance / rate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credits & Telephony Billing"
        description="Monitor voice minute balances, automatic replenishment triggers, and dedicated concurrency subscriptions."
        actions={
          <button
            onClick={() => setShowTopUpModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Voice Credits</span>
          </button>
        }
      />

      {/* Credit Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Remaining Credits Card */}
        <div className="p-6 bg-gradient-to-tr from-[#101A33] to-[#182647] text-white rounded-2xl border border-[#20325D] shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Available Balance</span>
              <div className="p-1.5 bg-[#3157D5] text-white rounded-lg">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-2 tracking-tight">
              ${currentBalance.toFixed(2)}
            </div>
            <span className="text-xs text-[#16A36A] font-semibold mt-1 block">
              ~{availableMinutes.toLocaleString()} Call Minutes Available
            </span>
          </div>

          <div className="pt-3 border-t border-[#20325D] flex justify-between items-center text-xs">
            <span className="text-[#94A3B8]">Rate: ${rate.toFixed(2)} / min</span>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="text-[#5C82FF] font-bold hover:underline"
            >
              + Quick Recharge
            </button>
          </div>
        </div>

        {/* Plan Tier Card */}
        <div className="p-6 bg-white rounded-2xl border border-[#E5EAF2] card-shadow flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#78849A] uppercase tracking-wider">Subscription Tier</span>
              <span className="text-xs font-bold text-[#3157D5] bg-[#EEF2FD] px-2.5 py-0.5 rounded-full capitalize">
                {billingData.billingCycle.replace("_", " ")}
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#172033] mt-2">{billingData.planName}</h3>
            <p className="text-xs text-[#78849A] mt-1">
              Up to {billingData.maxConcurrency} concurrent SIP lines, ${rate}/min rate, and automated call routing.
            </p>
          </div>

          <div className="pt-3 border-t border-[#EDF2F7] flex justify-between items-center text-xs text-[#78849A]">
            <span>Renews Next Cycle</span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px]">
              Active
            </span>
          </div>
        </div>

        {/* Auto-Recharge Setting Card */}
        <div className="p-6 bg-white rounded-2xl border border-[#E5EAF2] card-shadow flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#78849A] uppercase tracking-wider">Auto-Replenish</span>
              <div className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-[#172033] mt-2">Automatic Reload</h3>
            <p className="text-xs text-[#78849A] mt-1">
              When balance drops below <strong>$200.00</strong>, automatically recharge <strong>$500.00</strong> via Visa ending 4289.
            </p>
          </div>

          <div className="pt-3 border-t border-[#EDF2F7] flex justify-between items-center text-xs">
            <button
              onClick={() => {
                setAutoRechargeEnabled(!autoRechargeEnabled);
                addToast({
                  title: autoRechargeEnabled ? "Auto-Reload Paused" : "Auto-Reload Enabled",
                  description: "Billing trigger configuration updated.",
                  type: "info",
                });
              }}
              className={`font-semibold ${autoRechargeEnabled ? "text-[#D99025]" : "text-[#16A36A]"}`}
            >
              {autoRechargeEnabled ? "Pause Auto-Reload" : "Enable Auto-Reload"}
            </button>
            <span className="text-[#78849A]">Card •••• 4289</span>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] card-shadow overflow-hidden">
        <div className="p-4 border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#172033]">Recent Invoices & Transactions</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
              {billingData.invoices.length} Records
            </span>
          </div>
          <span className="text-xs text-[#78849A]">All amounts in USD</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FB] text-[#78849A] uppercase tracking-wider font-semibold border-b border-[#E5EAF2]">
              <tr>
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF2]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#64748B] text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#3157D5]" />
                      <span>Loading transactions from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : billingData.invoices.length > 0 ? (
                billingData.invoices.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#172033]">{tx.invoiceNumber || tx.id}</td>
                    <td className="p-4 text-[#78849A] whitespace-nowrap">{tx.date}</td>
                    <td className="p-4 font-medium text-[#172033]">{tx.description}</td>
                    <td className={`p-4 font-mono font-bold whitespace-nowrap ${tx.amount.startsWith("+") ? "text-[#16A36A]" : "text-[#172033]"}`}>
                      {tx.amount}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-[#E8F7F0] text-[#16A36A] rounded-full text-[10px] font-bold capitalize">
                        {tx.status || "Paid"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          addToast({ title: "Invoice Downloaded", description: `Saved ${tx.invoiceNumber || tx.id}.pdf`, type: "success" });
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#3157D5] hover:underline"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#64748B] text-xs">
                    No invoice or credit transactions recorded in database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101A33]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="text-base font-bold text-[#172033]">Add Voice Credits</h3>
              <button onClick={() => setShowTopUpModal(false)} className="text-[#78849A] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#172033]">Select Amount</label>
              <div className="grid grid-cols-3 gap-2">
                {[100, 250, 500, 1000, 2500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedTopUpAmount(amt)}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      selectedTopUpAmount === amt
                        ? "bg-[#EEF2FD] border-[#3157D5] text-[#3157D5]"
                        : "bg-[#F4F7FB] border-[#E5EAF2] text-[#172033]"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] flex items-center justify-between text-xs mt-3">
                <span className="text-[#78849A]">Payment Method:</span>
                <span className="font-semibold text-[#172033] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#3157D5]" />
                  Corporate Visa (•••• 4289)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5EAF2]">
              <button
                onClick={() => setShowTopUpModal(false)}
                className="px-3 py-2 text-xs font-semibold text-[#78849A] hover:text-[#172033]"
              >
                Cancel
              </button>
              <button
                disabled={isProcessingTopUp}
                onClick={handleTopUp}
                className="px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessingTopUp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Charge ${selectedTopUpAmount}.00</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
