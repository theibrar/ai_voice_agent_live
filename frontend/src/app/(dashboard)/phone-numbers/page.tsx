"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { PhoneNumber } from "@/lib/types";
import {
  Phone,
  Plus,
  Search,
  Bot,
  Megaphone,
  CheckCircle2,
  MessageSquare,
  Globe,
  Sliders,
  DollarSign,
  X,
  Trash2,
  RefreshCw,
  Loader2,
  Sparkles,
  Settings2,
} from "lucide-react";

interface AvailableNumberItem {
  phoneNumber: string;
  formattedNumber: string;
  country: string;
  region: string;
  locality: string;
  type: string;
  monthlyCost: number;
  upfrontCost: number;
  capabilities: {
    voice?: boolean;
    sms?: boolean;
  };
}

export default function PhoneNumbersPage() {
  const {
    phoneNumbers,
    refreshPhoneNumbers,
    provisionPhoneNumber,
    assignPhoneNumber,
    deletePhoneNumber,
    agents,
    campaigns,
    addToast,
  } = useAppStore();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedAreaCode, setSelectedAreaCode] = useState("415");
  const [selectedNumberType, setSelectedNumberType] = useState<"toll_free" | "local">("local");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumberItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState<string | null>(null);

  // Assignment Modal
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [selectedPhoneForRoute, setSelectedPhoneForRoute] = useState<PhoneNumber | null>(null);
  const [assignedAgentId, setAssignedAgentId] = useState("");
  const [assignedCampaignId, setAssignedCampaignId] = useState("");
  const [friendlyName, setFriendlyName] = useState("");

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [phoneToDelete, setPhoneToDelete] = useState<PhoneNumber | null>(null);

  // Search Telnyx numbers
  const fetchAvailableNumbers = async (areaCode: string, numType: string) => {
    setIsSearching(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/phone-numbers/available?country=US&area_code=${encodeURIComponent(areaCode)}&type=${numType}`;
      const res = await fetch(apiUrl, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.available_numbers)) {
          setAvailableNumbers(data.available_numbers);
        }
      }
    } catch (err) {
      console.warn("Failed to search numbers:", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    refreshPhoneNumbers();
  }, [refreshPhoneNumbers]);

  useEffect(() => {
    if (showBuyModal) {
      fetchAvailableNumbers(selectedAreaCode, selectedNumberType);
    }
  }, [showBuyModal, selectedNumberType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAvailableNumbers(selectedAreaCode, selectedNumberType);
  };

  const handleBuyNumber = async (item: AvailableNumberItem) => {
    setIsProvisioning(item.phoneNumber);
    try {
      await provisionPhoneNumber({
        phoneNumber: item.phoneNumber,
        friendlyName: `Inbound DID (${item.locality || item.region || "US"})`,
        country: item.country || "US",
        monthlyCost: item.monthlyCost || 2.50,
      });
      setShowBuyModal(false);
    } catch (err) {
      console.warn("Provisioning failed:", err);
    } finally {
      setIsProvisioning(null);
    }
  };

  const handleOpenRouteModal = (pn: PhoneNumber) => {
    setSelectedPhoneForRoute(pn);
    setAssignedAgentId(pn.assignedAgentId || "");
    setAssignedCampaignId(pn.assignedCampaignId || "");
    setFriendlyName(pn.friendlyName || "");
    setRouteModalOpen(true);
  };

  const handleSaveRouting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoneForRoute) return;

    await assignPhoneNumber(selectedPhoneForRoute.id, {
      assignedAgentId: assignedAgentId || undefined,
      assignedCampaignId: assignedCampaignId || undefined,
      friendlyName: friendlyName.trim() || selectedPhoneForRoute.friendlyName,
    });
    setRouteModalOpen(false);
    setSelectedPhoneForRoute(null);
  };

  const handleConfirmDelete = async () => {
    if (!phoneToDelete) return;
    await deletePhoneNumber(phoneToDelete.id);
    setDeleteModalOpen(false);
    setPhoneToDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telephony & Phone Numbers"
        description="Provision dedicated local and toll-free numbers with direct SIP routing, AI agent voice bindings, and outbound caller ID registration."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshPhoneNumbers()}
              className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Refresh Numbers"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Number</span>
            </button>
          </div>
        }
      />

      {/* Grid of Numbers */}
      {phoneNumbers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phoneNumbers.map((pn) => (
            <div
              key={pn.id}
              className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#3157D5]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-bold font-mono text-[#0F172A]">{pn.formattedNumber || pn.number}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{pn.friendlyName}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FD] text-[#3157D5] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3157D5] animate-pulse" />
                    {pn.status}
                  </span>
                </div>

                {/* Routing detail */}
                <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-[#3157D5]" /> Assigned Agent:
                    </span>
                    <span className="font-bold text-[#0F172A] truncate max-w-[140px]">
                      {pn.assignedAgentName || (pn.assignedAgentId ? agents.find((a) => a.id === pn.assignedAgentId)?.name : "Unassigned")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-[#3157D5]" /> Campaign:
                    </span>
                    <span className="font-semibold text-[#0F172A] truncate max-w-[140px]">
                      {pn.assignedCampaignName || (pn.assignedCampaignId ? campaigns.find((c) => c.id === pn.assignedCampaignId)?.name : "Direct Inbound")}
                    </span>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md font-bold text-[10px]">
                    <CheckCircle2 className="w-3 h-3" /> Voice In/Out
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FD] text-[#3157D5] rounded-md font-bold text-[10px]">
                    <MessageSquare className="w-3 h-3" /> SMS Active
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-[#EDF2F7] flex items-center justify-between text-xs">
                <span className="text-[#64748B] text-[11px] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Dedicated Voice DID
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRouteModal(pn)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#3157D5] hover:bg-[#EEF2FD] rounded-lg transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Routing</span>
                  </button>
                  <button
                    onClick={() => {
                      setPhoneToDelete(pn);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Release Number"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto shadow-sm">
            <Phone className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Phone Numbers Provisioned</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Your workspace contains 0 registered phone numbers. Click &apos;Provision New Number&apos; to search available numbers and bind them to your AI voice agents.
          </p>
          <button
            onClick={() => setShowBuyModal(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#3157D5] text-white text-xs font-bold rounded-xl shadow-md shadow-[#3157D5]/20 hover:bg-[#2646B8] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Number</span>
          </button>
        </div>
      )}

      {/* Buy Number Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Provision Phone Number</h3>
                  <p className="text-[11px] text-[#64748B]">Search available numbers & instant workspace allocation</p>
                </div>
              </div>
              <button
                onClick={() => setShowBuyModal(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNumberType("local")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedNumberType === "local"
                      ? "bg-[#EEF2FD] border-[#3157D5] text-[#3157D5] shadow-xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  Local Area Code
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNumberType("toll_free")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedNumberType === "toll_free"
                      ? "bg-[#EEF2FD] border-[#3157D5] text-[#3157D5] shadow-xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  Toll-Free (800 / 888)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Search by Area Code or City</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. 415, 212, 310, 800"
                      value={selectedAreaCode}
                      onChange={(e) => setSelectedAreaCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#3157D5]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3157D5] text-white rounded-xl text-xs font-bold hover:bg-[#2646B8] transition-colors cursor-pointer"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>

            {/* Available numbers live list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                <span>Available Phone Numbers:</span>
                {isSearching && (
                  <span className="flex items-center gap-1 text-[11px] text-[#3157D5]">
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching numbers...
                  </span>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 border border-[#E2E8F0] p-2 rounded-2xl">
                {availableNumbers.length > 0 ? (
                  availableNumbers.map((num) => {
                    const isBuying = isProvisioning === num.phoneNumber;
                    return (
                      <div
                        key={num.phoneNumber}
                        className="p-3 bg-[#F8FAFC] hover:bg-[#EEF2FD]/50 border border-[#E2E8F0] hover:border-[#3157D5]/40 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div>
                          <p className="font-mono font-bold text-xs text-[#0F172A]">{num.formattedNumber || num.phoneNumber}</p>
                          <p className="text-[10px] text-[#64748B]">
                            {num.locality ? `${num.locality}, ${num.region}` : (num.region || "United States")} • Voice & SMS
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isBuying}
                          onClick={() => handleBuyNumber(num)}
                          className="px-3.5 py-1.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isBuying ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Allocating...</span>
                            </>
                          ) : (
                            <span>Allocate Number</span>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-[#64748B]">
                    No numbers found for area code &apos;{selectedAreaCode}&apos;. Try another area code.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#EDF2F7]">
              <button
                onClick={() => setShowBuyModal(false)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routing Configuration Modal */}
      {routeModalOpen && selectedPhoneForRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Configure Inbound Routing</h3>
                  <p className="text-[11px] text-[#64748B] font-mono">{selectedPhoneForRoute.formattedNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setRouteModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRouting} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Friendly Label</label>
                <input
                  type="text"
                  value={friendlyName}
                  onChange={(e) => setFriendlyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Assigned Voice AI Agent</label>
                <select
                  value={assignedAgentId}
                  onChange={(e) => setAssignedAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  <option value="">-- None (Unassigned) --</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.role || "Voice Agent"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Assigned Campaign / Flow</label>
                <select
                  value={assignedCampaignId}
                  onChange={(e) => setAssignedCampaignId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  <option value="">-- Direct Inbound (Default) --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDF2F7]">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="px-4 py-2 font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white font-bold rounded-xl shadow-md shadow-[#3157D5]/20 cursor-pointer"
                >
                  Save Routing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && phoneToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Release Phone Number</h3>
                <p className="text-xs text-rose-600 font-semibold font-mono">{phoneToDelete.formattedNumber}</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to release <strong>{phoneToDelete.formattedNumber}</strong>? Inbound calls will no longer route to your AI Agent.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDF2F7]">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Release Number
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

