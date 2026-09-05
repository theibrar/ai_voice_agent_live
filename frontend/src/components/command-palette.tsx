"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  Search,
  Bot,
  Megaphone,
  PhoneCall,
  Users,
  Calendar,
  BookOpen,
  History,
  BarChart3,
  Coins,
  Settings,
  Workflow,
  Sparkles,
  ArrowRight,
  Scale,
  Headphones,
  Voicemail,
  Layers,
  Wrench,
  FileSpreadsheet,
  CheckCircle2,
  Radio,
  X,
  Phone,
  Clock,
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    agents,
    campaigns,
    calls,
    contacts,
    appointments,
  } = useAppStore();
  const [query, setQuery] = useState("");

  if (!commandPaletteOpen) return null;

  const quickLinks = [
    { label: "Overview Dashboard", href: "/dashboard", icon: BarChart3, category: "Navigation" },
    { label: "Live Calls Monitor", href: "/live-calls", icon: PhoneCall, category: "Navigation" },
    { label: "Live Supervisor Cockpit", href: "/supervisor", icon: Headphones, category: "Navigation" },
    { label: "AI Voice Agents", href: "/agents", icon: Bot, category: "Navigation" },
    { label: "Create New Voice Agent", href: "/agents/new", icon: Sparkles, category: "Action" },
    { label: "Visual Flow Builder", href: "/flow-builder", icon: Workflow, category: "Navigation" },
    { label: "Outbound Voice Campaigns", href: "/campaigns", icon: Megaphone, category: "Navigation" },
    { label: "Create Outbound Campaign", href: "/campaigns/new", icon: Sparkles, category: "Action" },
    { label: "Contacts & Leads CRM", href: "/contacts", icon: Users, category: "Navigation" },
    { label: "Calendar & Appointments", href: "/appointments", icon: Calendar, category: "Navigation" },
    { label: "Google Sheets 2-Way Sync", href: "/google-sheets", icon: FileSpreadsheet, category: "Navigation" },
    { label: "Tools & Inbound Webhooks", href: "/tools", icon: Wrench, category: "Navigation" },
    { label: "Knowledge Base & FAQs", href: "/knowledge-base", icon: BookOpen, category: "Navigation" },
    { label: "Smart AMD 2.0 Tone Detection", href: "/smart-amd", icon: Voicemail, category: "Navigation" },
    { label: "A/B Testing Laboratory", href: "/ab-testing", icon: Scale, category: "Navigation" },
    { label: "Analytics & ROI Reporting", href: "/analytics", icon: BarChart3, category: "Navigation" },
    { label: "Billing & Voice Credits", href: "/credits", icon: Coins, category: "Navigation" },
    { label: "Workspace Settings & Vault", href: "/settings", icon: Settings, category: "Navigation" },
  ];

  const filteredLinks = quickLinks.filter((l) =>
    l.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase()) ||
      a.language.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.company.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
  );

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.contactName.toLowerCase().includes(query.toLowerCase()) ||
      apt.scheduledTime.toLowerCase().includes(query.toLowerCase()) ||
      apt.agentName.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setCommandPaletteOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#0F172A]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Header */}
        <div className="flex items-center px-5 py-4 border-b border-[#E2E8F0]">
          <Search className="w-5 h-5 text-[#3157D5] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search Apex Voice AI (Agents, Campaigns, Calls, Contacts, Appointments)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] outline-none bg-transparent"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="text-xs font-mono font-bold bg-[#F1F5F9] text-[#64748B] px-2.5 py-1 rounded-lg border border-[#E2E8F0] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-4 flex-1 scrollbar-thin">
          {/* Quick Navigation & Actions */}
          {filteredLinks.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold tracking-wider text-[#64748B] uppercase px-3 py-1">
                Platform Navigation & Actions
              </p>
              <div className="space-y-1">
                {filteredLinks.slice(0, 5).map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.href}
                      onClick={() => handleSelect(link.href)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl hover:bg-[#EEF2FD] text-[#0F172A] transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F8FAFC] group-hover:bg-[#3157D5] group-hover:text-white flex items-center justify-center text-[#64748B] transition-colors shadow-2xs">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-[#0F172A]">{link.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#64748B] opacity-0 group-hover:opacity-100 group-hover:text-[#3157D5] transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Voice Agents */}
          {filteredAgents.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold tracking-wider text-[#64748B] uppercase px-3 py-1">
                AI Voice Agents ({filteredAgents.length})
              </p>
              <div className="space-y-1">
                {filteredAgents.slice(0, 3).map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelect(`/agents/${agent.id}`)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl hover:bg-[#EEF2FD] text-[#0F172A] transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center font-bold text-[10px]">
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A]">{agent.name}</p>
                        <p className="text-[11px] text-[#64748B] truncate max-w-xs">{agent.voice.voiceName} • {agent.language}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FD] text-[#3157D5] uppercase">
                      {agent.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Appointments */}
          {filteredAppointments.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold tracking-wider text-[#64748B] uppercase px-3 py-1">
                Appointments & Bookings ({filteredAppointments.length})
              </p>
              <div className="space-y-1">
                {filteredAppointments.slice(0, 3).map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => handleSelect("/appointments")}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-xl hover:bg-[#EEF2FD] text-[#0F172A] transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#3157D5]" />
                      <div>
                        <p className="font-bold text-[#0F172A]">{apt.contactName}</p>
                        <p className="text-[10px] text-[#64748B]">{apt.scheduledTime} • Agent: {apt.agentName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full capitalize">
                      {apt.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contacts & Leads */}
          {filteredContacts.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold tracking-wider text-[#64748B] uppercase px-3 py-1">
                Contacts & Leads CRM ({filteredContacts.length})
              </p>
              <div className="space-y-1">
                {filteredContacts.slice(0, 3).map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelect("/contacts")}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-xl hover:bg-[#EEF2FD] text-[#0F172A] transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-[#64748B]" />
                      <div>
                        <p className="font-bold text-[#0F172A]">{contact.name}</p>
                        <p className="text-[10px] text-[#64748B]">{contact.company} • {contact.phone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
                      Score {contact.leadScore}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campaigns */}
          {filteredCampaigns.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold tracking-wider text-[#64748B] uppercase px-3 py-1">
                Outbound Campaigns ({filteredCampaigns.length})
              </p>
              <div className="space-y-1">
                {filteredCampaigns.slice(0, 2).map((camp) => (
                  <button
                    key={camp.id}
                    onClick={() => handleSelect(`/campaigns/${camp.id}`)}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-xl hover:bg-[#EEF2FD] text-[#0F172A] transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Megaphone className="w-4 h-4 text-[#3157D5]" />
                      <div>
                        <p className="font-bold text-[#0F172A]">{camp.name}</p>
                        <p className="text-[10px] text-[#64748B]">{camp.totalLeads} Leads • {camp.calledLeads} Called</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full capitalize">
                      {camp.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-[#E2E8F0] rounded text-[10px] font-mono font-bold text-[#0F172A]">ESC</kbd> to close</span>
          <span className="text-[#94A3B8]">Navigate with ↑ ↓ and Enter</span>
        </div>
      </div>
    </div>
  );
}
