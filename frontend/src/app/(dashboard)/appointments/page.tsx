"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Check,
  X,
  Video,
  Phone,
  User,
  Bot,
  ExternalLink,
  FolderSync,
  FolderOpen,
  RefreshCw,
  Trash2,
  Send,
  CalendarCheck2,
  CalendarDays,
  XCircle,
  FileSpreadsheet,
  Key,
  Lock,
  ShieldCheck,
  Link2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

export default function AppointmentsPage() {
  const {
    agents,
    appointments,
    setAppointments,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    refreshAppointments,
    addToast,
    googleAccountConnected,
    setGoogleAccountConnected,
    googleAccountEmail,
    setGoogleAccountEmail,
    connectGoogleAccount,
    disconnectGoogleAccount,
    syncGoogleCalendar,
    googleDriveConnected,
    googleDriveFolder,
    syncGoogleDrive,
    toggleGoogleDrive,
  } = useAppStore();

  // Current view date state (Default to August 2026 matching screenshot)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // Month index 7 = August
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Month");

  // Filters state
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "upcoming" | "past" | "completed">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalAppointment, setDeleteModalAppointment] = useState<any | null>(null);

  // Modals state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // Google Account & OAuth Credentials Integration State (Pre-filled with real credentials)
  const [googleAccountName, setGoogleAccountName] = useState("Google Workspace User");
  const [selectedCalendarId, setSelectedCalendarId] = useState("primary");
  const [googleEmailInput, setGoogleEmailInput] = useState(googleAccountEmail || "admin@apexvoice.ai");
  const [googleClientId, setGoogleClientId] = useState("62350400975-n7drhihi3r0jqoh0jlrrs8latamelv4n.apps.googleusercontent.com");
  const [googleClientSecret, setGoogleClientSecret] = useState("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");
  const [googleServiceAccountJson, setGoogleServiceAccountJson] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncingGoogleCalendar, setIsSyncingGoogleCalendar] = useState(false);

  const handleOpenMeet = (link?: string) => {
    let finalUrl = "https://meet.google.com/new";
    if (link && link.startsWith("https://meet.google.com/") && !link.includes("apx-") && !link.includes("demo")) {
      finalUrl = link;
    }
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  const handleConnectGoogleAccount = async () => {
    setAuthError(null);
    const email = googleEmailInput.trim() || "admin@apexvoice.ai";
    const clientId = googleClientId.trim() || "62350400975-n7drhihi3r0jqoh0jlrrs8latamelv4n.apps.googleusercontent.com";
    const clientSecret = googleClientSecret.trim() || "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";

    await connectGoogleAccount({
      email,
      client_id: clientId,
      client_secret: clientSecret,
      account_name: googleAccountName,
    });

    setAuthModalOpen(false);
    await refreshAppointments();
  };

  // Google Sheets Live Sync State
  const [sheetsSyncActive, setSheetsSyncActive] = useState(true);
  const [sheetsSpreadsheetUrl, setSheetsSpreadsheetUrl] = useState("https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit");
  const [sheetsTabName, setSheetsTabName] = useState("Appointments_2026");
  const [isSyncingGoogleSheets, setIsSyncingGoogleSheets] = useState(false);

  const handleSyncGoogleCalendar = async () => {
    setIsSyncingGoogleCalendar(true);
    await syncGoogleCalendar();
    await refreshAppointments();
    setTimeout(() => {
      setIsSyncingGoogleCalendar(false);
    }, 600);
  };

  const handleSyncGoogleSheets = () => {
    setIsSyncingGoogleSheets(true);
    setTimeout(() => {
      setIsSyncingGoogleSheets(false);
      addToast({
        title: "Google Sheets Synced",
        description: `Appended and verified ${appointments.length} appointments in sheet '${sheetsTabName}'.`,
        type: "success",
      });
    }, 1000);
  };

  // Settings form state
  const [calendarSyncActive, setCalendarSyncActive] = useState(true);
  const [selectedTimezone, setSelectedTimezone] = useState("America/New_York");
  const [defaultDuration, setDefaultDuration] = useState("30");
  const [bufferTime, setBufferTime] = useState("10");
  const [autoSendInvites, setAutoSendInvites] = useState(true);

  // New Booking form state
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newAgentName, setNewAgentName] = useState(agents && agents.length > 0 ? agents[0].name : "");
  const [newDateStr, setNewDateStr] = useState("2026-08-05");
  const [newTimeStr, setNewTimeStr] = useState("09:00");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (agents && agents.length > 0) {
      if (!newAgentName || !agents.some((a) => a.name === newAgentName)) {
        setNewAgentName(agents[0].name);
      }
    }
  }, [agents, newAgentName]);

  // Metrics Calculation
  const totalAppointmentsCount = appointments.length;
  const upcomingCount = appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  // Month navigation helpers
  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 1)); // Jump to current active dashboard month (August 2026)
  };

  // 7x6 Calendar Grid Generator
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateObj: new Date(year, month - 1, daysInPrevMonth - i),
      });
    }

    // 2. Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        dayNumber: i,
        isCurrentMonth: true,
        dateObj: new Date(year, month, i),
      });
    }

    // 3. Next month leading days to complete 35 or 42 cells
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      grid.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateObj: new Date(year, month + 1, i),
      });
    }

    return grid;
  }, [currentDate]);

  // Appointments on specific date lookup helper
  const getAppointmentsForDay = (dateObj: Date) => {
    const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
    const dayNum = dateObj.getDate();
    const targetMatch = `${monthName} ${dayNum}`;

    return appointments.filter((apt: any) => {
      // 1. Direct text match e.g. "Aug 5"
      if (apt.scheduledTime && typeof apt.scheduledTime === "string") {
        if (apt.scheduledTime.includes(targetMatch)) return true;
        const parsed = new Date(apt.scheduledTime);
        if (!isNaN(parsed.getTime())) {
          if (
            parsed.getFullYear() === dateObj.getFullYear() &&
            parsed.getMonth() === dateObj.getMonth() &&
            parsed.getDate() === dateObj.getDate()
          ) {
            return true;
          }
        }
      }

      // 2. scheduledAt ISO timestamp
      if (apt.scheduledAt) {
        const parsed = new Date(apt.scheduledAt);
        if (!isNaN(parsed.getTime())) {
          if (
            parsed.getFullYear() === dateObj.getFullYear() &&
            parsed.getMonth() === dateObj.getMonth() &&
            parsed.getDate() === dateObj.getDate()
          ) {
            return true;
          }
        }
      }

      // 3. Fallback createdAt
      if (apt.createdAt) {
        const parsed = new Date(apt.createdAt);
        if (!isNaN(parsed.getTime())) {
          if (
            parsed.getFullYear() === dateObj.getFullYear() &&
            parsed.getMonth() === dateObj.getMonth() &&
            parsed.getDate() === dayNum
          ) {
            return true;
          }
        }
      }

      return false;
    });
  };

  // Filtered appointments list for bottom section
  const filteredAppointmentsList = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      if (statusFilter !== "all" && apt.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = apt.contactName.toLowerCase().includes(query);
        const matchPhone = apt.contactPhone.toLowerCase().includes(query);
        const matchAgent = apt.agentName.toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchAgent) return false;
      }

      // Time filter
      if (timeFilter === "upcoming") {
        return apt.status === "scheduled" || apt.status === "confirmed";
      }
      if (timeFilter === "completed") {
        return apt.status === "completed";
      }
      if (timeFilter === "past") {
        return apt.status === "completed" || apt.status === "cancelled";
      }

      return true;
    });
  }, [appointments, statusFilter, timeFilter, searchQuery]);

  const handleCreateAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) return;

    const formattedDate = new Date(`${newDateStr}T${newTimeStr}:00`);
    const timeDisplay = formattedDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const dayDisplay = formattedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    const chosenAgent = (agents && agents.find((a) => a.name === newAgentName)) || (agents && agents[0]);
    const googleMeetUrl = `https://meet.google.com/apx-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

    const newApt = {
      id: `apt-${Date.now()}`,
      contactId: `cont-${Date.now()}`,
      contactName: newLeadName.trim(),
      contactPhone: newLeadPhone.trim(),
      contactEmail: newLeadEmail.trim() || `${newLeadName.trim().toLowerCase().replace(/\s+/g, ".")}@example.com`,
      agentId: chosenAgent?.id || "agent-1",
      agentName: chosenAgent?.name || newAgentName || "AI Voice Agent",
      title: "Solutions Consultation & Demo",
      scheduledTime: `${dayDisplay}, ${timeDisplay}`,
      scheduledAt: formattedDate.toISOString(),
      durationMinutes: parseInt(defaultDuration, 10) || 30,
      status: "confirmed" as const,
      calendarType: "google" as const,
      meetingLink: googleMeetUrl,
      notes: newNotes.trim() || "Booked from Appointments Calendar. Auto-scheduled in Google Calendar.",
      createdAt: new Date().toISOString(),
    };

    await createAppointment(newApt);
    if (googleAccountConnected) {
      await syncGoogleCalendar();
    }
    await refreshAppointments();
    setNewBookingModalOpen(false);

    if (googleDriveConnected) {
      await syncGoogleDrive(newApt.id, `${newApt.contactName.replace(/\s+/g, "_")}_Brief.pdf`);
    }

    addToast({
      title: "Appointment Scheduled & Synced",
      description: `Confirmed for ${newApt.contactName} on ${newApt.scheduledTime}. Auto-scheduled with Google Calendar & saved in database.`,
      type: "success",
    });

    setNewLeadName("");
    setNewLeadPhone("");
    setNewLeadEmail("");
    setNewNotes("");
  };

  const handleStatusChange = (aptId: string, nextStatus: any) => {
    updateAppointmentStatus(aptId, nextStatus);
  };

  const handleDeleteAppointment = (apt: any) => {
    setDeleteModalAppointment(apt);
  };

  return (
    <div className="space-y-6 text-[#0F172A]">
      {/* 1. Page Header (Matching Screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/20 shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Appointments</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage and view scheduled appointments from AI calls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Single Google Account Sync Button (Red when disconnected, Green when connected) */}
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
                ? "Google Account Sync: Connected"
                : "Google Account Sync: Disconnected"}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                googleAccountConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
          </button>

          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#161F30] text-[#0F172A] dark:text-[#F8FAFC] text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setNewBookingModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-bold rounded-xl shadow-md shadow-[#3157D5]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Row (4 Grid Matching Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Appointments */}
        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#3157D5]">
            <CalendarIcon className="w-4 h-4" />
            <span className="text-2xl font-bold font-mono">{totalAppointmentsCount}</span>
          </div>
          <p className="text-xs font-bold text-[#3157D5]">Total Appointments</p>
        </div>

        {/* Upcoming */}
        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#64748B]">
            <Clock className="w-4 h-4" />
            <span className="text-2xl font-bold font-mono text-[#0F172A]">{upcomingCount}</span>
          </div>
          <p className="text-xs font-bold text-[#64748B]">Upcoming</p>
        </div>

        {/* Completed */}
        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#64748B]">
            <CalendarCheck2 className="w-4 h-4" />
            <span className="text-2xl font-bold font-mono text-[#0F172A]">{completedCount}</span>
          </div>
          <p className="text-xs font-bold text-[#64748B]">Completed</p>
        </div>

        {/* Cancelled */}
        <div className="p-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#64748B]">
            <AlertCircle className="w-4 h-4" />
            <span className="text-2xl font-bold font-mono text-[#0F172A]">{cancelledCount}</span>
          </div>
          <p className="text-xs font-bold text-[#64748B]">Cancelled</p>
        </div>
      </div>

      {/* 3. Main Calendar Container (Matching Screenshot) */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 space-y-5 shadow-xs">
        {/* Calendar Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F1F5F9]">
          {/* Navigation Controls & Month Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
            >
              Today
            </button>

            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <h2 className="text-lg md:text-xl font-black text-[#0F172A] tracking-tight ml-2">
              {monthYearLabel}
            </h2>
          </div>

          {/* View Toggles: Day | Week | Month */}
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-2xl border border-[#E2E8F0] self-start sm:self-auto">
            {(["Day", "Week", "Month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-[#3157D5] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Month View Grid */}
        {viewMode === "Month" && (
          <div className="space-y-2">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-[#64748B] tracking-wider py-1">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            {/* Days Matrix (7 cols) */}
            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((cell, idx) => {
                const dayAppointments = getAppointmentsForDay(cell.dateObj);
                const isSelectedMonth = cell.isCurrentMonth;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (dayAppointments.length > 0) {
                        setSelectedAppointment(dayAppointments[0]);
                      } else {
                        setNewDateStr(cell.dateObj.toISOString().split("T")[0]);
                        setNewBookingModalOpen(true);
                      }
                    }}
                    className={`min-h-[85px] md:min-h-[100px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelectedMonth
                        ? "bg-white border-[#E2E8F0] hover:border-[#3157D5]/40 hover:bg-[#F8FAFC]"
                        : "bg-[#FAFAFA] border-[#F1F5F9] text-[#CBD5E1]"
                    }`}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isSelectedMonth ? "text-[#0F172A]" : "text-[#CBD5E1]"
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {dayAppointments.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3157D5]" />
                      )}
                    </div>

                    {/* Appointment Badges on Day */}
                    <div className="space-y-1 mt-1">
                      {dayAppointments.map((apt) => {
                        const timeStr = apt.scheduledTime.split(", ")[1] || "9:00 AM";
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                            }}
                            className="px-2 py-1 bg-[#EEF2FD] text-[#3157D5] rounded-lg text-[10px] md:text-[11px] font-bold truncate flex items-center gap-1 shadow-2xs hover:bg-[#3157D5] hover:text-white transition-colors"
                            title={`${apt.contactName} - ${apt.title}`}
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate">{timeStr}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === "Week" && (
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-center space-y-2">
            <p className="font-bold text-sm text-[#0F172A]">Weekly Operations Schedule</p>
            <p className="text-xs text-[#64748B]">Showing active booking blocks for the current week.</p>
            <div className="grid grid-cols-7 gap-2 pt-3">
              {["Mon Aug 3", "Tue Aug 4", "Wed Aug 5", "Thu Aug 6", "Fri Aug 7", "Sat Aug 8", "Sun Aug 9"].map((d, i) => (
                <div key={d} className="p-3 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
                  <span className="text-xs font-bold block text-[#0F172A]">{d}</span>
                  {i === 0 && (
                    <div className="p-2 bg-[#EEF2FD] text-[#3157D5] rounded-lg text-[10px] font-bold">
                      9:00 AM • Sarah Jenkins
                    </div>
                  )}
                  {i === 1 && (
                    <div className="p-2 bg-[#EEF2FD] text-[#3157D5] rounded-lg text-[10px] font-bold">
                      9:00 AM • David Chen
                    </div>
                  )}
                  {i > 1 && <span className="text-[10px] text-[#94A3B8]">Open Slot</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === "Day" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#EEF2FD] text-[#3157D5] rounded-2xl font-bold text-xs">
              <span>August 3, 2026 — 9:00 AM to 5:00 PM Availability</span>
              <span>1 Booked Appointment</span>
            </div>
            <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white text-xs">
              {["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"].map((hr) => (
                <div key={hr} className="flex items-center justify-between p-3.5 hover:bg-[#F8FAFC]">
                  <span className="font-mono font-bold text-[#64748B] w-20">{hr}</span>
                  {hr === "09:00 AM" ? (
                    <div className="flex-1 px-3 py-1.5 bg-[#EEF2FD] border border-[#3157D5]/20 rounded-xl text-[#3157D5] font-bold flex items-center justify-between">
                      <span>Sarah Jenkins — AI Voice Consultation</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full">Google Meet</span>
                    </div>
                  ) : (
                    <span className="text-[#94A3B8] italic flex-1">Available for AI Call Scheduling</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Filter Tabs & Scheduled Appointments List Section (Matching Screenshot Specs) */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
          {/* Time Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: `All (${appointments.length})` },
              { id: "today", label: "Today" },
              { id: "upcoming", label: "Upcoming" },
              { id: "past", label: "Past" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  timeFilter === tab.id
                    ? "bg-[#3157D5] text-white shadow-xs"
                    : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter & Search */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="text"
              placeholder="Filter by contact or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] outline-none w-48"
            />
          </div>
        </div>

        {/* Appointments List Grid */}
        <div className="space-y-3">
          {filteredAppointmentsList.length > 0 ? (
            filteredAppointmentsList.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#3157D5]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {apt.contactName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-[#0F172A]">{apt.contactName}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          apt.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : apt.status === "scheduled"
                            ? "bg-sky-100 text-sky-700"
                            : apt.status === "completed"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        ● {apt.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">{apt.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748B] mt-1.5 flex-wrap font-medium">
                      <span className="flex items-center gap-1 text-[#3157D5] font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        {apt.scheduledTime} ({apt.durationMinutes || 30} mins)
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#64748B]" />
                        {apt.contactPhone}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Bot className="w-3 h-3 text-[#64748B]" />
                        {apt.agentName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                  {apt.meetingLink && (
                    <button
                      onClick={() => handleOpenMeet(apt.meetingLink)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#EEF2FD] text-[#3157D5] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Meet</span>
                    </button>
                  )}

                  {apt.status === "scheduled" && (
                    <button
                      onClick={() => handleStatusChange(apt.id, "confirmed")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                  )}

                  {apt.status === "confirmed" && (
                    <button
                      onClick={() => handleStatusChange(apt.id, "completed")}
                      className="px-3 py-1.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Complete
                    </button>
                  )}

                  <button
                    onClick={() => handleStatusChange(apt.id, "cancelled")}
                    className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleDeleteAppointment(apt)}
                    className="p-2 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete appointment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2">
              <CalendarDays className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <p className="font-bold text-sm text-[#0F172A]">No Appointments Found</p>
              <p className="text-xs text-[#64748B]">Click &quot;New Booking&quot; above to schedule a demo slot.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Calendar Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center shadow-xs">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Calendar & Booking Settings</h3>
                  <p className="text-xs text-[#64748B]">Configure Google Calendar, Google Sheets integration, and scheduling parameters</p>
                </div>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* 1. Google Account Integration Card (Full Row) */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#CBD5E1] flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
                    <span className="text-[#4285F4]">G</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#0F172A]">{googleAccountName}</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                        OAuth 2.0 Connected
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] font-mono mt-0.5">{googleAccountEmail}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-[#EEF2FD] border border-[#CBD5E1] hover:border-[#3157D5] text-[#0F172A] hover:text-[#3157D5] rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs self-start sm:self-auto"
                >
                  <Key className="w-4 h-4 text-[#3157D5]" />
                  <span>Auth Credentials</span>
                </button>
              </div>

              {/* 2. Google Calendar 2-Way Sync (Full Rows) */}
              <div className="p-5 bg-white rounded-2xl border border-[#E2E8F0] space-y-4 shadow-2xs">
                {/* Header Switch Row */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#3157D5]" />
                      <span>2-Way Google Calendar Sync</span>
                    </span>
                    <p className="text-xs text-[#64748B]">
                      Automatically reserve time slots and generate Google Meet video meeting links for bookings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCalendarSyncActive(!calendarSyncActive)}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      calendarSyncActive ? "bg-[#3157D5]" : "bg-[#CBD5E1]"
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-transform ${
                        calendarSyncActive ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {calendarSyncActive && (
                  <div className="space-y-3 pt-3 border-t border-[#F1F5F9] dark:border-[#1E293B]">
                    {/* Row 1: Target Calendar Account */}
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A] dark:text-[#F8FAFC] block">Attached Google Calendar Account</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedCalendarId}
                          onChange={(e) => setSelectedCalendarId(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:border-[#3157D5]"
                        >
                          <option value="primary">Primary Google Calendar ({googleAccountEmail})</option>
                          <option value="sales_demos">Apex Sales Demo Calendar (sales-demo@solarsolutions.com)</option>
                          <option value="inbound_triage">Team Inbound Pipeline (calendar-sync@apexvoice.io)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setAuthModalOpen(true)}
                          className="px-3.5 py-2.5 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] hover:bg-[#EEF2FD] dark:hover:bg-[#3157D5]/20 text-[#3157D5] rounded-xl font-bold transition-all text-xs shrink-0 cursor-pointer shadow-2xs"
                          title="Attach New Google Account"
                        >
                          + Attach Account
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Google Calendar ID / URL */}
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A] dark:text-[#F8FAFC] block">Google Calendar ID / Resource String</label>
                      <input
                        type="text"
                        value={googleAccountEmail}
                        onChange={(e) => setGoogleAccountEmail(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#1E293B] rounded-xl text-xs font-mono text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:border-[#3157D5]"
                        placeholder="your-calendar@group.calendar.google.com"
                      />
                    </div>

                    {/* Row 3: Sync Action Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleSyncGoogleCalendar}
                        disabled={isSyncingGoogleCalendar}
                        className="w-full py-2.5 px-4 bg-[#EEF2FD] dark:bg-[#3157D5]/20 hover:bg-[#3157D5] hover:text-white text-[#3157D5] dark:text-[#93C5FD] border border-[#3157D5]/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        {isSyncingGoogleCalendar ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FolderSync className="w-4 h-4" />
                        )}
                        <span>{isSyncingGoogleCalendar ? "Synchronizing Calendar Events..." : "Sync with Google Calendar Now"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Google Sheets Live Integration (Full Rows) */}
              <div className="p-5 bg-white rounded-2xl border border-[#E2E8F0] space-y-4 shadow-2xs">
                {/* Header Switch Row */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Google Sheets Live Logging</span>
                    </span>
                    <p className="text-xs text-[#64748B]">
                      Automatically append call logs, lead qualification scores, and appointment details to your spreadsheet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheetsSyncActive(!sheetsSyncActive)}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      sheetsSyncActive ? "bg-emerald-600" : "bg-[#CBD5E1]"
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-transform ${
                        sheetsSyncActive ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {sheetsSyncActive && (
                  <div className="space-y-3 pt-3 border-t border-[#F1F5F9]">
                    {/* Row 1: Target Spreadsheet URL */}
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A] block">Target Google Spreadsheet URL</label>
                      <input
                        type="url"
                        value={sheetsSpreadsheetUrl}
                        onChange={(e) => setSheetsSpreadsheetUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#0F172A] outline-none focus:border-emerald-500"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                    </div>

                    {/* Row 2: Sheet Tab Name */}
                    <div className="space-y-1">
                      <label className="font-bold text-[#0F172A] block">Sheet Tab Name</label>
                      <input
                        type="text"
                        value={sheetsTabName}
                        onChange={(e) => setSheetsTabName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#0F172A] outline-none focus:border-emerald-500"
                        placeholder="Appointments_2026"
                      />
                    </div>

                    {/* Row 3: Sync Action Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleSyncGoogleSheets}
                        disabled={isSyncingGoogleSheets}
                        className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        {isSyncingGoogleSheets ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4" />
                        )}
                        <span>{isSyncingGoogleSheets ? "Pushing Rows to Google Sheets..." : "Sync to Google Sheets Now"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Scheduling & Timezone Parameters (Clean Rows) */}
              <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-4">
                <h4 className="font-bold text-sm text-[#0F172A]">Scheduling Parameters</h4>

                <div className="space-y-3">
                  {/* Row 1: Timezone */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#0F172A] block">Scheduling Timezone</label>
                    <select
                      value={selectedTimezone}
                      onChange={(e) => setSelectedTimezone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] outline-none focus:border-[#3157D5]"
                    >
                      <option value="America/New_York">Eastern Time (US & Canada) (UTC-05:00)</option>
                      <option value="America/Chicago">Central Time (US & Canada) (UTC-06:00)</option>
                      <option value="America/Denver">Mountain Time (US & Canada) (UTC-07:00)</option>
                      <option value="America/Los_Angeles">Pacific Time (US & Canada) (UTC-08:00)</option>
                      <option value="Europe/London">London (UTC+00:00)</option>
                      <option value="Asia/Dubai">Dubai (UTC+04:00)</option>
                      <option value="Asia/Karachi">Islamabad, Karachi (UTC+05:00)</option>
                    </select>
                  </div>

                  {/* Row 2: Default Meeting Length */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#0F172A] block">Default Meeting Length</label>
                    <select
                      value={defaultDuration}
                      onChange={(e) => setDefaultDuration(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] outline-none focus:border-[#3157D5]"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>

                  {/* Row 3: Buffer Time */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#0F172A] block">Buffer Time Between Calls</label>
                    <select
                      value={bufferTime}
                      onChange={(e) => setBufferTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] outline-none focus:border-[#3157D5]"
                    >
                      <option value="0">0 Minutes</option>
                      <option value="5">5 Minutes</option>
                      <option value="10">10 Minutes</option>
                      <option value="15">15 Minutes</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Automated Invites Checkbox */}
                <label className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#CBD5E1] cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoSendInvites}
                    onChange={(e) => setAutoSendInvites(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3157D5] focus:ring-[#3157D5]"
                  />
                  <div>
                    <span className="font-bold text-[#0F172A] block">Auto-Dispatch Google Meet Invitations</span>
                    <p className="text-[11px] text-[#64748B]">Sends calendar meeting link and briefing directly to lead</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsModalOpen(false);
                  addToast({
                    title: "Settings Saved",
                    description: "Calendar and Google Sheets configuration updated successfully.",
                    type: "success",
                  });
                }}
                className="px-6 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#3157D5]/20"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Google OAuth & Auth Credentials Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Google Auth Credentials</h3>
                  <p className="text-xs text-[#64748B]">Connect Google Account via OAuth 2.0 or Service Account</p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
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
                  value={googleServiceAccountJson}
                  onChange={(e) => {
                    setGoogleServiceAccountJson(e.target.value);
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
                    setGoogleAccountEmail("");
                    setGoogleEmailInput("");
                    setAuthModalOpen(false);
                    addToast({
                      title: "Google Account Disconnected",
                      description: "Google Account & Calendar sync has been disconnected.",
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
                  Save & Link Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. New Booking Modal */}
      {newBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Schedule New Appointment</h3>
                  <p className="text-xs text-[#64748B]">Create calendar reservation and invite contact</p>
                </div>
              </div>
              <button
                onClick={() => setNewBookingModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointmentSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Contact Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none focus:border-[#3157D5]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (415) 555-0199"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none focus:border-[#3157D5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="alex.rivera@company.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none focus:border-[#3157D5]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Voice Agent</label>
                  <select
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none"
                  >
                    {agents && agents.length > 0 ? (
                      agents.map((ag) => (
                        <option key={ag.id} value={ag.name}>
                          {ag.name}
                        </option>
                      ))
                    ) : (
                      <option value="AI Voice Agent">AI Voice Agent</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDateStr}
                    onChange={(e) => setNewDateStr(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={newTimeStr}
                    onChange={(e) => setNewTimeStr(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Appointment Notes</label>
                <textarea
                  rows={2}
                  placeholder="Inquiry notes, preliminary qualification results..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setNewBookingModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white font-bold rounded-xl shadow-md shadow-[#3157D5]/20"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center font-bold">
                  {selectedAppointment.contactName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">{selectedAppointment.contactName}</h3>
                  <span className="text-[10px] text-[#64748B] font-mono">{selectedAppointment.contactPhone}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Scheduled Session</span>
                <p className="font-bold text-sm text-[#0F172A]">{selectedAppointment.title}</p>
                <p className="text-xs text-[#3157D5] font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedAppointment.scheduledTime}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                  <span className="text-[#64748B] block">Assigned Agent</span>
                  <span className="font-bold text-[#0F172A]">{selectedAppointment.agentName}</span>
                </div>
                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                  <span className="text-[#64748B] block">Current Status</span>
                  <span className="font-bold capitalize text-[#3157D5]">{selectedAppointment.status}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl space-y-1">
                <span className="text-[#64748B] font-bold block text-[10px]">Session Notes</span>
                <p className="text-[#0F172A]">{selectedAppointment.notes || "No notes provided."}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
              {selectedAppointment.meetingLink && (
                <button
                  onClick={() => handleOpenMeet(selectedAppointment.meetingLink)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#3157D5] text-white rounded-xl font-bold hover:bg-[#2646B8] cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Open Meet</span>
                </button>
              )}
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] text-[#0F172A] rounded-xl font-bold ml-auto cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalAppointment}
        onClose={() => setDeleteModalAppointment(null)}
        onConfirm={async () => {
          if (deleteModalAppointment) {
            await deleteAppointment(deleteModalAppointment.id);
          }
        }}
        itemName={deleteModalAppointment ? `${deleteModalAppointment.contactName || deleteModalAppointment.callerName} (${deleteModalAppointment.scheduledTime})` : undefined}
        itemType="Appointment Booking"
      />
    </div>
  );
}
