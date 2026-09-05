"use client";

import React, { useState, useEffect } from "react";
import { useSuperAdminStore } from "@/lib/super-admin-store";
import { SipCarrierNetwork } from "@/lib/mock-data/super-admin";
import {
  PhoneCall,
  Radio,
  Plus,
  Server,
  Building2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Globe2,
  Cpu,
  Layers,
  X,
  Search,
  Trash2,
  Pencil,
} from "lucide-react";

export default function SuperAdminTelephonyPage() {
  const {
    sipCarriers,
    refreshSipCarriers,
    tenants,
    addSipCarrier,
    updateSipCarrier,
    updateSipCarrierStatus,
    setDefaultCarrier,
    deleteSipCarrier,
    updateTenantQuotas,
    addToast,
  } = useSuperAdminStore();

  useEffect(() => {
    refreshSipCarriers();
  }, [refreshSipCarriers]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<SipCarrierNetwork | null>(null);

  // Assign Carrier to Tenant state
  const [assignTenantId, setAssignTenantId] = useState(tenants[0]?.id || "");
  const [selectedCarrierName, setSelectedCarrierName] = useState(sipCarriers[0]?.name || "");

  // New Carrier form state
  const [name, setName] = useState("");
  const [carrier, setCarrier] = useState<any>("telnyx");
  const [sipServer, setSipServer] = useState("sip.telnyx.com");
  const [port, setPort] = useState(5060);
  const [transport, setTransport] = useState<"UDP" | "TCP" | "TLS" | string>("TLS");
  const [apiKey, setApiKey] = useState("");
  const [maxChannels, setMaxChannels] = useState(1000);
  const [wholesaleRate, setWholesaleRate] = useState(0.0035);

  // Edit Carrier form state
  const [editName, setEditName] = useState("");
  const [editCarrier, setEditCarrier] = useState<any>("telnyx");
  const [editSipServer, setEditSipServer] = useState("");
  const [editPort, setEditPort] = useState(5060);
  const [editTransport, setEditTransport] = useState<"UDP" | "TCP" | "TLS" | string>("TLS");
  const [editApiKey, setEditApiKey] = useState("");
  const [editMaxChannels, setEditMaxChannels] = useState(1000);
  const [editWholesaleRate, setEditWholesaleRate] = useState(0.0035);
  const [editStatus, setEditStatus] = useState<"online" | "degraded" | "offline">("online");

  const handleOpenEditModal = (c: SipCarrierNetwork) => {
    setEditingCarrier(c);
    setEditName(c.name);
    setEditCarrier(c.carrier);
    setEditSipServer(c.sipServer);
    setEditPort(c.port);
    setEditTransport(c.transport);
    setEditApiKey(c.apiKey || "");
    setEditMaxChannels(c.maxChannels);
    setEditWholesaleRate(c.ratePerMinuteWholesale);
    setEditStatus(c.status);
    setEditModalOpen(true);
  };

  const handleUpdateCarrier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCarrier || !editName.trim() || !editSipServer.trim()) return;

    updateSipCarrier(editingCarrier.id, {
      name: editName.trim(),
      carrier: editCarrier,
      status: editStatus,
      sipServer: editSipServer.trim(),
      port: editPort,
      transport: editTransport,
      apiKey: editApiKey.trim() || undefined,
      maxChannels: editMaxChannels,
      ratePerMinuteWholesale: editWholesaleRate,
    });

    setEditModalOpen(false);
    setEditingCarrier(null);
  };

  const handleCreateCarrier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sipServer.trim()) return;

    addSipCarrier({
      name: name.trim(),
      carrier,
      status: "online",
      sipServer: sipServer.trim(),
      port,
      transport,
      apiKey: apiKey.trim() || undefined,
      codecPriority: ["Opus (48kHz)", "G.711u", "G.711a"],
      maxChannels,
      ratePerMinuteWholesale: wholesaleRate,
      popRegions: ["US-East (Ashburn)", "US-West (San Jose)", "EU (Frankfurt)"],
      isDefaultCarrier: sipCarriers.length === 0,
    });

    setName("");
    setApiKey("");
    setModalOpen(false);
  };

  const handleAssignCarrierToTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTenantId || !selectedCarrierName) return;

    const tenant = tenants.find((t) => t.id === assignTenantId);
    if (!tenant) return;

    updateTenantQuotas(
      tenant.id,
      tenant.maxConcurrency,
      selectedCarrierName,
      tenant.creditRatePerMinute
    );

    setAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">SIP Carrier Networks & Routing</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5]">
                {sipCarriers.length} Carriers Connected
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Configure global Tier-1 SIP trunking backbones (Telnyx, Twilio, Bandwidth, Custom FreeSWITCH/Kamailio SBCs) and allocate carrier networks to tenant admins.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAssignModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5] rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Assign Network to Tenant</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect SIP Carrier</span>
          </button>
        </div>
      </div>

      {/* 2. Global Capacity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Total SIP Capacity</span>
          <div className="text-2xl font-black text-[#0F172A]">
            {sipCarriers.reduce((a, c) => a + c.maxChannels, 0).toLocaleString()} Channels
          </div>
          <span className="text-xs text-[#3157D5] font-bold">
            {sipCarriers.length > 0 ? "100% Zero-Loss Trunk Pool" : "0% Trunk Pool Idle"}
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Active Allocated Lines</span>
          <div className="text-2xl font-black text-[#0F172A]">
            {sipCarriers.reduce((a, c) => a + c.allocatedChannels, 0).toLocaleString()} Channels
          </div>
          <span className="text-xs text-[#64748B]">Assigned across active tenants</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Avg Wholesale Cost</span>
          <div className="text-2xl font-black text-[#3157D5] font-mono">
            ${sipCarriers.length > 0 ? (sipCarriers.reduce((a, c) => a + (c.ratePerMinuteWholesale || 0), 0) / sipCarriers.length).toFixed(4) : "0.0000"} / min
          </div>
          <span className="text-xs text-emerald-600 font-bold">
            {sipCarriers.length > 0 ? "Gross Margin: ~95.7%" : "Gross Margin: 0.0%"}
          </span>
        </div>
      </div>

      {/* 3. Carrier Networks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sipCarriers.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-3xl border border-[#E2E8F0] text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0F172A]">No SIP Carriers Connected</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Connect your Telnyx, Twilio, Bandwidth, or Private Kamailio/FreeSWITCH SBC SIP trunks to start routing live voice calls.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Connect SIP Carrier</span>
            </button>
          </div>
        ) : (
          sipCarriers.map((carrier) => {
            const isTelnyx = carrier.carrier === "telnyx";
            const isCustomSbc = carrier.carrier === "custom_sbc";
            const assignedTenants = tenants.filter((t) => t.assignedSipCarrier === carrier.name);

            return (
              <div
                key={carrier.id}
                className={`p-6 bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                  carrier.isDefaultCarrier ? "border-[#3157D5] ring-2 ring-[#3157D5]/30" : "border-[#E2E8F0] hover:border-[#3157D5]/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-xs">
                        {isCustomSbc ? <Server className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#0F172A]">{carrier.name}</h3>
                          {carrier.isDefaultCarrier && (
                            <span className="text-[9px] font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] font-mono mt-0.5">
                          {carrier.sipServer}:{carrier.port} ({carrier.transport})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FD] text-[#3157D5]">
                        ● {carrier.status}
                      </span>
                      <button
                        onClick={() => handleOpenEditModal(carrier)}
                        className="p-1 text-[#64748B] hover:text-[#3157D5] hover:bg-[#EEF2FD] rounded-lg transition-colors"
                        title="Edit Carrier Trunk"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSipCarrier(carrier.id)}
                        className="p-1 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Carrier Trunk from Database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Capacity Progress */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#64748B]">Capacity Load:</span>
                      <span className="font-bold text-[#0F172A] font-mono">
                        {carrier.allocatedChannels} / {carrier.maxChannels} channels ({carrier.maxChannels > 0 ? Math.round((carrier.allocatedChannels / carrier.maxChannels) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#3157D5] h-full rounded-full"
                        style={{ width: `${carrier.maxChannels > 0 ? (carrier.allocatedChannels / carrier.maxChannels) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Detailed Config Matrix */}
                  <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Wholesale Carrier Rate:</span>
                      <span className="font-mono font-bold text-[#0F172A]">${carrier.ratePerMinuteWholesale} / min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Codec Priority:</span>
                      <span className="font-mono text-[#3157D5] font-semibold">{carrier.codecPriority?.join(" → ") || "Opus"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">POP Edge Regions:</span>
                      <span className="font-semibold text-[#0F172A] truncate max-w-[200px]">
                        {carrier.popRegions?.join(", ") || "Global"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Assigned Tenants:</span>
                      <span className="font-bold text-[#0F172A]">{assignedTenants.length} Tenant Orgs</span>
                    </div>
                    {carrier.apiKey && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#EDF2F7]">
                        <span className="text-[#64748B]">Auth API Key:</span>
                        <span className="font-mono text-[#0F172A] bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                          {carrier.apiKey.length > 8 ? `${carrier.apiKey.substring(0, 4)}••••••••` : "••••••••"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#EDF2F7] flex items-center justify-between gap-2">
                  {!carrier.isDefaultCarrier ? (
                    <button
                      onClick={() => setDefaultCarrier(carrier.id)}
                      className="flex-1 py-2 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5] rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      Set as Primary Platform Trunk
                    </button>
                  ) : (
                    <span className="text-xs text-[#3157D5] font-bold py-2 w-full text-center bg-[#EEF2FD] rounded-xl">
                      Primary Global Gateway Active
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Connect Carrier Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Connect SIP Carrier Network</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCarrier} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Carrier Network Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bandwidth.com High-Throughput Trunk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Carrier Provider</label>
                  <select
                    value={carrier}
                    onChange={(e: any) => setCarrier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <option value="telnyx">Telnyx Elastic SIP</option>
                    <option value="twilio">Twilio Elastic SIP</option>
                    <option value="bandwidth">Bandwidth.com Voice</option>
                    <option value="thinq">Commio / Thin-Q</option>
                    <option value="custom_sbc">Private Custom SBC (FreeSWITCH/Kamailio)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Signaling Transport</label>
                  <select
                    value={transport}
                    onChange={(e: any) => setTransport(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <option value="TLS">TLS Encrypted (Port 5061)</option>
                    <option value="UDP">UDP Standard (Port 5060)</option>
                    <option value="TCP">TCP Stream</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-[#0F172A] block mb-1">SIP Server Host / FQDN</label>
                  <input
                    type="text"
                    required
                    placeholder="sip.carrier.com"
                    value={sipServer}
                    onChange={(e) => setSipServer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">SIP Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">API Key / Auth Token / Secret</label>
                <input
                  type="password"
                  placeholder="e.g. KEY_************************"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Max SIP Concurrent Lines</label>
                  <input
                    type="number"
                    value={maxChannels}
                    onChange={(e) => setMaxChannels(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Wholesale Cost ($/min)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={wholesaleRate}
                    onChange={(e) => setWholesaleRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
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
                  Connect & Test Handshake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.5. Edit Carrier Modal */}
      {editModalOpen && editingCarrier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Edit SIP Carrier Trunk</h3>
              </div>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingCarrier(null);
                }}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCarrier} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Carrier Network Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Carrier Provider</label>
                  <select
                    value={editCarrier}
                    onChange={(e) => setEditCarrier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <option value="telnyx">Telnyx (Tier-1)</option>
                    <option value="twilio">Twilio Elastic SIP</option>
                    <option value="bandwidth">Bandwidth.com</option>
                    <option value="thinq">ThinQ / Commio</option>
                    <option value="custom_sbc">Custom FreeSWITCH / Kamailio</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <option value="online">Online (Active)</option>
                    <option value="degraded">Degraded (Warning)</option>
                    <option value="offline">Offline (Standby)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Signaling Transport</label>
                  <select
                    value={editTransport}
                    onChange={(e) => setEditTransport(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                  >
                    <option value="TLS">TLS Encrypted (Port 5061)</option>
                    <option value="UDP">UDP Standard (Port 5060)</option>
                    <option value="TCP">TCP Stream</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-[#0F172A] block mb-1">SIP Server Host / FQDN</label>
                  <input
                    type="text"
                    required
                    value={editSipServer}
                    onChange={(e) => setEditSipServer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">SIP Port</label>
                  <input
                    type="number"
                    value={editPort}
                    onChange={(e) => setEditPort(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">API Key / Auth Token / Secret</label>
                <input
                  type="password"
                  placeholder="e.g. KEY_************************"
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Max SIP Concurrent Lines</label>
                  <input
                    type="number"
                    value={editMaxChannels}
                    onChange={(e) => setEditMaxChannels(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Wholesale Cost ($/min)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editWholesaleRate}
                    onChange={(e) => setEditWholesaleRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingCarrier(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-colors"
                >
                  Save Changes to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Assign Carrier to Tenant Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Assign Carrier to Tenant</h3>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignCarrierToTenant} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Target Tenant Admin</label>
                <select
                  value={assignTenantId}
                  onChange={(e) => setAssignTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.orgName} (Current Carrier: {t.assignedSipCarrier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">New SIP Carrier Network</label>
                <select
                  value={selectedCarrierName}
                  onChange={(e) => setSelectedCarrierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  {sipCarriers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.popRegions[0]})
                    </option>
                  ))}
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
                  Assign Routing Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
