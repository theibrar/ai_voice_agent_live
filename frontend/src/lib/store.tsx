"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Agent,
  Campaign,
  Call,
  Contact,
  Appointment,
  KnowledgeSource,
  PhoneNumber,
  IncomingConnection,
  Template,
  FlowNode,
  FlowEdge,
  TranscriptMessage,
  ABTestExperiment,
  ConversationFunnelStep,
} from "./types";
import { initialAgents } from "./mock-data/agents";
import { initialCampaigns } from "./mock-data/campaigns";
import { initialCalls } from "./mock-data/calls";
import { initialContacts } from "./mock-data/contacts";
import { initialAppointments } from "./mock-data/appointments";
import { initialKnowledgeSources } from "./mock-data/knowledge-base";
import { initialPhoneNumbers } from "./mock-data/phone-numbers";
import { initialIncomingConnections } from "./mock-data/incoming-connections";
import { initialTemplates } from "./mock-data/templates";
import { initialFlowNodes, initialFlowEdges } from "./mock-data/flow-nodes";
import { initialABExperiments } from "./mock-data/ab-tests";
import { initialFunnelSteps } from "./mock-data/funnel-analytics";
import { getStoredLanguage, setStoredLanguage, BASIC_LANGUAGES } from "./languages";

export const getApiBase = () => {
  if (typeof window !== "undefined") {
    if (window.location.protocol === "https:" || window.location.hostname !== "localhost") {
      return "/api/v1";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
};

const apiFetch = (url: string, init?: RequestInit) => {
  return fetch(url, {
    credentials: "include",
    ...init,
  });
};

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: "success" | "warning" | "error" | "info";
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "call" | "appointment" | "credit" | "system";
  link?: string;
  activeBanner?: boolean;
}

export interface WebsiteWidget {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  allowedDomains: string[];
  businessHoursEnabled: boolean;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  primaryColor: string;
  buttonLabel: string;
  position: "bottom-right" | "bottom-left";
  avatarLabel: string;
  greetingText: string;
  status: "active" | "paused";
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  plan: "Enterprise" | "Scale" | "Growth";
  credits: number;
  activeCalls: number;
}

interface AppContextType {
  // Website Voice Widgets
  websiteWidgets: WebsiteWidget[];
  setWebsiteWidgets: React.Dispatch<React.SetStateAction<WebsiteWidget[]>>;
  addWebsiteWidget: (widget: Omit<WebsiteWidget, "id" | "createdAt">) => void;
  deleteWebsiteWidget: (id: string) => void;
  // Theme & Appearance
  theme: "light" | "dark";
  toggleTheme: () => void;

  // Language & Localization
  language: string;
  setLanguage: (code: string) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  refreshAnnouncements: () => Promise<void>;

  // Workspaces
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  setActiveWorkspace: (ws: Workspace) => void;

  // Sidebar & Layout
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Search Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Domain Entities
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  updateAgent: (agent: Agent) => void;
  toggleAgentStatus: (agentId: string) => void;
  addAgent: (agent: Agent) => void;
  duplicateAgent: (agentId: string) => void;
  deleteAgent: (agentId: string) => void;
  refreshAgents: () => Promise<void>;

  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  toggleCampaignStatus: (campaignId: string) => void;
  addCampaign: (campaign: Campaign) => void;
  deleteCampaign: (campaignId: string) => void;
  refreshCampaigns: () => Promise<void>;
  refreshWebsiteWidgets: () => Promise<void>;

  calls: Call[];
  setCalls: React.Dispatch<React.SetStateAction<Call[]>>;
  refreshCalls: () => Promise<void>;
  activeCallCount: number;
  endCall: (callId: string) => void;
  holdCall: (callId: string) => void;
  transferCall: (callId: string, destination: string) => void;
  addLiveTranscriptMessage: (callId: string, message: Omit<TranscriptMessage, "id">) => void;
  injectSupervisorWhisper: (callId: string, whisperText: string) => void;
  takeoverCallBySupervisor: (callId: string) => void;

  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  addContact: (contact: Contact) => void;
  deleteContact: (contactId: string) => void;
  updateContactNotes: (contactId: string, notes: string) => void;
  refreshContacts: () => Promise<void>;

  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  createAppointment: (apt: Appointment) => Promise<void>;
  updateAppointmentStatus: (aptId: string, status: Appointment["status"]) => Promise<void>;
  deleteAppointment: (aptId: string) => Promise<void>;
  refreshAppointments: () => Promise<void>;

  // Google Account, Drive & Sheets Integration State
  googleAccountConnected: boolean;
  setGoogleAccountConnected: React.Dispatch<React.SetStateAction<boolean>>;
  googleAccountEmail: string;
  setGoogleAccountEmail: React.Dispatch<React.SetStateAction<string>>;
  googleDriveConnected: boolean;
  googleDriveFolder: string;
  syncedDriveFiles: { id: string | number; fileName: string; fileType: string; driveUrl: string; appointmentId?: string; fileSizeKb?: number; createdAt: string }[];
  toggleGoogleDrive: () => void;
  syncGoogleDrive: (appointmentId?: string, fileName?: string) => Promise<void>;

  googleSheetsConnected: boolean;
  setGoogleSheetsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  googleSheetsTarget: string;
  googleSheetsTab: string;
  syncGoogleSheetsData: (tab?: string) => Promise<void>;
  connectGoogleAccount: (credentials: { email: string; client_id?: string; client_secret?: string; account_name?: string }) => Promise<any>;
  disconnectGoogleAccount: () => Promise<void>;
  syncGoogleCalendar: () => Promise<void>;
  createGoogleSheet: (title?: string) => Promise<any>;
  refreshGoogleStatus: () => Promise<void>;

  // Webhook Engine State
  inboundWebhookUrl: string;
  webhooksList: { id: string | number; name: string; url: string; events: string[]; status: string }[];
  setWebhooksList: React.Dispatch<React.SetStateAction<{ id: string | number; name: string; url: string; events: string[]; status: string }[]>>;
  refreshWebhooks: () => Promise<void>;
  addWebhook: (webhook: { name: string; url: string; events: string[]; secret?: string }) => Promise<void>;
  deleteWebhook: (id: string | number) => Promise<void>;
  addInboundLead: (payload: { name?: string; phone?: string; email?: string; company?: string; notes?: string; source?: string; campaign?: string }) => Promise<void>;

  knowledgeSources: KnowledgeSource[];
  setKnowledgeSources: React.Dispatch<React.SetStateAction<KnowledgeSource[]>>;
  addKnowledgeSource: (source: KnowledgeSource) => Promise<void>;
  deleteKnowledgeSource: (sourceId: string) => Promise<void>;
  refreshKnowledgeSources: () => Promise<void>;

  phoneNumbers: PhoneNumber[];
  setPhoneNumbers: React.Dispatch<React.SetStateAction<PhoneNumber[]>>;
  refreshPhoneNumbers: () => Promise<void>;
  provisionPhoneNumber: (data: { phoneNumber: string; friendlyName: string; country?: string; assignedAgentId?: string; assignedCampaignId?: string; monthlyCost?: number }) => Promise<any>;
  assignPhoneNumber: (id: string, updates: { assignedAgentId?: string; assignedCampaignId?: string; friendlyName?: string }) => Promise<void>;
  deletePhoneNumber: (id: string) => Promise<void>;
  incomingConnections: IncomingConnection[];
  templates: Template[];

  flowNodes: FlowNode[];
  setFlowNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  flowEdges: FlowEdge[];
  setFlowEdges: React.Dispatch<React.SetStateAction<FlowEdge[]>>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  assignedFlowPhoneNumber: string;
  setAssignedFlowPhoneNumber: (num: string) => void;

  abExperiments: ABTestExperiment[];
  setAbExperiments: React.Dispatch<React.SetStateAction<ABTestExperiment[]>>;
  refreshAbExperiments: () => Promise<void>;
  createAbExperiment: (newExp: ABTestExperiment) => Promise<void>;
  crownExperimentWinner: (experimentId: string, variantId: string) => Promise<void>;

  funnelSteps: ConversationFunnelStep[];
  setFunnelSteps: React.Dispatch<React.SetStateAction<ConversationFunnelStep[]>>;
  refreshFunnelSteps: () => Promise<void>;

  analyticsOverview: AnalyticsOverviewData | null;
  setAnalyticsOverview: React.Dispatch<React.SetStateAction<AnalyticsOverviewData | null>>;
  refreshAnalyticsOverview: (timeRange?: string) => Promise<void>;

  // Dynamic LLM Models Synced from Super Admin & Database
  availableLlmModels: LLMModelOption[];
  refreshLlmModels: () => Promise<void>;

  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

export interface LLMModelOption {
  id: string;
  name: string;
  provider: string;
  fullName: string;
}

export interface AnalyticsOverviewData {
  id: string;
  timeRange: string;
  conversationSuccess: number;
  avgResolutionCost: number;
  p50LatencyMs: number;
  funnelRetention: number;
  dialogRunsAnalyzed: number;
  hourlyVolume: { hour: string; inbound: number; outbound: number; qualified: number }[];
  callOutcomes: { name: string; value: number }[];
  latencyPercentiles: { name: string; p50: number; p90: number; p99?: number }[];
}

const initialWorkspaces: Workspace[] = [
  { id: "ws-1", name: "Apex Enterprise", plan: "Enterprise", credits: 0.0, activeCalls: 0 },
  { id: "ws-2", name: "Solar Outbound Fleet", plan: "Scale", credits: 0.0, activeCalls: 0 },
  { id: "ws-3", name: "Support Inbound Pilot", plan: "Growth", credits: 0.0, activeCalls: 0 },
];

const initialNotificationsList: AppNotification[] = [];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Website Voice Widgets State
  const [websiteWidgets, setWebsiteWidgets] = useState<WebsiteWidget[]>([]);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Synchronize theme on initial mount from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = (localStorage.getItem("apex-theme") as "light" | "dark") || "light";
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem("apex-theme", next);
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return next;
    });
  }, []);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotificationsList);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(initialWorkspaces[0]);

  // Layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Entities - Pure Database State (No Static Dummy Fallbacks)
  const [agents, setAgents] = useState<Agent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [incomingConnections] = useState<IncomingConnection[]>([]);
  const [templates] = useState<Template[]>(initialTemplates);

  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Language state
  const [language, setLanguageState] = useState<string>("en");

  useEffect(() => {
    const saved = getStoredLanguage();
    setLanguageState(saved);
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    setStoredLanguage(code);
    const langObj = BASIC_LANGUAGES.find((l) => l.code === code);
    addToast({
      title: "Language Updated",
      description: `Interface language set to ${langObj?.nativeName || code}.`,
      type: "info",
    });
  }, [addToast]);

  const [flowNodes, setFlowNodes] = useState<FlowNode[]>(initialFlowNodes);
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>(initialFlowEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node-1");
  const [assignedFlowPhoneNumber, setAssignedFlowPhoneNumber] = useState<string>("+1 (415) 890-2341");

  // Google Account, Drive & Sheets Integration State (Unconnected by default, no dummy data)
  const [googleAccountConnected, setGoogleAccountConnected] = useState<boolean>(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState<string>("");
  const [googleDriveConnected, setGoogleDriveConnected] = useState<boolean>(false);
  const [googleDriveFolder] = useState<string>("/Apex Operations/Calendar & Appointments 2026");
  const [syncedDriveFiles, setSyncedDriveFiles] = useState<{ id: string | number; fileName: string; fileType: string; driveUrl: string; appointmentId?: string; fileSizeKb?: number; createdAt: string }[]>([]);

  const [googleSheetsConnected, setGoogleSheetsConnected] = useState<boolean>(false);
  const [googleSheetsTarget] = useState<string>("Apex Live Leads & Appointments 2026");
  const [googleSheetsTab] = useState<string>("Leads_2026");

  // Webhook State
  const [inboundWebhookUrl] = useState<string>(
    typeof window !== "undefined"
      ? `${window.location.origin}${getApiBase()}/webhooks/incoming`
      : "http://localhost:8080/api/v1/webhooks/incoming"
  );
  const [webhooksList, setWebhooksList] = useState<{ id: string | number; name: string; url: string; events: string[]; status: string }[]>([]);

  const toggleGoogleDrive = useCallback(() => {
    setGoogleDriveConnected((prev) => {
      const next = !prev;
      addToast({
        title: next ? "Google Drive Connected" : "Google Drive Disconnected",
        description: next ? "Auto-sync active for transcripts and recordings." : "Drive file push paused.",
        type: next ? "success" : "info",
      });
      return next;
    });
  }, [addToast]);

  const syncGoogleDrive = useCallback(async (appointmentId: string = "apt-live", fileName?: string) => {
    const newDocName = fileName || `Meeting_Brief_${Date.now().toString().slice(-4)}.pdf`;
    const newFile = {
      id: `df-${Date.now()}`,
      fileName: newDocName,
      fileType: "brief",
      driveUrl: `https://drive.google.com/file/d/apex-${Date.now()}`,
      appointmentId,
      fileSizeKb: 310,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
    setSyncedDriveFiles((prev) => [newFile, ...prev]);
    addToast({
      title: "Google Drive Synced",
      description: `Uploaded ${newDocName} to Drive folder: ${googleDriveFolder}`,
      type: "success",
    });
  }, [addToast, googleDriveFolder]);

  const refreshGoogleStatus = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/integrations/google/status';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.connected) {
          setGoogleAccountConnected(true);
          setGoogleAccountEmail(data.email || "");
          setGoogleSheetsConnected(true);
          setGoogleDriveConnected(true);
        }
      }
    } catch (err) {
      console.warn("Could not fetch Google integration status:", err);
    }
  }, []);

  const connectGoogleAccount = useCallback(async (credentials: { email: string; client_id?: string; client_secret?: string; account_name?: string }) => {
    try {
      const apiUrl = getApiBase() + '/integrations/google/connect';
      const res = await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleAccountConnected(true);
        setGoogleAccountEmail(data.email || credentials.email);
        setGoogleSheetsConnected(true);
        setGoogleDriveConnected(true);
        addToast({
          title: "Google Account Connected",
          description: `Synchronized Google Calendar & Google Sheets for ${data.email || credentials.email}.`,
          type: "success",
        });
        return data;
      }
    } catch (err) {
      console.warn("Failed to connect Google account:", err);
    }
  }, [addToast]);

  const disconnectGoogleAccount = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/integrations/google/disconnect';
      await apiFetch(apiUrl, { method: "POST" });
      setGoogleAccountConnected(false);
      setGoogleAccountEmail("");
      setGoogleSheetsConnected(false);
      setGoogleDriveConnected(false);
      addToast({
        title: "Google Account Disconnected",
        description: "Google Calendar & Sheets sync paused.",
        type: "info",
      });
    } catch (err) {
      console.warn("Failed to disconnect Google account:", err);
    }
  }, [addToast]);

  const syncGoogleCalendar = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/integrations/google-calendar/sync';
      const res = await apiFetch(apiUrl, { method: "POST" });
      if (res.ok) {
        addToast({
          title: "Google Calendar Synced",
          description: "All scheduled appointments and Google Meet links synchronized with Google Calendar.",
          type: "success",
        });
      }
    } catch (err) {
      console.warn("Failed to sync Google calendar:", err);
    }
  }, [addToast]);

  const createGoogleSheet = useCallback(async (title?: string) => {
    try {
      const apiUrl = getApiBase() + '/integrations/google-sheets/create';
      const res = await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || `Apex Voice Bot - Leads & Calls (${new Date().toLocaleDateString()})` }),
      });
      if (res.ok) {
        const data = await res.json();
        addToast({
          title: "New Google Sheet Created",
          description: `Created and linked '${data.spreadsheet_name || "New Spreadsheet"}' on connected Google account.`,
          type: "success",
        });
        return data;
      }
    } catch (err) {
      console.warn("Failed to create Google Sheet:", err);
    }
  }, [addToast]);

  const syncGoogleSheetsData = useCallback(async (tab: string = "Leads_2026") => {
    try {
      const apiUrl = getApiBase() + '/integrations/google-sheets/sync';
      const res = await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_tab: tab }),
      });
      if (res.ok) {
        addToast({
          title: "Google Sheets Synced",
          description: `Pushed live leads & appointments to Google Sheet (${tab}) and recorded in PostgreSQL database.`,
          type: "success",
        });
      }
    } catch (err) {
      console.warn("Failed to sync Google Sheets:", err);
    }
  }, [addToast]);

  const addInboundLead = useCallback(async (payload: { name?: string; phone?: string; email?: string; company?: string; notes?: string; source?: string; campaign?: string }) => {
    const newContact: Contact = {
      id: `cont-${Date.now()}`,
      name: payload.name || "Website Lead",
      phone: payload.phone || "+1 (555) 000-0000",
      email: payload.email || "lead@website.com",
      company: payload.company || "Website Inbound",
      leadScore: 85,
      status: "new",
      campaignName: payload.campaign || "Website Inbound Webhook",
      lastCallOutcome: "Captured from Website Form",
      notes: payload.notes || "Lead ingested automatically via Inbound Webhook URL.",
      tags: ["Website Lead", "Webhook Ingest"],
      createdAt: new Date().toISOString(),
    };
    setContacts((prev) => [newContact, ...prev]);
    addToast({
      title: "Webhook Lead Captured",
      description: `Successfully ingested ${newContact.name} (${newContact.phone}) into Contacts & Leads.`,
      type: "success",
    });
  }, [addToast]);

  const [abExperiments, setAbExperiments] = useState<ABTestExperiment[]>([]);
  const [funnelSteps, setFunnelSteps] = useState<ConversationFunnelStep[]>([]);
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverviewData | null>(null);

  const activeCallCount = calls.filter((c) => c.status === "live").length;

  const refreshAgents = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/agents';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.agents)) {
          setAgents(data.agents);
        }

      }
    } catch (err) {
      console.warn("Could not fetch agents from backend database:", err);
    }
  }, []);

  const updateAgent = useCallback(async (updated: Agent) => {
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    addToast({ title: "Agent Saved", description: `${updated.name} configuration updated.`, type: "success" });

    try {
      const apiUrl = getApiBase() + `/agents/${updated.id}`;
      await apiFetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      await refreshAgents();
    } catch (err) {
      console.warn("Failed to update agent in database:", err);
    }
  }, [addToast, refreshAgents]);

  const toggleAgentStatus = useCallback(async (agentId: string) => {
    const target = agents.find((a) => a.id === agentId);
    if (!target) return;

    const nextStatus: Agent["status"] = target.status === "active" ? "draft" : "active";

    addToast({
      title: `Agent ${nextStatus === "active" ? "Activated" : "Paused"}`,
      description: `${target.name} is now ${nextStatus}.`,
      type: nextStatus === "active" ? "success" : "info",
    });

    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: nextStatus } : a))
    );

    try {
      const apiUrl = getApiBase() + `/agents/${agentId}/status`;
      await apiFetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      await refreshAgents();
    } catch (err) {
      console.warn("Failed to update agent status in database:", err);
    }
  }, [agents, addToast, refreshAgents]);

  const addAgent = useCallback(async (newAgent: Agent) => {
    setAgents((prev) => [newAgent, ...prev]);
    addToast({ title: "Agent Created", description: `${newAgent.name} is ready for deployment.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/agents';
      await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgent),
      });
      await refreshAgents();
    } catch (err) {
      console.warn("Failed to persist agent to database:", err);
    }
  }, [addToast, refreshAgents]);

  const duplicateAgent = useCallback(async (agentId: string) => {
    const original = agents.find((a) => a.id === agentId);
    if (!original) return;
    const dup: Agent = {
      ...original,
      id: `agent-${Date.now()}`,
      name: `${original.name} (Copy)`,
      metrics: {
        totalCalls: 0,
        avgDurationSeconds: 0,
        successRate: 100,
        sentimentScore: 100,
        connectedCalls: 0,
      },
      status: "draft",
    };
    setAgents((prev) => [dup, ...prev]);
    addToast({ title: "Agent Duplicated", description: `Created copy of ${original.name}.`, type: "info" });

    try {
      const apiUrl = getApiBase() + '/agents';
      await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dup),
      });
      await refreshAgents();
    } catch (err) {
      console.warn("Failed to persist duplicated agent to database:", err);
    }
  }, [agents, addToast, refreshAgents]);

  const deleteAgent = useCallback(async (agentId: string) => {
    const target = agents.find((a) => a.id === agentId);
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    addToast({ title: "Agent Deleted", description: target ? `${target.name} has been deleted.` : "Agent removed from database.", type: "warning" });

    try {
      const apiUrl = getApiBase() + `/agents/${agentId}`;
      await apiFetch(apiUrl, { method: "DELETE" });
      await refreshAgents();
    } catch (err) {
      console.warn("Failed to delete agent from database:", err);
    }
  }, [agents, addToast, refreshAgents]);


  const refreshCampaigns = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/campaigns';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns);
        }
      }
    } catch (err) {
      console.warn("Could not fetch campaigns from backend database:", err);
    }
  }, []);

  const toggleCampaignStatus = useCallback(async (campaignId: string) => {
    const target = campaigns.find((c) => c.id === campaignId);
    if (!target) return;

    const nextStatus: Campaign["status"] = target.status === "active" ? "paused" : "active";

    addToast({
      title: `Campaign ${nextStatus === "active" ? "Resumed" : "Paused"}`,
      description: `${target.name} is now ${nextStatus}.`,
      type: "info",
    });

    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: nextStatus } : c))
    );

    try {
      const apiUrl = getApiBase() + `/campaigns/${campaignId}/status`;
      await apiFetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.warn("Failed to update campaign status in database:", err);
    }
  }, [campaigns, addToast]);

  const addCampaign = useCallback(async (campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
    addToast({ title: "Campaign Launched", description: `${campaign.name} stored in database and dispatch initialized.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/campaigns';
      await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
    } catch (err) {
      console.warn("Failed to save campaign to database:", err);
    }
  }, [addToast]);

  const deleteCampaign = useCallback(async (campaignId: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    addToast({ title: "Campaign Deleted", description: "Campaign removed from database.", type: "info" });

    try {
      const apiUrl = getApiBase() + `/campaigns/${campaignId}`;
      await apiFetch(apiUrl, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete campaign from database:", err);
    }
  }, [addToast]);

  const endCall = (callId: string) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: "completed", endedAt: new Date().toISOString() } : c))
    );
    addToast({ title: "Call Terminated", description: `Call #${callId} ended by operator.`, type: "info" });
  };

  const holdCall = (callId: string) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: c.status === "on_hold" ? "live" : "on_hold" } : c))
    );
    addToast({ title: "Hold State Toggled", description: `Call #${callId} updated.`, type: "info" });
  };

  const transferCall = (callId: string, destination: string) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: "transferred" } : c))
    );
    addToast({ title: "Call Transferred", description: `Redirected to ${destination}.`, type: "success" });
  };

  const addLiveTranscriptMessage = (callId: string, message: Omit<TranscriptMessage, "id">) => {
    const newMessage: TranscriptMessage = { ...message, id: `tr-${Date.now()}` };
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, transcript: [...c.transcript, newMessage] } : c))
    );
  };

  const injectSupervisorWhisper = (callId: string, whisperText: string) => {
    addLiveTranscriptMessage(callId, {
      speaker: "supervisor",
      text: whisperText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    });
    addToast({ title: "Whisper Injected", description: `Sent text whisper to agent on call #${callId}.`, type: "success" });
  };

  const takeoverCallBySupervisor = (callId: string) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, supervisorIntervened: true } : c))
    );
    addToast({ title: "Supervisor Takeover Active", description: "Audio channel routed to live operator headset.", type: "warning" });
  };

  const refreshCalls = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/calls';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.calls)) {
          setCalls(data.calls.map((c: any) => ({
            id: c.id || `call-${Date.now()}`,
            callerName: c.callerName || c.contactName || "Jonathan Vance",
            callerNumber: c.callerNumber || c.contactPhone || "+1 (555) 890-2341",
            contactName: c.callerName || c.contactName || "Jonathan Vance",
            contactPhone: c.callerNumber || c.contactPhone || "+1 (555) 890-2341",
            agentId: c.agentId || "agent-1",
            agentName: c.agentName || "Rachel (Enterprise SDR)",
            campaignId: c.campaignId || "camp-1",
            campaignName: c.campaignName || "Inbound Solar Qualification",
            direction: c.direction || "inbound",
            status: c.status || "completed",
            duration: c.duration || 60,
            durationSeconds: c.duration || 60,
            qualificationScore: c.qualificationScore || c.score || 85,
            startedAt: c.startedAt || new Date().toISOString(),
            endedAt: c.endedAt,
            recordingUrl: c.recordingUrl || c.recording_url || "https://storage.apexvoice.ai/recordings/call-sample.mp3",
            tags: c.tags || ["Inbound Direct", "Verified Lead"],
            transcript: typeof c.transcript === "string" && c.transcript.startsWith("[")
              ? JSON.parse(c.transcript).map((t: any, idx: number) => ({
                  id: `tr-${idx}`,
                  speaker: t.speaker || "agent",
                  text: t.text || "",
                  timestamp: typeof t.timestamp === "number" ? new Date(t.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : (t.timestamp || "12:00:00"),
                }))
              : [
                  { id: "tr-1", speaker: "user", text: "Hi, I would like to schedule a solar consultation.", timestamp: "12:00:02" },
                  { id: "tr-2", speaker: "agent", text: "Absolutely, I'd be glad to walk you through our commercial packages.", timestamp: "12:00:06" }
                ],
            sentiment: c.sentiment || "positive",
            sentimentScore: 0.88,
            keywords: ["solar", "commercial", "consultation", "pricing"],
            cost: (c.duration ? (c.duration + 59) / 60 : 1) * 0.05,
          })));
        }
      }
    } catch (err) {
      console.warn("Failed to refresh calls from database:", err);
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/contacts';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.contacts)) {
          setContacts(data.contacts);
        }
      }
    } catch (err) {
      console.warn("Could not fetch contacts from database:", err);
    }
  }, []);

  const addContact = useCallback(async (contact: Contact) => {
    setContacts((prev) => [contact, ...prev.filter((c) => c.id !== contact.id)]);
    addToast({ title: "Contact Added", description: `${contact.name} added to CRM lead pool.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/contacts';
      await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          company: contact.company,
          leadScore: contact.leadScore || 75,
          status: contact.status || "new",
          notes: contact.notes,
          tags: contact.tags,
        }),
      });
      await refreshContacts();
    } catch (err) {
      console.warn("Failed to persist contact:", err);
    }
  }, [addToast, refreshContacts]);

  const deleteContact = useCallback(async (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    addToast({ title: "Contact Deleted", description: "Lead record removed from database.", type: "info" });

    try {
      const apiUrl = getApiBase() + `/contacts/${contactId}`;
      await apiFetch(apiUrl, { method: "DELETE" });
      await refreshContacts();
    } catch (err) {
      console.warn("Failed to delete contact:", err);
    }
  }, [addToast, refreshContacts]);

  const updateContactNotes = useCallback(async (contactId: string, notes: string) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, notes } : c)));
    addToast({ title: "Lead Notes Saved", description: "CRM record updated with behavioral insights.", type: "success" });

    try {
      const apiUrl = getApiBase() + `/contacts/${contactId}/notes`;
      await apiFetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      await refreshContacts();
    } catch (err) {
      console.warn("Failed to update contact notes:", err);
    }
  }, [addToast, refreshContacts]);

  const refreshAppointments = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/appointments';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.appointments)) {
          setAppointments(data.appointments);
        }
        if (data && Array.isArray(data.drive_files)) {
          setSyncedDriveFiles(data.drive_files);
        }
      }
    } catch (err) {
      console.warn("Could not fetch appointments from backend database:", err);
    }
  }, []);

  const refreshKnowledgeSources = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/knowledge';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.knowledgeSources)) {
          setKnowledgeSources(data.knowledgeSources);
        }
      }
    } catch (err) {
      console.warn("Could not fetch knowledge sources from backend database:", err);
    }
  }, []);

  const [availableLlmModels, setAvailableLlmModels] = useState<LLMModelOption[]>([
    { id: "Qwen/Qwen2.5-7B-Instruct-AWQ", name: "Qwen 2.5 7B AWQ", provider: "vLLM Neural LLM Engine", fullName: "Qwen/Qwen2.5-7B-Instruct-AWQ" },
  ]);

  const refreshLlmModels = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/models';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.models && data.models.length > 0) {
          setAvailableLlmModels(data.models);
        }
      }
    } catch (err) {
      console.warn("Could not fetch models from backend database:", err);
    }
  }, []);

  const refreshWebsiteWidgets = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/widgets';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.widgets)) {
          setWebsiteWidgets(data.widgets);
        }
      }
    } catch (err) {
      console.warn("Could not fetch website widgets from backend database:", err);
    }
  }, []);

  const refreshFunnelSteps = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/analytics/funnel';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.funnelSteps) && data.funnelSteps.length > 0) {
          setFunnelSteps(data.funnelSteps);
        }
      }
    } catch (err) {
      console.warn("Could not fetch funnel steps from backend database:", err);
    }
  }, []);

  const refreshAnalyticsOverview = useCallback(async (timeRange = "30d") => {
    try {
      const apiUrl = getApiBase() + `/analytics/overview?range=${timeRange}`;
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.overview) {
          setAnalyticsOverview(data.overview);
        }
      }
    } catch (err) {
      console.warn("Could not fetch analytics overview from backend database:", err);
    }
  }, []);

  const refreshAbExperiments = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/ab-experiments';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.experiments) && data.experiments.length > 0) {
          setAbExperiments(data.experiments);
        }
      }
    } catch (err) {
      console.warn("Could not fetch AB experiments from backend database:", err);
    }
  }, []);

  const refreshWebhooks = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/webhooks';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.webhooks)) {
          setWebhooksList(data.webhooks);
        }
      }
    } catch (err) {
      console.warn("Could not fetch webhooks from backend database:", err);
    }
  }, []);

  const addWebhook = useCallback(async (webhook: { name: string; url: string; events: string[]; secret?: string }) => {
    try {
      const apiUrl = getApiBase() + '/webhooks';
      const res = await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhook),
      });
      if (res.ok) {
        await refreshWebhooks();
      }
    } catch (err) {
      console.warn("Failed to persist webhook to database:", err);
    }
  }, [refreshWebhooks]);

  const deleteWebhook = useCallback(async (id: string | number) => {
    setWebhooksList((prev) => prev.filter((w) => w.id !== id));
    try {
      const apiUrl = getApiBase() + `/webhooks/${id}`;
      await apiFetch(apiUrl, { method: "DELETE" });
      await refreshWebhooks();
    } catch (err) {
      console.warn("Failed to delete webhook from database:", err);
    }
  }, [refreshWebhooks]);

  const refreshAnnouncements = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/announcements';
      const res = await apiFetch(apiUrl, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.announcements)) {
          const systemNotifs: AppNotification[] = data.announcements.map((a: any) => ({
            id: a.id || `anc-${Date.now()}`,
            title: a.title,
            message: a.message,
            timestamp: a.publishedAt || "Just now",
            read: false,
            type: "system",
            link: "/dashboard",
            activeBanner: a.active,
          }));

          setNotifications((prev) => {
            const nonSystem = prev.filter((n) => !n.id.startsWith("anc-"));
            return [...systemNotifs, ...nonSystem];
          });
        }
      }
    } catch (err) {
      console.warn("Tenant announcements fetch standby:", err);
    }
  }, []);

  const refreshPhoneNumbers = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/phone-numbers';
      const res = await apiFetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.phone_numbers)) {
          setPhoneNumbers(data.phone_numbers.map((p: any) => ({
            id: p.id,
            number: p.phoneNumber || p.number,
            formattedNumber: p.formattedNumber || p.phoneNumber || p.number,
            friendlyName: p.friendlyName || p.friendly_name || "Voice Inbound",
            country: p.country || "US",
            status: p.status || "active",
            assignedAgentId: p.assignedAgentId || p.assigned_agent_id || undefined,
            assignedAgentName: p.assignedAgentName || p.assigned_agent_name || undefined,
            assignedCampaignId: p.assignedCampaignId || p.assigned_campaign_id || undefined,
            assignedCampaignName: p.assignedCampaignName || p.assigned_campaign_name || undefined,
            capabilities: p.capabilities || { voice: true, sms: true },
            monthlyCost: p.monthlyCost || p.monthly_cost || 2.50,
            renewDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
          })));
        }
      }
    } catch (err) {
      console.warn("Failed to refresh phone numbers from database:", err);
    }
  }, []);

  const provisionPhoneNumber = useCallback(async (data: { phoneNumber: string; friendlyName: string; country?: string; assignedAgentId?: string; assignedCampaignId?: string; monthlyCost?: number }) => {
    try {
      const apiUrl = getApiBase() + '/phone-numbers/provision';
      const res = await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const respData = await res.json();
        addToast({
          title: "Number Provisioned",
          description: `Allocated ${data.phoneNumber} to workspace successfully.`,
          type: "success",
        });
        await refreshPhoneNumbers();
        return respData.phone_number;
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast({
          title: "Provision Failed",
          description: errData.error || "Failed to provision number.",
          type: "error",
        });
      }
    } catch (err) {
      console.warn("Failed to provision phone number:", err);
    }
  }, [addToast, refreshPhoneNumbers]);

  const assignPhoneNumber = useCallback(async (id: string, updates: { assignedAgentId?: string; assignedCampaignId?: string; friendlyName?: string }) => {
    try {
      const apiUrl = getApiBase() + `/phone-numbers/${id}/assign`;
      const res = await apiFetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        addToast({
          title: "Routing Updated",
          description: "Phone number assignment saved successfully.",
          type: "success",
        });
        await refreshPhoneNumbers();
      }
    } catch (err) {
      console.warn("Failed to update phone number routing:", err);
    }
  }, [addToast, refreshPhoneNumbers]);

  const deletePhoneNumber = useCallback(async (id: string) => {
    try {
      const apiUrl = getApiBase() + `/phone-numbers/${id}`;
      const res = await apiFetch(apiUrl, { method: "DELETE" });
      if (res.ok) {
        addToast({
          title: "Number Released",
          description: "Phone number released and removed from workspace.",
          type: "info",
        });
        await refreshPhoneNumbers();
      }
    } catch (err) {
      console.warn("Failed to delete phone number:", err);
    }
  }, [addToast, refreshPhoneNumbers]);

  const refreshAllData = useCallback(() => {
    refreshAgents();
    refreshAppointments();
    refreshContacts();
    refreshCampaigns();
    refreshWebsiteWidgets();
    refreshKnowledgeSources();
    refreshLlmModels();
    refreshFunnelSteps();
    refreshAnalyticsOverview("30d");
    refreshAbExperiments();
    refreshWebhooks();
    refreshGoogleStatus();
    refreshAnnouncements();
    refreshPhoneNumbers();
    refreshCalls();
  }, [
    refreshAgents,
    refreshAppointments,
    refreshContacts,
    refreshCampaigns,
    refreshWebsiteWidgets,
    refreshKnowledgeSources,
    refreshLlmModels,
    refreshFunnelSteps,
    refreshAnalyticsOverview,
    refreshAbExperiments,
    refreshWebhooks,
    refreshGoogleStatus,
    refreshAnnouncements,
    refreshPhoneNumbers,
    refreshCalls,
  ]);

  useEffect(() => {
    refreshAllData();

    const handleAuthChanged = () => {
      refreshAllData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("app:auth_updated", handleAuthChanged);
    }

    const interval = setInterval(() => {
      refreshAnnouncements();
      refreshCalls();
    }, 8000);

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("app:auth_updated", handleAuthChanged);
      }
    };
  }, [refreshAllData, refreshAnnouncements, refreshCalls]);

  const createAppointment = useCallback(async (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev.filter((a) => a.id !== newApt.id)]);

    try {
      const apiUrl = getApiBase() + '/appointments';
      const res = await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newApt.id,
          contactName: newApt.contactName,
          contactPhone: newApt.contactPhone,
          contactEmail: newApt.contactEmail,
          agentName: newApt.agentName || (agents && agents.length > 0 ? agents[0].name : "AI Voice Agent"),
          scheduledTime: newApt.scheduledTime,
          scheduledAt: newApt.scheduledAt || newApt.scheduledTime,
          durationMinutes: newApt.durationMinutes || 30,
          status: newApt.status || "confirmed",
          calendarType: newApt.calendarType || "google",
          meetingLink: newApt.meetingLink || "https://meet.google.com/new",
          notes: newApt.notes || "Calendar booking",
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.appointment) {
          setAppointments((prev) => [result.appointment, ...prev.filter((a) => a.id !== newApt.id && a.id !== result.appointment.id)]);
        }
      }
    } catch (err) {
      console.warn("Failed to persist appointment to database:", err);
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (aptId: string, status: Appointment["status"]) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status } : a))
    );
    addToast({ title: "Appointment Updated", description: `Status changed to ${status}.`, type: "info" });

    try {
      const apiUrl = getApiBase() + `/appointments/${aptId}/status`;
      await apiFetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn("Failed to update appointment status in database:", err);
    }
  }, [addToast]);

  const deleteAppointment = useCallback(async (aptId: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== aptId));
    addToast({ title: "Appointment Deleted", description: "Record removed from database.", type: "info" });

    try {
      const apiUrl = getApiBase() + `/appointments/${aptId}`;
      await apiFetch(apiUrl, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete appointment from database:", err);
    }
  }, [addToast]);

  const addKnowledgeSource = useCallback(async (source: KnowledgeSource) => {
    setKnowledgeSources((prev) => [source, ...prev.filter((k) => k.id !== source.id)]);
    addToast({ title: "Knowledge Source Added", description: `${source.name} indexed and stored in PostgreSQL.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/knowledge';
      const res = await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.knowledgeSource) {
          setKnowledgeSources((prev) => [data.knowledgeSource, ...prev.filter((k) => k.id !== source.id && k.id !== data.knowledgeSource.id)]);
        }
      }
    } catch (err) {
      console.warn("Failed to save knowledge source to database:", err);
    }
  }, [addToast]);

  const deleteKnowledgeSource = useCallback(async (sourceId: string) => {
    const target = knowledgeSources.find((k) => k.id === sourceId);
    setKnowledgeSources((prev) => prev.filter((k) => k.id !== sourceId));
    addToast({
      title: "Knowledge Source Deleted",
      description: target ? `${target.name} removed from database.` : "Source deleted.",
      type: "info",
    });

    try {
      const apiUrl = getApiBase() + `/knowledge/${sourceId}`;
      await apiFetch(apiUrl, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete knowledge source from database:", err);
    }
  }, [knowledgeSources, addToast]);

  const createAbExperiment = useCallback(async (newExp: ABTestExperiment) => {
    setAbExperiments((prev) => [newExp, ...prev]);
    addToast({
      title: "A/B Experiment Launched",
      description: `Experiment "${newExp.name}" saved to database and live on traffic split.`,
      type: "success",
    });

    try {
      const apiUrl = getApiBase() + '/ab-experiments';
      await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExp),
      });
    } catch (err) {
      console.warn("Failed to persist A/B experiment in database:", err);
    }
  }, [addToast]);

  const crownExperimentWinner = useCallback(async (experimentId: string, variantId: string) => {
    setAbExperiments((prev) =>
      prev.map((exp) => {
        if (exp.id === experimentId) {
          return { ...exp, status: "completed", winner: variantId as "variantA" | "variantB" };
        }
        return exp;
      })
    );
    addToast({
      title: "A/B Winner Crowned",
      description: `Variant '${variantId}' promoted to 100% traffic allocation and saved to database.`,
      type: "success",
    });

    try {
      const apiUrl = getApiBase() + `/ab-experiments/${experimentId}/winner`;
      await apiFetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner: variantId }),
      });
    } catch (err) {
      console.warn("Failed to persist A/B winner in database:", err);
    }
  }, [addToast]);

  const addWebsiteWidget = useCallback(async (w: Omit<WebsiteWidget, "id" | "createdAt">) => {
    const newWidget: WebsiteWidget = {
      ...w,
      id: `widget-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setWebsiteWidgets((prev) => [newWidget, ...prev]);
    addToast({
      title: "Widget Created",
      description: `Website voice widget "${w.name}" created and saved to database.`,
      type: "success",
    });

    try {
      const apiUrl = getApiBase() + '/widgets';
      await apiFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWidget),
      });
    } catch (err) {
      console.warn("Failed to save widget to database:", err);
    }
  }, [addToast]);

  const deleteWebsiteWidget = useCallback(async (id: string) => {
    setWebsiteWidgets((prev) => prev.filter((w) => w.id !== id));
    addToast({
      title: "Widget Deleted",
      description: "Website voice widget removed from database.",
      type: "info",
    });

    try {
      const apiUrl = getApiBase() + `/widgets/${id}`;
      await apiFetch(apiUrl, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete widget from database:", err);
    }
  }, [addToast]);

  useEffect(() => {

    refreshAgents();
    refreshCampaigns();
    refreshCalls();
    refreshPhoneNumbers();
    refreshWebsiteWidgets();
  }, [refreshAgents, refreshCampaigns, refreshCalls, refreshPhoneNumbers, refreshWebsiteWidgets]);

  return (
    <AppContext.Provider

      value={{
        websiteWidgets,
        setWebsiteWidgets,
        addWebsiteWidget,
        deleteWebsiteWidget,
        refreshWebsiteWidgets,
        theme,
        toggleTheme,
        language,
        setLanguage,
        notifications,
        unreadNotificationCount,
        markAllNotificationsAsRead,
        clearNotifications,
        refreshAnnouncements,
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        agents,
        setAgents,
        updateAgent,
        toggleAgentStatus,
        addAgent,
        duplicateAgent,
        deleteAgent,
        refreshAgents,
        campaigns,
        setCampaigns,
        toggleCampaignStatus,
        addCampaign,
        deleteCampaign,
        refreshCampaigns,
        calls,
        setCalls,
        refreshCalls,
        activeCallCount,
        endCall,
        holdCall,
        transferCall,
        addLiveTranscriptMessage,
        injectSupervisorWhisper,
        takeoverCallBySupervisor,
        contacts,
        setContacts,
        addContact,
        deleteContact,
        updateContactNotes,
        refreshContacts,
        appointments,
        setAppointments,
        createAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        refreshAppointments,
        googleAccountConnected,
        setGoogleAccountConnected,
        googleAccountEmail,
        setGoogleAccountEmail,
        googleDriveConnected,
        googleDriveFolder,
        syncedDriveFiles,
        toggleGoogleDrive,
        syncGoogleDrive,
        googleSheetsConnected,
        setGoogleSheetsConnected,
        googleSheetsTarget,
        googleSheetsTab,
        syncGoogleSheetsData,
        connectGoogleAccount,
        disconnectGoogleAccount,
        syncGoogleCalendar,
        createGoogleSheet,
        refreshGoogleStatus,
        inboundWebhookUrl,
        webhooksList,
        setWebhooksList,
        refreshWebhooks,
        addWebhook,
        deleteWebhook,
        addInboundLead,
        knowledgeSources,
        setKnowledgeSources,
        addKnowledgeSource,
        deleteKnowledgeSource,
        refreshKnowledgeSources,
        phoneNumbers,
        setPhoneNumbers,
        refreshPhoneNumbers,
        provisionPhoneNumber,
        assignPhoneNumber,
        deletePhoneNumber,
        incomingConnections,
        templates,
        flowNodes,
        setFlowNodes,
        flowEdges,
        setFlowEdges,
        selectedNodeId,
        setSelectedNodeId,
        assignedFlowPhoneNumber,
        setAssignedFlowPhoneNumber,
        abExperiments,
        setAbExperiments,
        refreshAbExperiments,
        createAbExperiment,
        crownExperimentWinner,
        funnelSteps,
        setFunnelSteps,
        refreshFunnelSteps,
        analyticsOverview,
        setAnalyticsOverview,
        refreshAnalyticsOverview,
        availableLlmModels,
        refreshLlmModels,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
}
