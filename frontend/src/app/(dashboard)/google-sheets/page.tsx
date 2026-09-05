"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { getApiBase } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Plus,
  ArrowRight,
  Download,
  Settings,
  Database,
  FileSpreadsheet,
  Check,
  Search,
  FolderSync,
  Key,
  Lock,
  X,
} from "lucide-react";

export default function GoogleSheetsPage() {
  const {
    addToast,
    calls,
    appointments,
    contacts,
    googleAccountConnected,
    setGoogleAccountConnected,
    googleAccountEmail,
    setGoogleAccountEmail,
    googleSheetsConnected,
    setGoogleSheetsConnected,
    googleSheetsTarget,
    googleSheetsTab,
    syncGoogleSheetsData,
    connectGoogleAccount,
    disconnectGoogleAccount,
    createGoogleSheet,
    refreshGoogleStatus,
    googleDriveConnected,
    googleDriveFolder,
  } = useAppStore();

  const [activeSheetTab, setActiveSheetTab] = useState(googleSheetsTab || "Leads_2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit");
  const [spreadsheetTitle, setSpreadsheetTitle] = useState("Apex Voice Leads & Appointments - 2026");
  const [syncedRows, setSyncedRows] = useState<Array<any>>([]);

  // Google Account Credentials State (Pre-filled with provided client credentials)
  const [googleEmailInput, setGoogleEmailInput] = useState(googleAccountEmail || "admin@apexvoice.ai");
  const [googleClientId, setGoogleClientId] = useState("62350400975-n7drhihi3r0jqoh0jlrrs8latamelv4n.apps.googleusercontent.com");
  const [googleClientSecret, setGoogleClientSecret] = useState("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");
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Load database rows from PostgreSQL table google_sheet_rows
  const loadDatabaseRows = React.useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/integrations/google-sheets/rows';
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.rows)) {
          setSyncedRows(data.rows);
          if (data.rows[0]?.spreadsheet_url) {
            setSpreadsheetUrl(data.rows[0].spreadsheet_url);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch google sheet rows from database:", err);
    }
  }, []);

  React.useEffect(() => {
    loadDatabaseRows();
  }, [loadDatabaseRows]);

  const handleConnectGoogleAccount = async () => {
    setAuthError(null);
    const email = googleEmailInput.trim() || "admin@apexvoice.ai";
    const clientId = googleClientId.trim() || "62350400975-n7drhihi3r0jqoh0jlrrs8latamelv4n.apps.googleusercontent.com";
    const clientSecret = googleClientSecret.trim() || "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";

    const res = await connectGoogleAccount({
      email,
      client_id: clientId,
      client_secret: clientSecret,
      account_name: "Google Workspace User",
    });

    if (res && res.spreadsheet_url) {
      setSpreadsheetUrl(res.spreadsheet_url);
      setSpreadsheetTitle(res.spreadsheet_title || "Apex Voice Leads & Appointments - 2026");
    }

    setAuthModalOpen(false);
    await loadDatabaseRows();
  };

  const handleCreateNewSheet = async () => {
    const res = await createGoogleSheet();
    if (res && res.spreadsheet_url) {
      setSpreadsheetUrl(res.spreadsheet_url);
      setSpreadsheetTitle(res.spreadsheet_name);
      await loadDatabaseRows();
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncGoogleSheetsData(activeSheetTab);
    await loadDatabaseRows();
    setTimeout(() => {
      setIsSyncing(false);
    }, 700);
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,Caller Name,Phone,Agent,Status,Score,Appointment,Notes\n" +
      syncedRows
        .map(
          (r) =>
            `"${r.timestamp}","${r.callerName}","${r.phone}","${r.agent}","${r.status}","${r.score}","${r.appointment}","${r.notes}"`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `apex_${activeSheetTab.toLowerCase()}_google_sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: "CSV Exported",
      description: `Downloaded apex_${activeSheetTab.toLowerCase()}_google_sheet.csv`,
      type: "success",
    });
  };

  const filteredRows = syncedRows.filter(
    (r) =>
      r.callerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone?.includes(searchQuery) ||
      r.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Google Sheets & Drive Integration</h1>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Push call logs, appointment bookings, and lead qualification transcripts to Google Sheets and Google Drive in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Top-Right Google Account Sync Button (Red when disconnected, Green when connected) */}
          <button
            onClick={() => setAuthModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              googleAccountConnected
                ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                : "bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
            }`}
            title="Google Account Sync"
          >
            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center font-bold text-[10px] text-[#4285F4] shadow-xs shrink-0">
              G
            </div>
            <span>
              {googleAccountConnected
                ? `Google Account: Connected (${googleAccountEmail || "admin@apexvoice.ai"})`
                : "Google Account Sync: Disconnected"}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                googleAccountConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
          </button>

          {googleAccountConnected && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Google Sheet ↗</span>
            </a>
          )}

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#EEF2FD] border border-[#E2E8F0] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#3157D5]" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Google Account OAuth Status Bar */}
      <div className="p-4 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center font-bold text-lg shadow-2xs">
            <span className="text-[#4285F4]">G</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0F172A]">
                Google Account: {googleAccountConnected && googleAccountEmail ? googleAccountEmail : "Not Connected"}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  googleAccountConnected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {googleAccountConnected ? "● Connected & Database Synced" : "● Disconnected"}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              {googleAccountConnected
                ? `Connected to '${spreadsheetTitle}'. All call leads & appointments automatically synced to Google Sheets and PostgreSQL.`
                : "Connect your Google account to enable live 2-way spreadsheet syncing and database persistence."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {googleAccountConnected && (
            <button
              onClick={handleCreateNewSheet}
              className="px-3.5 py-1.5 bg-[#EEF2FD] hover:bg-[#E0E7FB] border border-[#3157D5]/30 text-[#3157D5] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Google Sheet</span>
            </button>
          )}

          <button
            onClick={() => setAuthModalOpen(true)}
            className={`px-3.5 py-1.5 border font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto ${
              googleAccountConnected
                ? "bg-[#F8FAFC] hover:bg-[#EEF2FD] border-[#CBD5E1] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5]"
                : "bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700"
            }`}
          >
            <Key className="w-3.5 h-3.5 text-[#3157D5]" />
            <span>{googleAccountConnected ? "Configure Auth Credentials" : "Connect Google Account"}</span>
          </button>
        </div>
      </div>

      {/* 2. Live Sheet Table Preview */}
      <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDF2F7]">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Live Sheet Row Stream</h2>
            <p className="text-xs text-[#64748B]">Real-time preview of synced data columns in Google Sheets & Drive</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search synced records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3157D5]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Caller / Lead Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Assigned Agent</th>
                <th className="p-3">Outcome</th>
                <th className="p-3">Score</th>
                <th className="p-3">Booked Appointment</th>
                <th className="p-3">Qualification Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#EEF2FD]/40 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">{row.timestamp}</td>
                    <td className="p-3 font-bold text-[#0F172A] whitespace-nowrap">{row.callerName}</td>
                    <td className="p-3 font-mono text-[#64748B] whitespace-nowrap">{row.phone}</td>
                    <td className="p-3 text-[#0F172A] whitespace-nowrap">{row.agent}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FD] text-[#3157D5]">
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#3157D5] font-mono">{row.score}</td>
                    <td className="p-3 font-semibold text-[#0F172A] whitespace-nowrap">{row.appointment}</td>
                    <td className="p-3 text-[#64748B] max-w-xs truncate">{row.notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748B] text-xs">
                    No synced Google Sheets rows recorded in database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Auth Credentials Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Google Sheets & Drive Auth Credentials</h3>
                  <p className="text-xs text-[#64748B]">Configure Google OAuth 2.0 or Service Account credentials</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                  setAuthError(null);
                }}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <span className="font-bold shrink-0">⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Google Account Email <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => {
                    setGoogleEmailInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] outline-none focus:border-[#3157D5]"
                  placeholder="your-account@gmail.com"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Google OAuth Client ID</label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => {
                    setGoogleClientId(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#0F172A] outline-none focus:border-[#3157D5]"
                  placeholder="981249120938-xxxx.apps.googleusercontent.com"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Google OAuth Client Secret</label>
                <input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => {
                    setGoogleClientSecret(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#0F172A] outline-none focus:border-[#3157D5]"
                  placeholder="GOCSPX-xxxx..."
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Or Service Account JSON Key (Optional)</label>
                <textarea
                  rows={3}
                  value={serviceAccountJson}
                  onChange={(e) => {
                    setServiceAccountJson(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder='{ "type": "service_account", "client_email": "..." }'
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#0F172A] outline-none focus:border-[#3157D5]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
              {googleAccountConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    setGoogleAccountConnected(false);
                    setGoogleSheetsConnected(false);
                    setGoogleAccountEmail("");
                    setGoogleEmailInput("");
                    setAuthModalOpen(false);
                    addToast({
                      title: "Google Account Disconnected",
                      description: "Google Account & Sheets sync has been disconnected.",
                      type: "info",
                    });
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Disconnect Account
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    setAuthError(null);
                  }}
                  className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl text-xs font-bold text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConnectGoogleAccount}
                  className="px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Authorize & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
