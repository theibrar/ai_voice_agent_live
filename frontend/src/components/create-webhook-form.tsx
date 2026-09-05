"use client";

import React, { useState } from "react";
import {
  Webhook,
  CheckCircle2,
  X,
  Send,
  RefreshCw,
  Sparkles,
  Check,
  ShieldCheck,
  Sliders,
  Filter,
  Key,
  Layers,
  PhoneCall,
  PhoneIncoming,
  Megaphone,
  Workflow,
  Calendar,
  FileText,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

export interface WebhookEventItem {
  id: string;
  name: string;
  description: string;
}

export interface WebhookEventCategory {
  id: string;
  title: string;
  count: number;
  icon: React.ElementType;
  events: WebhookEventItem[];
}

export const WEBHOOK_CATEGORIES: WebhookEventCategory[] = [
  {
    id: "outbound_call",
    title: "Outbound Call Events",
    count: 9,
    icon: PhoneCall,
    events: [
      { id: "call.started", name: "Call Started", description: "When an outbound call begins" },
      { id: "call.ringing", name: "Call Ringing", description: "When the phone starts ringing" },
      { id: "call.answered", name: "Call Answered", description: "When the recipient answers the call" },
      { id: "call.completed", name: "Call Completed", description: "When a call ends successfully" },
      { id: "call.failed", name: "Call Failed", description: "When a call fails or errors out" },
      { id: "call.transferred", name: "Call Transferred", description: "When a call is transferred to another number" },
      { id: "call.no_answer", name: "No Answer", description: "When the recipient doesn't answer" },
      { id: "call.busy", name: "Line Busy", description: "When the recipient's line is busy" },
      { id: "call.voicemail", name: "Voicemail", description: "When the call goes to voicemail" },
    ],
  },
  {
    id: "inbound_call",
    title: "Inbound Call Events",
    count: 4,
    icon: PhoneIncoming,
    events: [
      { id: "inbound.call.received", name: "Inbound Call Received", description: "When an incoming call is received" },
      { id: "inbound.call.answered", name: "Inbound Call Answered", description: "When an incoming call is answered by AI" },
      { id: "inbound.call.completed", name: "Inbound Call Completed", description: "When an incoming call ends successfully" },
      { id: "inbound.call.missed", name: "Inbound Call Missed", description: "When an incoming call is not answered" },
    ],
  },
  {
    id: "campaign",
    title: "Campaign Events",
    count: 6,
    icon: Megaphone,
    events: [
      { id: "campaign.started", name: "Campaign Started", description: "When a campaign begins running" },
      { id: "campaign.paused", name: "Campaign Paused", description: "When a campaign is paused" },
      { id: "campaign.resumed", name: "Campaign Resumed", description: "When a paused campaign is resumed" },
      { id: "campaign.completed", name: "Campaign Completed", description: "When a campaign finishes successfully" },
      { id: "campaign.failed", name: "Campaign Failed", description: "When a campaign encounters an error" },
      { id: "campaign.cancelled", name: "Campaign Cancelled", description: "When a campaign is cancelled by user" },
    ],
  },
  {
    id: "flow",
    title: "Flow Events",
    count: 3,
    icon: Workflow,
    events: [
      { id: "flow.started", name: "Flow Started", description: "When a conversation flow begins" },
      { id: "flow.completed", name: "Flow Completed", description: "When a conversation flow finishes" },
      { id: "flow.failed", name: "Flow Failed", description: "When a conversation flow encounters an error" },
    ],
  },
  {
    id: "appointment",
    title: "Appointment Events",
    count: 6,
    icon: Calendar,
    events: [
      { id: "appointment.booked", name: "Appointment Booked", description: "When an appointment is scheduled" },
      { id: "appointment.confirmed", name: "Appointment Confirmed", description: "When an appointment is confirmed" },
      { id: "appointment.cancelled", name: "Appointment Cancelled", description: "When an appointment is cancelled" },
      { id: "appointment.rescheduled", name: "Appointment Rescheduled", description: "When an appointment is rescheduled" },
      { id: "appointment.completed", name: "Appointment Completed", description: "When an appointment is marked complete" },
      { id: "appointment.no_show", name: "Appointment No-Show", description: "When the customer doesn't attend" },
    ],
  },
  {
    id: "form",
    title: "Form Events",
    count: 2,
    icon: FileText,
    events: [
      { id: "form.submitted", name: "Form Submitted", description: "When a form is submitted" },
      { id: "lead.created", name: "Lead Created", description: "When a new lead is created from a form" },
    ],
  },
];

interface CreateWebhookFormProps {
  onSuccess?: (newWebhook: any) => void;
  onCancel?: () => void;
}

export function CreateWebhookForm({ onSuccess, onCancel }: CreateWebhookFormProps) {
  const { addToast, campaigns, addWebhook } = useAppStore();

  const [webhookName, setWebhookName] = useState("My CRM Integration");
  const [endpointUrl, setEndpointUrl] = useState("https://api.example.com/webhooks");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "call.started",
    "call.answered",
    "call.completed",
    "appointment.booked",
    "lead.created",
  ]);

  // Filters & Auth
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [authType, setAuthType] = useState<"none" | "bearer" | "api_key" | "hmac">("none");
  const [authToken, setAuthToken] = useState("");
  const [authHeader, setAuthHeader] = useState("X-API-Key");
  const [signingSecret, setSigningSecret] = useState(`whsec_live_${Math.random().toString(36).substring(2, 10)}`);

  // Global Select All / Clear
  const allEventIds = WEBHOOK_CATEGORIES.flatMap((c) => c.events.map((e) => e.id));

  const handleSelectAllGlobal = () => {
    setSelectedEvents(allEventIds);
  };

  const handleClearAllGlobal = () => {
    setSelectedEvents([]);
  };

  const handleSelectCategoryAll = (catEvents: WebhookEventItem[]) => {
    const ids = catEvents.map((e) => e.id);
    setSelectedEvents((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearCategory = (catEvents: WebhookEventItem[]) => {
    const ids = new Set(catEvents.map((e) => e.id));
    setSelectedEvents((prev) => prev.filter((id) => !ids.has(id)));
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleCategory = (catEvents: WebhookEventItem[]) => {
    const catEventIds = catEvents.map((e) => e.id);
    const allSelected = catEventIds.every((id) => selectedEvents.includes(id));

    if (allSelected) {
      setSelectedEvents((prev) => prev.filter((id) => !catEventIds.includes(id)));
    } else {
      setSelectedEvents((prev) => Array.from(new Set([...prev, ...catEventIds])));
    }
  };

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!webhookName.trim()) {
      addToast({ title: "Validation Error", description: "Webhook name is required.", type: "warning" });
      return;
    }
    if (!endpointUrl.trim() || !endpointUrl.startsWith("http")) {
      addToast({ title: "Validation Error", description: "A valid HTTP/HTTPS endpoint URL is required.", type: "warning" });
      return;
    }
    if (selectedEvents.length === 0) {
      addToast({ title: "Validation Error", description: "Select at least one event trigger.", type: "warning" });
      return;
    }

    const newWebhook = {
      name: webhookName.trim(),
      url: endpointUrl.trim(),
      events: selectedEvents,
      secret: signingSecret,
      status: "active",
    };

    await addWebhook(newWebhook);

    addToast({
      title: "Webhook Saved to Database",
      description: `Registered '${webhookName}' with ${selectedEvents.length} event subscriptions in PostgreSQL.`,
      type: "success",
    });

    if (onSuccess) {
      onSuccess(newWebhook);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs text-[#0F172A]">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#0F172A]">Create Webhook</h2>
        <p className="text-xs text-[#64748B]">Configure a webhook endpoint to receive event notifications.</p>
      </div>

      {/* Webhook Name & Endpoint URL */}
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-[#0F172A] mb-1.5">
            Webhook Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="My CRM Integration"
            value={webhookName}
            onChange={(e) => setWebhookName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] outline-none focus:border-[#3157D5] shadow-2xs"
          />
        </div>

        <div>
          <label className="block font-bold text-[#0F172A] mb-1.5">
            Endpoint URL <span className="text-rose-500">*</span>
          </label>
          <input
            type="url"
            required
            placeholder="https://api.example.com/webhooks"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl font-mono text-xs text-[#0F172A] outline-none focus:border-[#3157D5] shadow-2xs"
          />
        </div>
      </div>

      {/* Event Subscriptions Header with Select All / Clear */}
      <div className="space-y-4 pt-2 border-t border-[#EDF2F7]">
        <div className="flex items-center justify-between">
          <div>
            <label className="block font-bold text-[#0F172A] text-sm">
              Event Subscriptions <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-[#64748B]">
              {selectedEvents.length} of {allEventIds.length} events selected
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllGlobal}
              className="text-xs font-bold text-[#3157D5] hover:underline cursor-pointer"
            >
              Select All
            </button>
            <span className="text-[#CBD5E1]">•</span>
            <button
              type="button"
              onClick={handleClearAllGlobal}
              className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Categories Grid / Stack */}
        <div className="space-y-5">
          {WEBHOOK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const catEventIds = cat.events.map((e) => e.id);
            const isCatAllSelected = catEventIds.every((id) => selectedEvents.includes(id));
            const selectedInCatCount = catEventIds.filter((id) => selectedEvents.includes(id)).length;

            return (
              <div
                key={cat.id}
                className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#3157D5]">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-[#0F172A] text-xs">{cat.title}</span>
                    <span className="text-[11px] font-bold text-[#64748B]">({cat.count})</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSelectCategoryAll(cat.events)}
                      className="font-bold text-[#3157D5] hover:underline cursor-pointer"
                    >
                      All
                    </button>
                    <span className="text-[#CBD5E1]">•</span>
                    <button
                      type="button"
                      onClick={() => handleClearCategory(cat.events)}
                      className="font-bold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Category Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {cat.events.map((ev) => {
                    const isChecked = selectedEvents.includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        onClick={() => toggleEvent(ev.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-white border-[#3157D5] shadow-xs ring-1 ring-[#3157D5]/20"
                            : "bg-white/80 border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                            isChecked ? "bg-[#3157D5] border-[#3157D5] text-white" : "border-[#CBD5E1] bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0F172A] leading-tight text-xs">{ev.name}</p>
                          <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">{ev.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Filter (Optional) */}
      <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#3157D5]" />
            <span className="font-bold text-[#0F172A]">Campaign Filter</span>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0]">
            Optional
          </span>
        </div>
        <p className="text-[11px] text-[#64748B]">
          Filter event dispatches to a specific campaign or receive events from all active campaigns.
        </p>
        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl font-medium text-xs text-[#0F172A] outline-none focus:border-[#3157D5] cursor-pointer"
        >
          <option value="all">Receiving events from all campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>
      </div>

      {/* Authentication (Optional) */}
      <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#3157D5]" />
            <span className="font-bold text-[#0F172A]">Authentication</span>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0]">
            Optional
          </span>
        </div>
        <p className="text-[11px] text-[#64748B]">
          Configure authorization headers or payload signatures to verify webhook authenticity.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "none", label: "No authentication configured" },
            { id: "hmac", label: "HMAC SHA256 Signature" },
            { id: "bearer", label: "Bearer Token" },
            { id: "api_key", label: "Custom Header API Key" },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setAuthType(type.id as any)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                authType === type.id
                  ? "bg-[#3157D5] text-white font-bold border-[#3157D5] shadow-xs"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]"
              }`}
            >
              <span className="block text-[11px] font-bold">{type.label}</span>
            </button>
          ))}
        </div>

        {authType === "hmac" && (
          <div className="space-y-1.5 pt-2">
            <label className="font-bold text-[#0F172A] block">Signing Secret Key (X-Apex-Signature)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={signingSecret}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl font-mono text-xs text-[#0F172A]"
              />
              <button
                type="button"
                onClick={() => setSigningSecret(`whsec_live_${Math.random().toString(36).substring(2, 12)}`)}
                className="px-3 py-2 bg-white border border-[#E2E8F0] hover:bg-[#EEF2FD] text-[#3157D5] rounded-xl font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        )}

        {authType === "bearer" && (
          <div className="space-y-1.5 pt-2">
            <label className="font-bold text-[#0F172A] block">Bearer Token (Authorization: Bearer ...)</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl font-mono text-xs text-[#0F172A]"
            />
          </div>
        )}

        {authType === "api_key" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="font-bold text-[#0F172A] block mb-1">Header Name</label>
              <input
                type="text"
                placeholder="X-API-Key"
                value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl font-mono text-xs text-[#0F172A]"
              />
            </div>
            <div>
              <label className="font-bold text-[#0F172A] block mb-1">API Key Value</label>
              <input
                type="password"
                placeholder="api_key_••••••••"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl font-mono text-xs text-[#0F172A]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDF2F7]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white font-bold rounded-xl shadow-md shadow-[#3157D5]/25 transition-all cursor-pointer flex items-center gap-2"
        >
          <Webhook className="w-4 h-4" />
          <span>Create Webhook</span>
        </button>
      </div>
    </form>
  );
}
