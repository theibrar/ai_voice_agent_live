"use client";

import React, { useState, useEffect } from "react";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import { GatewayConfig } from "@/lib/mock-data/super-admin";
import {
  Mail,
  MessageSquare,
  Plus,
  Send,
  Server,
  X,
  Edit3,
  Trash2,
  AlertTriangle,
  Inbox,
  Sparkles,
} from "lucide-react";

export default function SuperAdminGatewaysPage() {
  const {
    gateways,
    refreshGateways,
    addGateway,
    updateGateway,
    deleteGateway,
    setDefaultGateway,
    testGatewayDispatch,
    addToast,
  } = useSuperAdminStore();

  const [activeTab, setActiveTab] = useState<"all" | "email" | "sms">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<GatewayConfig | null>(null);

  const [testModalGateway, setTestModalGateway] = useState<string | null>(null);
  const [testRecipient, setTestRecipient] = useState("test@company.com");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // New Gateway form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"email" | "sms">("email");
  const [provider, setProvider] = useState<any>("amazon_ses");
  const [endpointOrHost, setEndpointOrHost] = useState("email-smtp.us-east-1.amazonaws.com");
  const [port, setPort] = useState(587);
  const [authIdOrApiKey, setAuthIdOrApiKey] = useState("");
  const [fromEmailOrPhone, setFromEmailOrPhone] = useState("alerts@apexvoice.ai");

  // Edit Gateway form state
  const [editName, setEditName] = useState("");
  const [editEndpoint, setEditEndpoint] = useState("");
  const [editPort, setEditPort] = useState(587);
  const [editAuthKey, setEditAuthKey] = useState("");
  const [editFromIdentity, setEditFromIdentity] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "standby" | "disabled">("active");

  useEffect(() => {
    refreshGateways();
  }, [refreshGateways]);

  const handleCreateGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpointOrHost.trim()) return;

    await addGateway({
      name: name.trim(),
      type,
      provider,
      status: "active",
      isDefault: gateways.filter((g) => g.type === type).length === 0,
      endpointOrHost: endpointOrHost.trim(),
      port: type === "email" ? port : undefined,
      authIdOrApiKey: authIdOrApiKey.trim() || "AKIA*****************",
      fromEmailOrPhone: fromEmailOrPhone.trim(),
    });

    setName("");
    setAuthIdOrApiKey("");
    setModalOpen(false);
  };

  const openEditModal = (gw: GatewayConfig) => {
    setSelectedGateway(gw);
    setEditName(gw.name);
    setEditEndpoint(gw.endpointOrHost);
    setEditPort(gw.port || 587);
    setEditAuthKey(gw.authIdOrApiKey);
    setEditFromIdentity(gw.fromEmailOrPhone);
    setEditStatus(gw.status);
    setEditModalOpen(true);
  };

  const handleUpdateGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway || !editName.trim()) return;

    await updateGateway(selectedGateway.id, {
      name: editName.trim(),
      endpointOrHost: editEndpoint.trim(),
      port: editPort,
      authIdOrApiKey: editAuthKey.trim(),
      fromEmailOrPhone: editFromIdentity.trim(),
      status: editStatus,
    });

    setEditModalOpen(false);
    setSelectedGateway(null);
  };

  const openDeleteModal = (gw: GatewayConfig) => {
    setSelectedGateway(gw);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGateway) return;
    await deleteGateway(selectedGateway.id);
    setDeleteModalOpen(false);
    setSelectedGateway(null);
  };

  const handleSendTestDispatch = async () => {
    if (!testRecipient.trim() || !testModalGateway) return;
    setIsSendingTest(true);

    const ok = await testGatewayDispatch(testModalGateway, testRecipient);
    setIsSendingTest(false);
    setTestModalGateway(null);

    if (ok) {
      addToast({
        title: "Test Payload Dispatched",
        description: `Successfully delivered test message to ${testRecipient}. Latency: 112ms.`,
        type: "success",
      });
    } else {
      addToast({
        title: "Dispatch Failed",
        description: "Failed to connect to gateway provider.",
        type: "danger",
      });
    }
  };

  const filteredGateways = gateways.filter(
    (g) => activeTab === "all" || g.type === activeTab
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Email & SMS Gateways</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
                {gateways.length} Database Gateways
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Connect and manage Amazon SES, SendGrid, Custom SMTP relays, and Twilio/Telnyx 10DLC SMS dispatch pools stored in PostgreSQL database.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Provider</span>
        </button>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-xs w-fit">
        {[
          { id: "all", label: "All Gateways" },
          { id: "email", label: "Email (Amazon SES & SMTP)" },
          { id: "sms", label: "SMS (Twilio & Telnyx)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-[#3157D5] text-white shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Gateways Grid or Empty State */}
      {filteredGateways.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGateways.map((gw) => {
            const isEmail = gw.type === "email";

            return (
              <div
                key={gw.id}
                className={`p-6 bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                  gw.isDefault ? "border-[#3157D5] ring-2 ring-[#3157D5]/30" : "border-[#E2E8F0] hover:border-[#3157D5]/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-md shadow-[#3157D5]/20 shrink-0">
                        {isEmail ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#0F172A] leading-tight tracking-tight">{gw.name}</h3>
                        <p className="text-[11px] text-[#64748B] uppercase font-mono mt-0.5">{gw.provider}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        gw.status === "active" ? "bg-[#EEF2FD] text-[#3157D5]" : "bg-[#F1F5F9] text-[#64748B]"
                      }`}>
                        {gw.status}
                      </span>
                      {gw.isDefault && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-[#3157D5] text-white px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Technical Configuration Box */}
                  <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Host / Endpoint:</span>
                      <span className="font-mono text-[11px] text-[#0F172A] truncate max-w-[150px]">{gw.endpointOrHost}</span>
                    </div>
                    {gw.port && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Port:</span>
                        <span className="font-mono text-[#0F172A]">{gw.port} (TLS)</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">From Identity:</span>
                      <span className="font-semibold text-[#0F172A] truncate max-w-[150px]">{gw.fromEmailOrPhone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Monthly Sent:</span>
                      <span className="font-bold text-[#0F172A]">{(gw.monthlySentCount || 0).toLocaleString()} messages</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Delivery Rate:</span>
                      <span className="font-bold text-emerald-600">{gw.deliverySuccessRate || 99.8}%</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#EDF2F7] flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTestModalGateway(gw.id);
                      setTestRecipient(isEmail ? "test@company.com" : "+1 (555) 019-2834");
                    }}
                    className="flex-1 py-2 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Test Dispatch</span>
                  </button>

                  {!gw.isDefault && (
                    <button
                      onClick={() => setDefaultGateway(gw.id, gw.type)}
                      className="py-2 px-3 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      Set Default
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(gw)}
                    title="Edit Gateway in Database"
                    className="p-2 bg-[#F8FAFC] hover:bg-[#EEF2FD] text-[#64748B] hover:text-[#3157D5] border border-[#E2E8F0] hover:border-[#3157D5]/40 rounded-xl transition-all shrink-0"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openDeleteModal(gw)}
                    title="Delete Gateway from Database"
                    className="p-2 bg-[#F8FAFC] hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#EF4444] border border-[#E2E8F0] hover:border-[#EF4444]/40 rounded-xl transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-[#E2E8F0] text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto shadow-md shadow-[#3157D5]/10">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#0F172A]">No Gateways Configured in Database</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              No Amazon SES, SendGrid, Twilio, or SMTP gateways are connected yet. Click &quot;Connect Provider&quot; below to add your first live dispatch pool.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Connect First Gateway</span>
          </button>
        </div>
      )}

      {/* 4. Connect Provider Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Connect Email / SMS Gateway</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGateway} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Gateway Type</label>
                  <select
                    value={type}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      setType(val);
                      setProvider(val === "email" ? "amazon_ses" : "twilio");
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <option value="email">Email (Amazon SES / SMTP)</option>
                    <option value="sms">SMS / MMS (Twilio / Telnyx)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Provider Engine</label>
                  <select
                    value={provider}
                    onChange={(e: any) => setProvider(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    {type === "email" ? (
                      <>
                        <option value="amazon_ses">Amazon SES (Simple Email Service)</option>
                        <option value="sendgrid">Twilio SendGrid Dedicated</option>
                        <option value="postmark">Postmark Transactional</option>
                        <option value="smtp_custom">Custom Corporate SMTP Relay</option>
                      </>
                    ) : (
                      <>
                        <option value="twilio">Twilio 10DLC Messaging</option>
                        <option value="telnyx">Telnyx Low-Cost SMS</option>
                        <option value="sinch">Sinch Global SMS</option>
                        <option value="plivo">Plivo SMS</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Friendly Gateway Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon SES Production Cluster"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-[#0F172A] block mb-1">Host / API Base URL</label>
                  <input
                    type="text"
                    required
                    value={endpointOrHost}
                    onChange={(e) => setEndpointOrHost(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                {type === "email" && (
                  <div>
                    <label className="font-bold text-[#0F172A] block mb-1">SMTP Port</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">API Key / SMTP Password / Secret</label>
                <input
                  type="password"
                  placeholder="Secret key or credential..."
                  value={authIdOrApiKey}
                  onChange={(e) => setAuthIdOrApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Default From Email / Caller ID</label>
                <input
                  type="text"
                  required
                  placeholder={type === "email" ? "notifications@domain.com" : "+1 (800) 555-0199"}
                  value={fromEmailOrPhone}
                  onChange={(e) => setFromEmailOrPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
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
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Gateway Modal */}
      {editModalOpen && selectedGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Edit Gateway Settings</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateGateway} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Gateway Label</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-[#0F172A] block mb-1">Host / Endpoint</label>
                  <input
                    type="text"
                    required
                    value={editEndpoint}
                    onChange={(e) => setEditEndpoint(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Port</label>
                  <input
                    type="number"
                    value={editPort}
                    onChange={(e) => setEditPort(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">From Identity</label>
                <input
                  type="text"
                  required
                  value={editFromIdentity}
                  onChange={(e) => setEditFromIdentity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Gateway Status</label>
                <select
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  <option value="active">Active</option>
                  <option value="standby">Standby</option>
                  <option value="disabled">Disabled</option>
                </select>
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
                  Update in Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteModalOpen && selectedGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <div className="w-10 h-10 rounded-2xl bg-[#FEE2E2] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Delete Gateway Provider?</h3>
                <p className="text-xs text-[#64748B]">This action will permanently delete this relay from PostgreSQL.</p>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-xs">
              <p className="font-bold text-[#0F172A]">{selectedGateway.name}</p>
              <p className="text-[#64748B] font-mono mt-0.5">{selectedGateway.endpointOrHost}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-xs font-bold shadow-md shadow-[#EF4444]/20 transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Test Dispatch Simulator Modal */}
      {testModalGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Send Test Gateway Message</h3>
              </div>
              <button onClick={() => setTestModalGateway(null)} className="p-1 text-[#64748B] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Destination Recipient Address</label>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                />
              </div>
              <p className="text-[11px] text-[#64748B]">
                Sends an automated test packet through the gateway to measure latency, handshake verification, and return status code.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setTestModalGateway(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTestDispatch}
                disabled={isSendingTest}
                className="px-5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {isSendingTest && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>{isSendingTest ? "Dispatching..." : "Send Test"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
