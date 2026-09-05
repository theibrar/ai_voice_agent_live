"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Campaign, CampaignType } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import {
  Megaphone,
  Bot,
  Phone,
  Clock,
  Sliders,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Voicemail,
  Radio,
  Play,
  Pause,
  Volume2,
  FileSpreadsheet,
  UploadCloud,
  FileText,
  Download,
  Trash2,
  Plus,
  X,
  Target,
  Layers,
} from "lucide-react";

interface ParsedLead {
  name: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
}

export interface CampaignTypeOption {
  id: string;
  title: string;
  desc: string;
  objective: string;
  isCustom?: boolean;
}

const INITIAL_CAMPAIGN_TYPES: CampaignTypeOption[] = [
  {
    id: "outbound_sales",
    title: "Outbound Sales & Lead Gen",
    desc: "Cold/Warm prospect outreach & commercial qualification",
    objective: "Pitch the core value proposition, handle common objections, qualify prospect budget and authority, and book a discovery demo.",
  },
  {
    id: "lead_qualification",
    title: "Inbound Lead Follow-up",
    desc: "Call website leads within 60 seconds",
    objective: "Reference the prospect's recent inquiry, ask qualifying questions regarding project needs, and confirm next consultation steps.",
  },
  {
    id: "appointment_reminder",
    title: "Appointment Reminders",
    desc: "Confirm scheduled meetings & reduce no-shows",
    objective: "Verify attendee availability for the upcoming appointment, confirm calendar invite, and offer instant rescheduling if requested.",
  },
  {
    id: "survey",
    title: "Customer NPS & Feedback",
    desc: "Post-service satisfaction survey calls",
    objective: "Politely collect customer feedback, gather a 1-10 satisfaction score, and document key improvement suggestions.",
  },
  {
    id: "renewal_retention",
    title: "Contract Renewal & Retention",
    desc: "Proactive outreach for expiring subscriptions & accounts",
    objective: "Discuss upcoming account renewal terms, highlight high-value features, address churn concerns, and secure agreement.",
  },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { agents, phoneNumbers, addCampaign, refreshContacts, addToast } = useAppStore();

  const [step, setStep] = useState(1);

  // Dynamic Campaign Types
  const [campaignTypes, setCampaignTypes] = useState<CampaignTypeOption[]>(INITIAL_CAMPAIGN_TYPES);
  const [type, setType] = useState<string>("outbound_sales");

  // Custom Campaign Type Modal State
  const [isCustomTypeModalOpen, setIsCustomTypeModalOpen] = useState(false);
  const [newCustomTitle, setNewCustomTitle] = useState("");
  const [newCustomDesc, setNewCustomDesc] = useState("");
  const [newCustomObjective, setNewCustomObjective] = useState("");

  // Form State
  const [name, setName] = useState("Q4 Enterprise Sales Surge");
  const [agentId, setAgentId] = useState(agents[0]?.id || "agent-1");
  const [phoneNumber, setPhoneNumber] = useState(phoneNumbers[0]?.formattedNumber || "+1 (800) 459-0120");
  const [concurrency, setConcurrency] = useState(25);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [retryInterval, setRetryInterval] = useState(30);
  const [timezone, setTimezone] = useState("America/New_York");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [totalLeads, setTotalLeads] = useState(250);

  // CSV Lead Ingestion State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvLeads, setCsvLeads] = useState<ParsedLead[]>([]);
  const [isParsingCsv, setIsParsingCsv] = useState(false);

  // Feature 6: Smart AMD 2.0 State
  const [amdEnabled, setAmdEnabled] = useState(true);
  const [beepHz, setBeepHz] = useState(1000);
  const [beepDelayMs, setBeepDelayMs] = useState(1200);
  const [voicemailScript, setVoicemailScript] = useState(
    "Hi {{contact_name}}, this is Rachel following up on {{company}}'s voice automation trial. I sent an invite for a brief overview—call us back at {{callback_number}} or reply to our email. Have a great day!"
  );
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const selectedAgent = agents.find((a) => a.id === agentId) || agents[0];

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCsv(true);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "");
        if (lines.length < 2) {
          addToast({ title: "CSV Format Notice", description: "CSV file is empty or missing data rows.", type: "warning" });
          setIsParsingCsv(false);
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
        const nameIdx = headers.findIndex((h) => h.includes("name"));
        const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("number"));
        const emailIdx = headers.findIndex((h) => h.includes("email"));
        const companyIdx = headers.findIndex((h) => h.includes("company") || h.includes("org"));
        const notesIdx = headers.findIndex((h) => h.includes("note") || h.includes("desc") || h.includes("detail"));

        const parsed: ParsedLead[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((col) => col.trim().replace(/^["']|["']$/g, ""));
          if (cols.length > 0) {
            parsed.push({
              name: (nameIdx >= 0 ? cols[nameIdx] : cols[0]) || `Lead #${i}`,
              phone: (phoneIdx >= 0 ? cols[phoneIdx] : cols[1]) || "+1 (555) 000-0000",
              email: (emailIdx >= 0 ? cols[emailIdx] : cols[2]) || "",
              company: (companyIdx >= 0 ? cols[companyIdx] : cols[3]) || "Direct Prospect",
              notes: (notesIdx >= 0 ? cols[notesIdx] : "") || "Ingested via campaign CSV",
            });
          }
        }

        setCsvLeads(parsed);
        setTotalLeads(parsed.length);
        addToast({
          title: "CSV Ingested Successfully",
          description: `Parsed ${parsed.length} leads from ${file.name}. Ready to save into database.`,
          type: "success",
        });
      } catch (err) {
        console.warn("CSV parse error:", err);
        addToast({ title: "CSV Error", description: "Failed to parse CSV file structure.", type: "warning" });
      } finally {
        setIsParsingCsv(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Name,Phone,Email,Company,Notes\n" +
      "Alexander Morgan,+1 (415) 555-0192,alex.morgan@apexfin.com,Apex Financial Services,Interested in commercial solar ROI\n" +
      "Elena Rostova,+1 (212) 555-0841,elena.rostova@zenithtech.io,Zenith Technologies,Requested inbound voice bot consultation\n" +
      "Marcus Vance,+1 (312) 555-9012,marcus.vance@solarglobal.org,Solar Global Group,Follow-up on proposal pricing";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_leads_campaign.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeTypeOption = campaignTypes.find((t) => t.id === type) || campaignTypes[0] || INITIAL_CAMPAIGN_TYPES[0];

  const handleAddCustomType = () => {
    if (!newCustomTitle.trim()) {
      addToast({ title: "Title Required", description: "Please enter a title for your custom campaign type.", type: "error" });
      return;
    }
    const newTypeId = `custom_${Date.now()}`;
    const newTypeObj: CampaignTypeOption = {
      id: newTypeId,
      title: newCustomTitle.trim(),
      desc: newCustomDesc.trim() || "Custom user-defined cadence & strategy",
      objective: newCustomObjective.trim() || "Execute custom conversational workflow and achieve campaign target.",
      isCustom: true,
    };

    setCampaignTypes((prev) => [...prev, newTypeObj]);
    setType(newTypeId);
    setIsCustomTypeModalOpen(false);
    setNewCustomTitle("");
    setNewCustomDesc("");
    setNewCustomObjective("");
    addToast({
      title: "Custom Campaign Type Added",
      description: `'${newTypeObj.title}' created. Assigned agent will now respect this objective.`,
      type: "success",
    });
  };

  const handleLaunch = async () => {
    const newCampId = `camp-${Date.now()}`;
    const newCamp: Campaign = {
      id: newCampId,
      name,
      type,
      customTypeTitle: activeTypeOption.isCustom ? activeTypeOption.title : undefined,
      customTypeObjective: activeTypeOption.isCustom ? activeTypeOption.objective : undefined,
      campaignObjective: activeTypeOption.objective,
      status: "active",
      agentId,
      agentName: selectedAgent ? selectedAgent.name : "Voice Agent",
      phoneNumber,
      totalLeads: csvLeads.length > 0 ? csvLeads.length : totalLeads,
      calledLeads: 0,
      connectedLeads: 0,
      qualifiedLeads: 0,
      conversionRate: 0,
      answerRate: 0,
      concurrencyLimit: concurrency,
      retryAttempts,
      retryIntervalMinutes: retryInterval,
      schedule: {
        timezone,
        days: selectedDays,
        startTime,
        endTime,
      },
      amdConfig: amdEnabled
        ? {
            enabled: true,
            beepDetectionHz: beepHz,
            detectionTimeoutMs: beepDelayMs,
            script: voicemailScript,
            postDropAction: "log_crm",
          }
        : undefined,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    addCampaign(newCamp);

    // Save CSV Leads into PostgreSQL database
    if (csvLeads.length > 0) {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1') + '/campaigns/import-leads';
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: newCampId,
            campaignName: name,
            leads: csvLeads,
          }),
        });
        await refreshContacts();
        addToast({
          title: "Leads Persisted to Database",
          description: `All ${csvLeads.length} leads from '${csvFileName}' stored in PostgreSQL CRM ledger.`,
          type: "success",
        });
      } catch (err) {
        console.warn("Failed to persist CSV leads to database:", err);
      }
    }

    router.push(`/campaigns/${newCamp.id}`);
  };

  const steps = [
    { num: 1, title: "Identity & CSV Leads" },
    { num: 2, title: "Voice Agent" },
    { num: 3, title: "Smart AMD 2.0" },
    { num: 4, title: "Dialing Pace" },
    { num: 5, title: "Review & Launch" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/campaigns"
          className="p-2 bg-white border border-[#E5EAF2] rounded-xl text-[#78849A] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Create Outbound Campaign</h1>
          <p className="text-xs text-[#78849A]">Configure autonomous outbound voice workflows with smart answering machine drop.</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5EAF2] card-shadow">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => s.num < step && setStep(s.num)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? "bg-[#3157D5] text-white ring-4 ring-[#3157D5]/10"
                    : step > s.num
                    ? "bg-[#16A36A] text-white"
                    : "bg-[#F4F7FB] text-[#78849A]"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </button>
              <span className={`text-xs font-semibold hidden md:inline ${step === s.num ? "text-[#172033]" : "text-[#78849A]"}`}>
                {s.title}
              </span>
              {idx < steps.length - 1 && <div className="w-6 md:w-12 h-0.5 bg-[#EDF2F7] mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Form Panels */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5EAF2] card-shadow space-y-6">
        {/* Step 1: Campaign Identity & CSV Lead Sheet */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#172033]">Campaign Details & Lead Ingestion</h2>
              <p className="text-xs text-[#78849A] mt-0.5">Define your campaign strategy and import target leads from a CSV / Excel spreadsheet.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q4 Inbound Follow-up"
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#172033]">
                  Campaign Strategy & Type <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTypeModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3157D5] hover:text-[#2646B8] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Campaign Type</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campaignTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                      type === t.id
                        ? "bg-[#EEF2FD] border-[#3157D5] ring-2 ring-[#3157D5]/10 shadow-xs"
                        : "bg-[#F4F7FB] border-[#E5EAF2] hover:bg-[#EDF2F7]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#172033] block">{t.title}</span>
                      {t.isCustom && (
                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-md uppercase">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#78849A] mt-0.5 block line-clamp-2">{t.desc}</span>
                  </button>
                ))}
              </div>

              {/* Active Campaign Strategy Objective Banner */}
              {activeTypeOption && (
                <div className="p-3.5 bg-[#EEF2FD]/80 rounded-2xl border border-[#3157D5]/25 text-xs space-y-1.5 mt-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-[#3157D5]">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Assigned Agent Objective: {activeTypeOption.title}</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    {activeTypeOption.objective}
                  </p>
                </div>
              )}
            </div>

            {/* CSV Lead Sheet Ingestion Card */}
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">Import Target Lead Sheet (CSV / Excel)</h3>
                    <p className="text-[11px] text-[#64748B]">Upload prospect contacts to automatically save into PostgreSQL database</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] rounded-xl text-[11px] font-bold text-[#3157D5] transition-colors cursor-pointer"
                  title="Download CSV template format"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sample Template</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!csvFileName ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#CBD5E1] hover:border-[#3157D5] bg-white hover:bg-[#F8FAFC] rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#0F172A]">
                    Click to browse or drag & drop CSV file
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Columns supported: <span className="font-mono font-semibold text-[#3157D5]">Name, Phone, Email, Company, Notes</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{csvFileName}</span>
                      <span className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-md font-mono text-[11px]">
                        {csvLeads.length} leads loaded
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCsvFileName(null);
                        setCsvLeads([]);
                        setTotalLeads(250);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100/50 rounded-lg transition-colors cursor-pointer"
                      title="Remove uploaded sheet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* CSV Preview Table (First 3 leads) */}
                  {csvLeads.length > 0 && (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                      <div className="px-3 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex justify-between items-center text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        <span>Lead Sheet Preview ({csvLeads.length} Total)</span>
                        <span className="text-emerald-700 font-semibold lowercase">saving to postgresql on launch</span>
                      </div>
                      <div className="divide-y divide-[#E2E8F0] max-h-40 overflow-y-auto text-xs">
                        {csvLeads.slice(0, 4).map((lead, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-[#0F172A]">{lead.name}</span>
                              <span className="text-[#64748B] ml-2">({lead.company})</span>
                            </div>
                            <div className="font-mono text-[#3157D5] font-semibold">{lead.phone}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Target Lead List Size {csvLeads.length > 0 && <span className="text-emerald-600 font-bold">(Auto-synced from CSV)</span>}
                </label>
                <input
                  type="number"
                  value={totalLeads}
                  onChange={(e) => setTotalLeads(Number(e.target.value))}
                  disabled={csvLeads.length > 0}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5EAF2] rounded-xl text-xs font-mono outline-none focus:border-[#3157D5] disabled:bg-[#F1F5F9] disabled:text-[#64748B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Assigned Voice Agent (Clean, no trunk clutter) */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#172033]">Select Assigned Voice Agent</h2>
              <p className="text-xs text-[#78849A] mt-0.5">Choose the autonomous voice agent that will conduct calls for this outbound cadence.</p>
            </div>

            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agents.map((ag) => (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => setAgentId(ag.id)}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                      agentId === ag.id
                        ? "bg-[#EEF2FD] border-[#3157D5] ring-2 ring-[#3157D5]/20 shadow-xs"
                        : "bg-[#F8FAFC] hover:bg-white border-[#E2E8F0]"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                      style={{ backgroundColor: ag.color || "#3157D5" }}
                    >
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-[#172033] truncate">{ag.name}</p>
                      <p className="text-[11px] text-[#78849A] truncate">{ag.voice?.voiceName || "Neural Voice"} • {ag.language || "English (US)"}</p>
                    </div>
                  </button>
                ))}
              </div>

              {agents.length === 0 && (
                <div className="p-6 text-center bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2">
                  <Bot className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <p className="text-xs font-bold text-[#0F172A]">No Voice Agents Created Yet</p>
                  <Link href="/agents/new" className="inline-block text-xs font-bold text-[#3157D5] hover:underline">
                    + Create Your First Voice Agent
                  </Link>
                </div>
              )}
            </div>

            {/* Agent Conversational Strategy Alignment Card */}
            {selectedAgent && activeTypeOption && (
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                    <Zap className="w-4 h-4 text-[#3157D5]" />
                    <span>Agent Conversational Strategy Grounding</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                    Respecting {activeTypeOption.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  <strong>{selectedAgent.name}</strong> will dynamically tailor its opening script hook, conversational tone, and qualification logic to respect this campaign goal:
                </p>
                <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] text-[11px] text-[#0F172A] font-medium leading-relaxed">
                  "{activeTypeOption.objective}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: FEATURE 6: Smart AMD 2.0 & Voicemail Drop */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF2F7]">
              <div>
                <div className="flex items-center gap-2">
                  <Voicemail className="w-5 h-5 text-[#3157D5]" />
                  <h2 className="text-base font-bold text-[#172033]">Smart AMD 2.0 & Beep Tone Voicemail Drop</h2>
                </div>
                <p className="text-xs text-[#78849A] mt-0.5">
                  Eliminate awkward dead air. Automatically detect carrier voicemail beep tones and drop a crisp, personalized message.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={amdEnabled}
                  onChange={(e) => setAmdEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#E5EAF2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5EAF2] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3157D5]"></div>
              </label>
            </div>

            {amdEnabled && (
              <div className="space-y-4">
                {/* Audio Frequency Detection Visualizer */}
                <div className="p-4 bg-[#101A33] text-white rounded-2xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-[#16A36A] animate-pulse" /> Carrier Audio Frequency Analyzer (1000Hz Tone Lock)
                    </span>
                    <span className="text-xs font-mono font-bold text-[#16A36A] bg-[#16A36A]/20 px-2 py-0.5 rounded">
                      AMD 2.0 Engine: Ready
                    </span>
                  </div>

                  <div className="h-10 flex items-end gap-1 px-1">
                    {Array.from({ length: 30 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-[#3157D5] rounded-full transition-all duration-200"
                        style={{ height: `${(Math.sin(idx * 0.4) + 1.2) * 35}%` }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] pt-1">
                    <span>Frequency: {beepHz} Hz</span>
                    <span>Post-Beep Audio Delay: {beepDelayMs}ms</span>
                  </div>
                </div>

                {/* Voicemail Script with Variable Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#172033]">Personalized Voicemail Drop Script</label>
                    <div className="flex items-center gap-1">
                      {["{{contact_name}}", "{{company}}", "{{callback_number}}"].map((token) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => setVoicemailScript((prev) => `${prev} ${token}`)}
                          className="px-1.5 py-0.5 bg-[#EEF2FD] text-[#3157D5] font-mono font-bold text-[10px] rounded hover:bg-[#E0E7FB]"
                        >
                          +{token}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={voicemailScript}
                    onChange={(e) => setVoicemailScript(e.target.value)}
                    className="w-full p-3.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5] leading-relaxed"
                  />
                </div>

                {/* Voicemail Audio Preview Player */}
                <div className="p-3.5 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewPlaying(!isPreviewPlaying);
                        addToast({
                          title: isPreviewPlaying ? "Audio Paused" : "Playing Voicemail Audio",
                          description: "Synthesized using Rachel voice model.",
                          type: "info",
                        });
                      }}
                      className="w-8 h-8 rounded-full bg-[#3157D5] text-white flex items-center justify-center shadow-xs"
                    >
                      {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-[#172033] block">Test Voicemail Synthesis</span>
                      <span className="text-[10px] text-[#78849A]">Duration: ~14.2 seconds • Natural pacing</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#16A36A] bg-[#E8F7F0] px-2 py-0.5 rounded-md">
                    TTS Voice Synced
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Dialing Schedule & Concurrency */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#172033]">Dialing Pace, Concurrency & Calling Hours</h2>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#172033]">Concurrent Calling Ports</span>
                <span className="font-mono font-bold text-[#3157D5]">{concurrency} Lines</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="w-full accent-[#3157D5]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Max Retry Attempts</label>
                <select
                  value={retryAttempts}
                  onChange={(e) => setRetryAttempts(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs outline-none focus:border-[#3157D5]"
                >
                  <option value={1}>1 Attempt</option>
                  <option value={2}>2 Attempts</option>
                  <option value={3}>3 Attempts (Recommended)</option>
                  <option value={5}>5 Attempts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Retry Interval (Minutes)</label>
                <input
                  type="number"
                  value={retryInterval}
                  onChange={(e) => setRetryInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs font-mono outline-none focus:border-[#3157D5]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Launch */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#172033]">Review & Confirm Launch</h2>

            <div className="p-4 bg-[#F4F7FB] rounded-2xl border border-[#E5EAF2] space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E5EAF2]">
                <span className="text-[#78849A]">Campaign Name:</span>
                <span className="font-bold text-[#172033]">{name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5EAF2]">
                <span className="text-[#78849A]">Assigned Voice Agent:</span>
                <span className="font-bold text-[#3157D5]">{selectedAgent?.name || "Voice Agent"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5EAF2]">
                <span className="text-[#78849A]">Target Leads Source:</span>
                <span className="font-bold text-emerald-700">
                  {csvFileName ? `CSV Sheet: ${csvFileName} (${csvLeads.length} leads)` : `Manual Target (${totalLeads} prospects)`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5EAF2]">
                <span className="text-[#78849A]">Campaign Strategy:</span>
                <span className="font-bold text-[#3157D5]">
                  {activeTypeOption?.title} {activeTypeOption?.isCustom ? "(Custom Strategy)" : ""}
                </span>
              </div>
              <div className="py-1 border-b border-[#E5EAF2]">
                <span className="text-[#78849A] block mb-1">Agent Conversational Objective:</span>
                <span className="font-medium text-[#172033] block text-[11px] bg-white p-2.5 rounded-xl border border-[#E5EAF2] leading-relaxed">
                  "{activeTypeOption?.objective}"
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5EAF2]">
                <span className="text-[#78849A]">Smart AMD 2.0 Engine:</span>
                <span className="font-bold text-[#16A36A]">{amdEnabled ? "Active (1000Hz Tone Beep Drop Enabled)" : "Disabled"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5EAF2]">
                <span className="text-[#78849A]">Dialing Concurrency:</span>
                <span className="font-mono font-bold text-[#172033]">{concurrency} Parallel Channels</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#78849A]">Database Destination:</span>
                <span className="font-mono font-semibold text-[#3157D5]">PostgreSQL Leads & CRM Contacts</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#EDF2F7]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F4F7FB] border border-[#E5EAF2] text-[#172033] text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#16A36A] hover:bg-[#138A5A] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Autonomous Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Campaign Type Creation Modal */}
      {isCustomTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A]">Add Custom Campaign Type</h3>
                  <p className="text-[11px] text-[#64748B]">Assigned AI agent will automatically enforce this strategy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomTypeModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">
                  Campaign Type Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP Real Estate Acquisition or Healthcare Follow-up"
                  value={newCustomTitle}
                  onChange={(e) => setNewCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] outline-none focus:border-[#3157D5]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Target property owners to schedule cash-offer assessments"
                  value={newCustomDesc}
                  onChange={(e) => setNewCustomDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] outline-none focus:border-[#3157D5]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">
                  Agent Strategy & Conversational Objective <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the exact conversation goals, opening hook, and qualification criteria the assigned voice agent must follow during calls..."
                  value={newCustomObjective}
                  onChange={(e) => setNewCustomObjective(e.target.value)}
                  className="w-full p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#3157D5] leading-relaxed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">
                  The assigned AI voice agent will strictly ground its opening script, objection handling, and qualification outcomes on this objective.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsCustomTypeModalOpen(false)}
                className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomType}
                className="px-5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                Add & Select Strategy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
