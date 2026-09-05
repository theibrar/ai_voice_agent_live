"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { getApiBase } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  Megaphone,
  Plus,
  Search,
  Play,
  Pause,
  Users,
  PhoneCall,
  Clock,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  FileSpreadsheet,
  UploadCloud,
  X,
  Download,
  CheckCircle,
} from "lucide-react";

export default function CampaignsPage() {
  const { campaigns, toggleCampaignStatus, deleteCampaign, refreshContacts, addToast } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteModalCampaign, setDeleteModalCampaign] = useState<any | null>(null);

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCampaignId, setImportCampaignId] = useState<string>(campaigns[0]?.id || "");
  const [importCsvName, setImportCsvName] = useState<string | null>(null);
  const [importLeads, setImportLeads] = useState<Array<{ name: string; phone: string; email: string; company: string; notes: string }>>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportCsvName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
        if (lines.length < 2) {
          addToast({ title: "CSV Format Notice", description: "CSV file is empty or missing data rows.", type: "warning" });
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
        const nameIdx = headers.findIndex((h) => h.includes("name"));
        const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("number"));
        const emailIdx = headers.findIndex((h) => h.includes("email"));
        const companyIdx = headers.findIndex((h) => h.includes("company") || h.includes("org"));
        const notesIdx = headers.findIndex((h) => h.includes("note") || h.includes("desc"));

        const parsed: Array<{ name: string; phone: string; email: string; company: string; notes: string }> = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
          if (cols.length > 0) {
            parsed.push({
              name: (nameIdx >= 0 ? cols[nameIdx] : cols[0]) || `Lead #${i}`,
              phone: (phoneIdx >= 0 ? cols[phoneIdx] : cols[1]) || "+1 (555) 000-0000",
              email: (emailIdx >= 0 ? cols[emailIdx] : cols[2]) || "",
              company: (companyIdx >= 0 ? cols[companyIdx] : cols[3]) || "Direct Prospect",
              notes: (notesIdx >= 0 ? cols[notesIdx] : "") || "Ingested via CSV file",
            });
          }
        }
        setImportLeads(parsed);
      } catch (err) {
        console.warn("Error parsing CSV:", err);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (importLeads.length === 0) {
      addToast({ title: "No Leads Loaded", description: "Please choose a CSV file first.", type: "warning" });
      return;
    }

    setIsImporting(true);
    try {
      const selectedCamp = campaigns.find((c) => c.id === importCampaignId);
      const campName = selectedCamp ? selectedCamp.name : "General Outreach";

      const apiUrl = getApiBase() + '/campaigns/import-leads';
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: importCampaignId,
          campaignName: campName,
          leads: importLeads,
        }),
      });

      await refreshContacts();
      addToast({
        title: "Leads Imported Successfully",
        description: `Saved ${importLeads.length} leads into PostgreSQL database for '${campName}'.`,
        type: "success",
      });

      setIsImportModalOpen(false);
      setImportCsvName(null);
      setImportLeads([]);
    } catch (err) {
      console.warn("Import failed:", err);
      addToast({ title: "Import Error", description: "Failed to persist leads to database.", type: "warning" });
    } finally {
      setIsImporting(false);
    }
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

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalLeads = campaigns.reduce((acc, c) => acc + c.totalLeads, 0);
  const totalCalled = campaigns.reduce((acc, c) => acc + c.calledLeads, 0);
  const avgConversion = campaigns.length > 0
    ? (campaigns.reduce((acc, c) => acc + c.conversionRate, 0) / campaigns.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Campaigns & Outreach"
        description="Launch and scale high-concurrency automated inbound funnels and outbound calling cadences."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/campaigns/new"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#3157D5]/15 hover:shadow-lg hover:shadow-[#3157D5]/25 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </Link>
          </div>
        }
      />


      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Total Campaigns</span>
          <div className="text-2xl font-bold text-[#172033] mt-1">{campaigns.length}</div>
          <span className="text-xs text-[#16A36A] font-semibold mt-1 block">
            {campaigns.filter((c) => c.status === "active").length} actively calling
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Total Target Leads</span>
          <div className="text-2xl font-bold text-[#172033] mt-1">{totalLeads.toLocaleString()}</div>
          <span className="text-xs text-[#3157D5] font-semibold mt-1 block">
            {totalCalled.toLocaleString()} attempted ({Math.round((totalCalled / (totalLeads || 1)) * 100)}%)
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Avg Conversion Rate</span>
          <div className="text-2xl font-bold text-[#16A36A] mt-1">{avgConversion}%</div>
          <span className="text-xs text-[#78849A] mt-1 block">Score &gt; 75 qualified</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Allocated Concurrency</span>
          <div className="text-2xl font-bold text-[#172033] mt-1">{campaigns.length > 0 ? "110 Ports" : "0 Ports"}</div>
          <span className="text-xs text-[#16A36A] font-semibold mt-1 block">
            {campaigns.length > 0 ? "Auto-scaling SIP trunks" : "No active SIP trunks"}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#78849A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns by name, agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] placeholder-[#78849A] outline-none focus:border-[#3157D5]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#F4F7FB] p-1 rounded-xl border border-[#E5EAF2]">
          {["all", "active", "paused", "draft", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors capitalize ${
                statusFilter === st
                  ? "bg-white text-[#3157D5] shadow-2xs"
                  : "text-[#78849A] hover:text-[#172033]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-3xl border border-[#E5EAF2] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#475569] uppercase tracking-wider text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-4.5">Campaign Name</th>
                <th className="px-6 py-4.5">Assigned Agent</th>
                <th className="px-6 py-4.5">Dialing Concurrency</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5">Progress / Leads</th>
                <th className="px-6 py-4.5">Conversion Rate</th>
                <th className="px-6 py-4.5">Schedule</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/50 transition-all duration-150">
                    <td className="px-6 py-4.5 font-bold text-[#0F172A] max-w-[220px]">
                      <Link href={`/campaigns/${camp.id}`} className="hover:text-[#3157D5] transition-colors block truncate text-sm">
                        {camp.name}
                      </Link>
                      <p className="text-[10px] text-[#64748B] font-normal capitalize mt-0.5 flex items-center gap-1">
                        <span>{camp.customTypeTitle || camp.type.replace(/_/g, " ")}</span>
                        {camp.customTypeTitle && (
                          <span className="px-1 py-0.2 bg-purple-100 text-purple-700 text-[8px] font-bold rounded">
                            CUSTOM
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4.5 font-medium text-[#334155]">{camp.agentName}</td>
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F0F5FF] text-[#3157D5] border border-[#DCE4FF] font-mono">
                        {camp.concurrencyLimit || 25} Lines
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <StatusPill status={camp.status} size="sm" />
                    </td>
                    <td className="px-6 py-4.5 min-w-[160px]">
                      <div className="flex justify-between text-[11px] mb-1.5 font-medium">
                        <span className="text-[#0F172A]">{camp.calledLeads} <span className="text-[#64748B] font-normal">/ {camp.totalLeads} leads</span></span>
                        <span className="text-[#3157D5]">
                          {Math.round((camp.calledLeads / (camp.totalLeads || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                        <div
                          className="bg-gradient-to-r from-[#3157D5] to-[#4F70E7] h-full rounded-full"
                          style={{ width: `${(camp.calledLeads / (camp.totalLeads || 1)) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="inline-flex flex-col">
                        <span className="font-bold text-[#16A36A] text-sm">{camp.conversionRate}%</span>
                        <span className="text-[10px] text-[#64748B]">{camp.qualifiedLeads} qualified</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-[11px] font-medium text-[#475569]">
                      <div className="flex flex-col gap-0.5">
                        <span>{camp.schedule.days.slice(0, 3).join(", ")}</span>
                        <span className="text-[10px] text-[#64748B]">{camp.schedule.startTime}-{camp.schedule.endTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-right space-x-2">
                      <button
                        onClick={() => toggleCampaignStatus(camp.id)}
                        title={camp.status === "active" ? "Pause campaign" : "Start campaign"}
                        className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#3157D5]/40 hover:bg-[#EEF2FD] text-[#64748B] hover:text-[#3157D5] transition-all inline-flex items-center cursor-pointer"
                      >
                        {camp.status === "active" ? <Pause className="w-3.5 h-3.5 text-[#16A36A]" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <Link
                        href={`/campaigns/${camp.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EEF2FD] hover:bg-[#3157D5] text-[#3157D5] hover:text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Monitor
                      </Link>
                      <button
                        onClick={() => setDeleteModalCampaign(camp)}
                        title="Delete campaign"
                        className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-rose-300 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 transition-all inline-flex items-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-[#64748B] text-xs">
                    No voice campaigns or outreach cadences recorded in database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Lead Sheet Ingestion Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Import Leads from CSV Sheet</h3>
                  <p className="text-[11px] text-[#64748B]">Batch ingest prospect contacts directly into PostgreSQL database</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportCsvName(null);
                  setImportLeads([]);
                }}
                className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Target Campaign Assignment</label>
                <select
                  value={importCampaignId}
                  onChange={(e) => setImportCampaignId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl outline-none focus:border-[#3157D5] text-[#0F172A]"
                >
                  <option value="">General CRM Leads Pool (Unassigned)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.agentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[#0F172A]">Upload Lead Spreadsheet (.csv)</label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="text-[10px] text-[#3157D5] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Sample CSV
                  </button>
                </div>

                <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#3157D5] bg-[#F8FAFC] hover:bg-white rounded-2xl p-6 text-center cursor-pointer block transition-all group">
                  <input
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleCsvSelect}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-[#0F172A]">
                    {importCsvName ? importCsvName : "Click to browse or drop CSV file"}
                  </p>
                  <p className="text-[10px] text-[#64748B] mt-1">
                    Headers: Name, Phone, Email, Company, Notes
                  </p>
                </label>
              </div>

              {/* Preview Box */}
              {importLeads.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-[11px]">
                      ✓ {importLeads.length} Leads Ready for Ingestion
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      Target: PostgreSQL CRM Ledger
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-emerald-100 divide-y divide-emerald-50 max-h-32 overflow-y-auto text-[11px]">
                    {importLeads.slice(0, 3).map((l, i) => (
                      <div key={i} className="p-2 flex justify-between">
                        <span className="font-bold text-[#0F172A]">{l.name} <span className="text-[#64748B] font-normal">({l.company})</span></span>
                        <span className="font-mono text-[#3157D5]">{l.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportCsvName(null);
                    setImportLeads([]);
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importLeads.length === 0 || isImporting}
                  onClick={handleExecuteImport}
                  className="px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] disabled:bg-[#94A3B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-all cursor-pointer"
                >
                  {isImporting ? "Persisting to Database..." : `Save ${importLeads.length} Leads to Database`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalCampaign}
        onClose={() => setDeleteModalCampaign(null)}
        onConfirm={async () => {
          if (deleteModalCampaign) {
            await deleteCampaign(deleteModalCampaign.id);
          }
        }}
        itemName={deleteModalCampaign?.name}
        itemType="Voice Campaign"
      />
    </div>
  );
}
