"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import {
  Globe,
  Plus,
  X,
  Check,
  Copy,
  Trash2,
  PhoneCall,
  BarChart3,
  ChevronDown,
  ExternalLink,
  Code2,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

export default function WebsiteWidgetsPage() {
  const {
    websiteWidgets,
    addWebsiteWidget,
    deleteWebsiteWidget,
    agents,
    addToast,
  } = useAppStore();

  const [widgetViewSubTab, setWidgetViewSubTab] = useState<"widgets" | "analytics">("widgets");
  const [isCreateWidgetModalOpen, setIsCreateWidgetModalOpen] = useState(false);
  const [widgetActiveTab, setWidgetActiveTab] = useState<"general" | "branding" | "settings">("settings");
  const [widgetName, setWidgetName] = useState("Website Voice Widget");
  const [widgetAgentId, setWidgetAgentId] = useState(agents[0]?.id || "agent-1");
  const [widgetGreeting, setWidgetGreeting] = useState("Hi! Welcome to our website. How can I help you today?");
  const [widgetLanguage, setWidgetLanguage] = useState("English (US)");
  const [widgetDomainInput, setWidgetDomainInput] = useState("example.com");
  const [widgetDomains, setWidgetDomains] = useState<string[]>(["example.com"]);
  const [widgetBusinessHours, setWidgetBusinessHours] = useState(false);
  const [widgetAdvancedOpen, setWidgetAdvancedOpen] = useState(false);
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState("#172033");
  const [widgetButtonLabel, setWidgetButtonLabel] = useState("VOICE CHAT");
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [widgetAvatarLabel, setWidgetAvatarLabel] = useState("Agent AI");
  const [isCopied, setIsCopied] = useState(false);
  const [deleteModalWidget, setDeleteModalWidget] = useState<any | null>(null);

  const handleAddDomain = () => {
    if (!widgetDomainInput.trim()) return;
    const clean = widgetDomainInput.trim().toLowerCase();
    if (!widgetDomains.includes(clean)) {
      setWidgetDomains((prev) => [...prev, clean]);
    }
    setWidgetDomainInput("");
  };

  const handleRemoveDomain = (d: string) => {
    setWidgetDomains((prev) => prev.filter((item) => item !== d));
  };

  const handleCopySnippet = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    addToast({
      title: "Snippet Copied",
      description: "Widget script snippet copied to clipboard.",
      type: "success",
    });
  };

  const handleSaveWidget = () => {
    const selectedAgent = agents.find((a) => a.id === widgetAgentId) || agents[0];
    addWebsiteWidget({
      name: widgetName.trim() || "Website Voice Assistant",
      agentId: widgetAgentId,
      agentName: selectedAgent?.name || "Marcus (Solar Advisor)",
      allowedDomains: widgetDomains.length > 0 ? widgetDomains : ["*"],
      businessHoursEnabled: widgetBusinessHours,
      primaryColor: widgetPrimaryColor,
      buttonLabel: widgetButtonLabel.trim() || "VOICE CHAT",
      position: widgetPosition,
      avatarLabel: widgetAvatarLabel.trim() || "Agent AI",
      greetingText: widgetGreeting,
      status: "active",
    });
    setIsCreateWidgetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Exact Match to Screenshot 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0F172A]">Website Widgets</h1>
            <span className="w-4 h-4 rounded-full border border-[#94A3B8] text-[#94A3B8] text-[10px] flex items-center justify-center font-serif">
              i
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create embeddable voice widgets for your websites
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#64748B] font-medium">
            {websiteWidgets.length}/1 widgets
          </span>
          <button
            type="button"
            onClick={() => setIsCreateWidgetModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Widget</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-tabs (Widgets / Analytics) */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <button
          type="button"
          onClick={() => setWidgetViewSubTab("widgets")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            widgetViewSubTab === "widgets"
              ? "bg-[#EEF2FD] text-[#3157D5] border-b-2 border-[#3157D5]"
              : "text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0]"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Widgets</span>
        </button>
        <button
          type="button"
          onClick={() => setWidgetViewSubTab("analytics")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            widgetViewSubTab === "analytics"
              ? "bg-[#EEF2FD] text-[#3157D5] border-b-2 border-[#3157D5]"
              : "text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0]"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>
      </div>

      {/* 3. SubTab 1: Widgets List / Empty State */}
      {widgetViewSubTab === "widgets" && (
        <div>
          {websiteWidgets.length === 0 ? (
            /* Empty State Card (Exact Match to Screenshot 2) */
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-16 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#475569] flex items-center justify-center shadow-xs">
                <Globe className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[#0F172A]">No widgets yet</h2>
                <p className="text-xs text-[#64748B] max-w-sm">
                  Create your first website widget to enable voice conversations on your website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateWidgetModalOpen(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Widget</span>
              </button>
            </div>
          ) : (
            /* Active Widgets Card List */
            <div className="space-y-4">
              {websiteWidgets.map((w) => (
                <div
                  key={w.id}
                  className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold shadow-xs"
                        style={{ backgroundColor: w.primaryColor || "#172033" }}
                      >
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0F172A]">{w.name}</h3>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                            ● Live & Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          Voice Agent: <strong>{w.agentName}</strong> • Domains: {w.allowedDomains.join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteModalWidget(w)}
                        className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Widget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Embed Snippet Box */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#0F172A]">Embed Snippet (HTML):</label>
                    <div className="p-3.5 bg-[#0F172A] text-white rounded-2xl font-mono text-xs overflow-x-auto relative flex items-center justify-between">
                      <code className="text-[#93C5FD]">
                        {`<script src="https://cdn.apexvoice.ai/widget.js" data-widget-id="${w.id}" data-color="${w.primaryColor}" async></script>`}
                      </code>
                      <button
                        onClick={() => handleCopySnippet(`<script src="https://cdn.apexvoice.ai/widget.js" data-widget-id="${w.id}" data-color="${w.primaryColor}" async></script>`)}
                        className="px-3 py-1.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs shrink-0 ml-3 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? "Copied" : "Copy Code"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Analytics */}
      {widgetViewSubTab === "analytics" && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
            <span className="text-[10px] font-bold uppercase text-[#64748B]">Widget Impressions</span>
            <div className="text-2xl font-black text-[#0F172A] mt-1">1,420</div>
            <span className="text-[10px] font-bold text-emerald-600">+18% this week</span>
          </div>
          <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
            <span className="text-[10px] font-bold uppercase text-[#64748B]">Voice Sessions</span>
            <div className="text-2xl font-black text-[#0F172A] mt-1">384</div>
            <span className="text-[10px] font-bold text-emerald-600">27.0% Engagement</span>
          </div>
          <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
            <span className="text-[10px] font-bold uppercase text-[#64748B]">Avg Call Duration</span>
            <div className="text-2xl font-black text-[#0F172A] mt-1">2m 14s</div>
            <span className="text-[10px] font-bold text-[#3157D5]">High Retention</span>
          </div>
          <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
            <span className="text-[10px] font-bold uppercase text-[#64748B]">Qualified Leads</span>
            <div className="text-2xl font-black text-[#0F172A] mt-1">142</div>
            <span className="text-[10px] font-bold text-emerald-600">36.9% Booked</span>
          </div>
        </div>
      )}

      {/* 4. Create Widget Modal (Exact Match to Screenshot 1) */}
      {isCreateWidgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-4xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[92vh] overflow-y-auto text-xs text-[#0F172A]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Create Widget</h3>
                <p className="text-xs text-[#64748B]">Configure your new website voice widget</p>
              </div>
              <button
                onClick={() => setIsCreateWidgetModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Buttons (General, Branding, Settings) */}
            <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0] max-w-md">
              <button
                type="button"
                onClick={() => setWidgetActiveTab("general")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  widgetActiveTab === "general"
                    ? "bg-[#3157D5] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setWidgetActiveTab("branding")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  widgetActiveTab === "branding"
                    ? "bg-[#3157D5] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Branding
              </button>
              <button
                type="button"
                onClick={() => setWidgetActiveTab("settings")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  widgetActiveTab === "settings"
                    ? "bg-[#3157D5] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Settings
              </button>
            </div>

            {/* Two-Column Grid: Config Form (Left) & Preview Mockup (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Column - Configuration Form */}
              <div className="space-y-4">
                {/* TAB 1: SETTINGS (Matching Screenshot 1) */}
                {widgetActiveTab === "settings" && (
                  <div className="space-y-4">
                    {/* Allowed Domains */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-xs text-[#0F172A] block">
                        Allowed Domains
                      </label>
                      <p className="text-[11px] text-[#64748B]">
                        Restrict where the widget can be embedded (leave empty for any domain)
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={widgetDomainInput}
                          onChange={(e) => setWidgetDomainInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddDomain();
                            }
                          }}
                          placeholder="example.com"
                          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#3157D5]"
                        />
                        <button
                          type="button"
                          onClick={handleAddDomain}
                          className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0"
                        >
                          Add
                        </button>
                      </div>

                      {/* Domain Chips List */}
                      {widgetDomains.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {widgetDomains.map((d) => (
                            <span
                              key={d}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EEF2FD] border border-[#3157D5]/20 text-[#3157D5] rounded-lg text-[11px] font-bold"
                            >
                              <span>{d}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDomain(d)}
                                className="hover:text-rose-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Business Hours Card (Matching Screenshot 1) */}
                    <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-xs text-[#0F172A] block">
                          Business Hours
                        </span>
                        <p className="text-[11px] text-[#64748B]">
                          Restrict availability to specific hours
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widgetBusinessHours}
                          onChange={(e) => setWidgetBusinessHours(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CBD5E1] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3157D5]"></div>
                      </label>
                    </div>

                    {/* Advanced Settings Accordion */}
                    <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setWidgetAdvancedOpen((prev) => !prev)}
                        className="w-full p-3.5 flex items-center justify-between font-bold text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        <span>Advanced Settings</span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#64748B] transition-transform ${
                            widgetAdvancedOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {widgetAdvancedOpen && (
                        <div className="p-3.5 pt-0 space-y-3 text-[11px] border-t border-[#F1F5F9]">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span>Auto-record audio sessions</span>
                            <input type="checkbox" defaultChecked className="rounded text-[#3157D5]" />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span>Popup welcome speech delay (2 seconds)</span>
                            <input type="checkbox" defaultChecked className="rounded text-[#3157D5]" />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: GENERAL */}
                {widgetActiveTab === "general" && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-xs text-[#0F172A] block mb-1">
                        Widget Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={widgetName}
                        onChange={(e) => setWidgetName(e.target.value)}
                        placeholder="e.g. Website Voice Assistant"
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs outline-none focus:border-[#3157D5]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-xs text-[#0F172A] block mb-1">
                        Assigned Voice Agent <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={widgetAgentId}
                        onChange={(e) => setWidgetAgentId(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs outline-none focus:border-[#3157D5]"
                      >
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name} ({ag.description || "Voice SDR"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-xs text-[#0F172A] block mb-1">
                        Initial Greeting Message
                      </label>
                      <textarea
                        rows={2}
                        value={widgetGreeting}
                        onChange={(e) => setWidgetGreeting(e.target.value)}
                        placeholder="Greeting speech spoken when user clicks widget"
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs outline-none focus:border-[#3157D5]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-xs text-[#0F172A] block mb-1">
                        Language
                      </label>
                      <select
                        value={widgetLanguage}
                        onChange={(e) => setWidgetLanguage(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs outline-none focus:border-[#3157D5]"
                      >
                        <option value="English (US)">English (US)</option>
                        <option value="German (Deutsch)">German (Deutsch)</option>
                        <option value="Spanish (Español)">Spanish (Español)</option>
                        <option value="French (Français)">French (Français)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 3: BRANDING */}
                {widgetActiveTab === "branding" && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-xs text-[#0F172A] block mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={widgetButtonLabel}
                        onChange={(e) => setWidgetButtonLabel(e.target.value)}
                        placeholder="VOICE CHAT"
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold outline-none focus:border-[#3157D5]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-xs text-[#0F172A] block mb-1">
                        Primary Color Theme
                      </label>
                      <div className="flex items-center gap-2">
                        {["#172033", "#3157D5", "#10B981", "#8B5CF6", "#EA580C"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setWidgetPrimaryColor(c)}
                            className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                              widgetPrimaryColor === c ? "border-black scale-115 shadow-md" : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="text"
                          value={widgetPrimaryColor}
                          onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                          className="w-24 px-2 py-1 bg-white border border-[#CBD5E1] rounded-lg font-mono text-xs text-center ml-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-xs text-[#0F172A] block mb-1">
                        Widget Position
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setWidgetPosition("bottom-right")}
                          className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                            widgetPosition === "bottom-right"
                              ? "bg-[#EEF2FD] border-[#3157D5] text-[#3157D5]"
                              : "bg-white border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >
                          Bottom Right
                        </button>
                        <button
                          type="button"
                          onClick={() => setWidgetPosition("bottom-left")}
                          className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                            widgetPosition === "bottom-left"
                              ? "bg-[#EEF2FD] border-[#3157D5] text-[#3157D5]"
                              : "bg-white border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >
                          Bottom Left
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-xs text-[#0F172A] block mb-1">
                        Avatar / Tag Label
                      </label>
                      <input
                        type="text"
                        value={widgetAvatarLabel}
                        onChange={(e) => setWidgetAvatarLabel(e.target.value)}
                        placeholder="Agent AI"
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs outline-none focus:border-[#3157D5]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Live Browser Preview (Matching Screenshot 1) */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-[#0F172A] block">Preview</span>
                {/* Browser Mockup Container */}
                <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm flex flex-col h-[340px] relative">
                  {/* Browser Chrome Header */}
                  <div className="px-3 py-2 bg-white border-b border-[#E2E8F0] flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    {/* URL Bar */}
                    <div className="flex-1 mx-3 px-2 py-0.5 bg-[#F1F5F9] rounded-lg text-[10px] text-[#64748B] font-mono flex items-center justify-center gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      <span>{widgetDomains[0] || "example.com"}</span>
                    </div>
                  </div>

                  {/* Mock Webpage Body */}
                  <div className="p-4 flex-1 relative bg-radial from-[#F8FAFC] to-[#F1F5F9] space-y-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#E2E8F0] rounded-full text-[9px] font-bold text-[#64748B] shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Interactive Demo
                    </span>

                    {/* Skeleton Wireframe Elements */}
                    <div className="w-3/4 h-3 bg-[#E2E8F0] rounded-md" />
                    <div className="w-1/2 h-2 bg-[#E2E8F0]/70 rounded-md" />
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="h-14 bg-white rounded-xl border border-[#E2E8F0]/80" />
                      <div className="h-14 bg-white rounded-xl border border-[#E2E8F0]/80" />
                      <div className="h-14 bg-white rounded-xl border border-[#E2E8F0]/80" />
                    </div>

                    {/* Floating Voice Chat Widget (Exact Match to Screenshot 1) */}
                    <div
                      className={`absolute bottom-3 ${
                        widgetPosition === "bottom-left" ? "left-3" : "right-3"
                      } animate-in fade-in zoom-in-90 duration-200`}
                    >
                      <div className="p-2.5 bg-white/95 backdrop-blur-xs rounded-2xl border border-[#CBD5E1] shadow-xl flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <div className="w-9 h-9 rounded-full bg-[#EEF2FD] border border-[#3157D5]/20 flex items-center justify-center text-[#3157D5] shadow-xs">
                            <PhoneCall className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-bold text-[#3157D5] mt-0.5">
                            {widgetAvatarLabel}
                          </span>
                        </div>

                        {/* Dark/Branded Pill Button */}
                        <button
                          type="button"
                          className="flex items-center gap-2 px-3.5 py-2 text-white rounded-2xl text-[11px] font-extrabold shadow-md cursor-pointer transition-transform hover:scale-105"
                          style={{ backgroundColor: widgetPrimaryColor }}
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{widgetButtonLabel}</span>
                          <span className="text-[9px] text-white/80 font-normal pl-1 border-l border-white/20">
                            US ⌄
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsCreateWidgetModalOpen(false)}
                className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWidget}
                className="px-5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 cursor-pointer"
              >
                Create Widget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalWidget}
        onClose={() => setDeleteModalWidget(null)}
        onConfirm={async () => {
          if (deleteModalWidget) {
            await deleteWebsiteWidget(deleteModalWidget.id);
          }
        }}
        itemName={deleteModalWidget?.name}
        itemType="Website Voice Widget"
      />
    </div>
  );
}
