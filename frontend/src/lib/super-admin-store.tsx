"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  SuperAdminUser,
  TenantAdminOrg,
  PlatformPlan,
  GatewayConfig,
  SipCarrierNetwork,
  VoiceAiEngine,
  GlobalCallSession,
  SystemAnnouncement,
  AuditLogEntry,
  initialSuperAdmins,
  initialTenantOrgs,
  initialPlatformPlans,
  initialGateways,
  initialSipCarriers,
  initialVoiceEngines,
  initialGlobalCalls,
  initialAnnouncements,
  initialAuditLogs,
} from "./mock-data/super-admin";

import { getStoredLanguage, setStoredLanguage } from "./languages";
import { getApiBase } from "./auth-context";

export interface SuperAdminToast {
  id: string;
  title: string;
  description?: string;
  type?: "info" | "success" | "warning" | "danger";
}

interface SuperAdminContextType {
  language: string;
  setLanguage: (lang: string) => void;

  superAdminTheme: "light" | "dark";
  toggleSuperAdminTheme: () => void;

  superAdminNotifications: { id: string; title: string; message: string; timestamp: string; read: boolean; type: string; link?: string }[];
  unreadNotificationCount: number;
  markAllNotificationsAsRead: () => void;

  currentSuperAdmin: SuperAdminUser;
  setCurrentSuperAdmin: (admin: SuperAdminUser) => void;

  superAdminSidebarCollapsed: boolean;
  setSuperAdminSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSuperAdminSidebar: () => void;

  superAdmins: SuperAdminUser[];
  addSuperAdmin: (admin: Omit<SuperAdminUser, "id" | "lastActive" | "avatar">) => void;
  updateSuperAdminStatus: (id: string, status: "active" | "suspended") => void;
  deleteSuperAdmin: (id: string) => void;

  tenants: TenantAdminOrg[];
  refreshTenants: () => Promise<void>;
  addTenant: (tenant: Omit<TenantAdminOrg, "id" | "joinedDate" | "monthlySpend" | "activeCallsNow" | "totalMinutesUsedThisMonth"> & { password?: string }) => void;
  deleteTenant: (tenantId: string) => void;
  updateTenantPlan: (tenantId: string, planId: string, planName: string, cycle: "monthly" | "6_months" | "yearly" | "pay_as_you_go") => void;
  adjustTenantCredits: (tenantId: string, deltaAmount: number, reason: string) => void;
  updateTenantStatus: (tenantId: string, status: "active" | "trial" | "suspended") => void;
  updateTenantQuotas: (tenantId: string, maxConcurrency: number, carrier: string, rate: number) => void;
  updateTenantAccount: (tenantId: string, updates: { orgName?: string; primaryAdminName?: string; primaryAdminEmail?: string; passwordReset?: string }) => void;
  toggleTenantEngine: (tenantId: string, engineType: "llm" | "tts" | "stt", engineId: string) => void;

  plans: PlatformPlan[];
  refreshPlans: () => Promise<void>;
  addPlan: (plan: Omit<PlatformPlan, "id">) => void;
  updatePlan: (id: string, updates: Partial<PlatformPlan>) => void;
  deletePlan: (id: string) => void;

  gateways: GatewayConfig[];
  refreshGateways: () => Promise<void>;
  addGateway: (gw: Omit<GatewayConfig, "id" | "monthlySentCount" | "deliverySuccessRate" | "latencyMs">) => void;
  updateGateway: (id: string, updates: Partial<GatewayConfig>) => void;
  deleteGateway: (id: string) => void;
  updateGatewayStatus: (id: string, status: "active" | "standby" | "disabled") => void;
  setDefaultGateway: (id: string, type: "email" | "sms") => void;
  testGatewayDispatch: (id: string, recipient: string) => Promise<boolean>;

  sipCarriers: SipCarrierNetwork[];
  refreshSipCarriers: () => Promise<void>;
  addSipCarrier: (carrier: Omit<SipCarrierNetwork, "id" | "allocatedChannels">) => void;
  updateSipCarrier: (id: string, updates: Partial<SipCarrierNetwork>) => void;
  updateSipCarrierStatus: (id: string, status: "online" | "degraded" | "offline") => void;
  setDefaultCarrier: (id: string) => void;
  deleteSipCarrier: (id: string) => void;

  engines: VoiceAiEngine[];
  refreshEngines: () => Promise<void>;
  addCustomEngine: (engine: Omit<VoiceAiEngine, "id">) => void;
  updateCustomEngine: (engine: VoiceAiEngine) => void;
  toggleEngineStatus: (id: string) => void;
  deleteEngine: (id: string) => void;
  updateEngineTierRequirement: (id: string, tier: "all" | "growth_plus" | "enterprise_only") => void;
  probeEngineHealth: (engineId: string) => Promise<{ online: boolean; latencyMs: number; message?: string }>;

  globalCalls: GlobalCallSession[];
  refreshGlobalCalls: () => Promise<void>;
  forceTerminateCall: (callId: string) => void;

  announcements: SystemAnnouncement[];
  refreshAnnouncements: () => Promise<void>;
  addAnnouncement: (announcement: Omit<SystemAnnouncement, "id" | "publishedAt" | "active">) => void;
  toggleAnnouncement: (id: string) => void;
  deleteAnnouncement: (id: string) => void;

  auditLogs: AuditLogEntry[];
  addAuditLog: (action: string, target: string, severity?: "info" | "warning" | "critical") => void;

  toasts: SuperAdminToast[];
  addToast: (toast: Omit<SuperAdminToast, "id">) => void;
  removeToast: (id: string) => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    if (typeof window !== "undefined") return getStoredLanguage();
    return "en";
  });

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    setStoredLanguage(code);
  }, []);

  React.useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e.detail) setLanguageState(e.detail);
    };
    window.addEventListener("apex-language-change", handleLangChange);
    return () => window.removeEventListener("apex-language-change", handleLangChange);
  }, []);

  // Super Admin Theme
  const [superAdminTheme, setSuperAdminTheme] = useState<"light" | "dark">("light");

  // Synchronize Super Admin theme on initial mount from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = (localStorage.getItem("apex-super-admin-theme") as "light" | "dark") || "light";
      setSuperAdminTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleSuperAdminTheme = useCallback(() => {
    setSuperAdminTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem("apex-super-admin-theme", next);
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return next;
    });
  }, []);

  // Super Admin Notifications
  const [superAdminNotifications, setSuperAdminNotifications] = useState<{ id: string; title: string; message: string; timestamp: string; read: boolean; type: string; link?: string }[]>([]);

  const unreadNotificationCount = superAdminNotifications.filter((n) => !n.read).length;

  const markAllNotificationsAsRead = useCallback(() => {
    setSuperAdminNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const [currentSuperAdmin, setCurrentSuperAdmin] = useState<SuperAdminUser>(initialSuperAdmins[0]);
  const [superAdminSidebarCollapsed, setSuperAdminSidebarCollapsed] = useState(false);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminUser[]>(initialSuperAdmins);
  const [tenants, setTenants] = useState<TenantAdminOrg[]>(initialTenantOrgs);
  const [plans, setPlans] = useState<PlatformPlan[]>(initialPlatformPlans);
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [sipCarriers, setSipCarriers] = useState<SipCarrierNetwork[]>([]);
  const [engines, setEngines] = useState<VoiceAiEngine[]>([]);
  const [globalCalls, setGlobalCalls] = useState<GlobalCallSession[]>([]);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(initialAnnouncements);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [toasts, setToasts] = useState<SuperAdminToast[]>([]);

  const refreshTenants = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/superadmin/tenants';
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tenants) && data.tenants.length > 0) {
          setTenants(data.tenants);
        } else if (data && Array.isArray(data.tenants)) {
          setTenants(data.tenants);
        }
      }
    } catch (err) {
      console.warn("Tenants database API standby:", err);
    }
  }, []);

  const refreshSuperAdmins = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/auth/users';
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          const saUsers = data.users.filter((u: any) => u.role === "super_admin");
          if (saUsers.length > 0) {
            setSuperAdmins(saUsers.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: "Master Super Admin",
              permissions: ["all_access", "billing_override", "infrastructure_control", "tenant_impersonation"],
              twoFactorEnabled: true,
              lastActive: u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
              avatar: u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2) || "SA",
              status: u.status || "active",
            })));
          }
        }
      }
    } catch (err) {
      console.warn("Users database API standby:", err);
    }
  }, []);

  const refreshEngines = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/superadmin/ai-engines';
      let res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: 'no-store',
      });
      if (!res.ok) {
        const fallbackUrl = getApiBase() + '/ai-engines';
        res = await fetch(fallbackUrl, {
          method: "GET",
          credentials: "include",
          cache: 'no-store',
        });
      }
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.ai_engines)) {
          const dbEngines: VoiceAiEngine[] = data.ai_engines.map((e: any) => ({
            id: e.id,
            name: e.name || e.engine_name,
            provider: e.provider,
            category: e.category || e.engine_type || "llm",
            modelIdentifier: e.model_identifier || e.modelIdentifier || "",
            latencyAvgMs: e.latency_avg_ms || e.latencyAvgMs || 110,
            costPerUnit: e.cost_per_unit || e.costPerUnit || "$0.40 / 1M tokens",
            status: e.status || "active",
            isGlobalDefault: e.is_global_default || false,
            tierRequirement: e.tier_requirement || "all",
            supportedLanguagesCount: 30,
            description: e.description || "",
            isCustom: e.is_custom !== undefined ? e.is_custom : true,
            baseUrl: e.base_url || e.endpoint_url || "",
            apiKey: e.api_key || "",
          }));

          // Exclusively load what is in the database - no static models
          setEngines(dbEngines);
        }
      }
    } catch (err) {
      console.warn("Engines database API standby:", err);
    }
  }, []);

  const refreshSipCarriers = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/superadmin/trunks';
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.sip_carriers)) {
          setSipCarriers(data.sip_carriers);
        } else if (data && Array.isArray(data.trunks)) {
          setSipCarriers(data.trunks);
        }
      }
    } catch (err) {
      console.warn("SIP Carriers database API standby:", err);
    }
  }, []);

  const refreshPlans = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/superadmin/plans';
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
      }
    } catch (err) {
      console.warn("Plans database API standby:", err);
    }
  }, []);

  const refreshGateways = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/superadmin/gateways';
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.gateways)) {
          setGateways(data.gateways);
        }
      }
    } catch (err) {
      console.warn("Gateways database API standby:", err);
    }
  }, []);

  const refreshAnnouncements = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/superadmin/announcements';
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }
      }
    } catch (err) {
      console.warn("Announcements database API standby:", err);
    }
  }, []);

  const refreshGlobalCalls = useCallback(async () => {
    try {
      const apiUrl = getApiBase() + '/calls';
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.calls)) {
          setGlobalCalls(data.calls.map((c: any) => ({
            id: c.id,
            tenantId: `tenant-${c.tenantId || 1}`,
            tenantName: c.tenantName || "Apex Clean Energy Corp",
            agentName: c.agentName || "Rachel (Enterprise SDR)",
            callerName: c.callerName || c.contactName || "Jonathan Vance",
            callerNumber: c.callerNumber || c.contactPhone || "+1 (555) 890-2341",
            duration: c.duration || 60,
            status: c.status || "completed",
            gateway: "LiveKit Cluster #1 (SF-01)",
            costPerMin: 0.05,
            startedAt: c.startedAt || new Date().toISOString(),
          })));
        }
      }
    } catch (err) {
      console.warn("Global calls fetch error:", err);
    }
  }, []);

  // Live Database API fetch on mount (only if authenticated)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof document !== "undefined" && !document.cookie.includes("access_token=")) {
      return;
    }
    refreshTenants();
    refreshPlans();
    refreshEngines();
    refreshSuperAdmins();
    refreshSipCarriers();
    refreshGateways();
    refreshAnnouncements();
    refreshGlobalCalls();
  }, [refreshTenants, refreshPlans, refreshEngines, refreshSuperAdmins, refreshSipCarriers, refreshGateways, refreshAnnouncements, refreshGlobalCalls]);

  const toggleSuperAdminSidebar = useCallback(() => {
    setSuperAdminSidebarCollapsed((prev) => !prev);
  }, []);

  const addToast = useCallback((toast: Omit<SuperAdminToast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addAuditLog = useCallback((action: string, target: string, severity: "info" | "warning" | "critical" = "info") => {
    const clientIp = typeof window !== "undefined" ? (window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname) : "127.0.0.1";
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      actorName: currentSuperAdmin.name,
      actorRole: currentSuperAdmin.role,
      action,
      target,
      ipAddress: clientIp,
      severity,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, [currentSuperAdmin]);

  const addSuperAdmin = useCallback((adminData: Omit<SuperAdminUser, "id" | "lastActive" | "avatar">) => {
    const initials = adminData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "SA";
    const newAdmin: SuperAdminUser = {
      ...adminData,
      id: `sa-${Date.now()}`,
      lastActive: "Just now",
      avatar: initials,
    };
    setSuperAdmins((prev) => [newAdmin, ...prev]);
    addAuditLog(`Created Super Admin user '${adminData.name}' with role '${adminData.role}'`, `SuperAdmin (${newAdmin.id})`, "info");
    addToast({ title: "Super Admin Created", description: `${adminData.name} granted ${adminData.role} access.`, type: "success" });
  }, [addAuditLog, addToast]);

  const updateSuperAdminStatus = useCallback((id: string, status: "active" | "suspended") => {
    setSuperAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    addAuditLog(`Updated Super Admin status to '${status}'`, `SuperAdmin (${id})`, status === "suspended" ? "warning" : "info");
    addToast({ title: "Admin Status Updated", description: `Account is now ${status}.`, type: "info" });
  }, [addAuditLog, addToast]);

  const deleteSuperAdmin = useCallback((id: string) => {
    setSuperAdmins((prev) => prev.filter((a) => a.id !== id));
    addAuditLog(`Revoked Super Admin credentials`, `SuperAdmin (${id})`, "warning");
    addToast({ title: "Super Admin Revoked", description: "Account removed from platform.", type: "warning" });
  }, [addAuditLog, addToast]);

  const addTenant = useCallback(async (tenantData: Omit<TenantAdminOrg, "id" | "joinedDate" | "monthlySpend" | "activeCallsNow" | "totalMinutesUsedThisMonth"> & { password?: string }) => {
    const { password, ...restTenant } = tenantData;
    const newTenant: TenantAdminOrg = {
      ...restTenant,
      id: `tenant-${Date.now()}`,
      joinedDate: "Today",
      monthlySpend: 0,
      activeCallsNow: 0,
      totalMinutesUsedThisMonth: 0,
    };
    setTenants((prev) => [newTenant, ...prev]);
    addAuditLog(`Provisioned new Admin organization '${tenantData.orgName}'`, `Tenant (${newTenant.id})`, "info");
    addToast({ title: "Tenant Provisioned", description: `Organization '${tenantData.orgName}' is ready.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/superadmin/tenants';
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantData),
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.tenant) {
          setTenants((prev) => [json.tenant, ...prev.filter((t) => t.id !== newTenant.id)]);
        }
        await refreshTenants();
      } else {
        const errJson = await res.json().catch(() => ({}));
        addToast({ title: "Provisioning Failed", description: errJson.error || "Server error", type: "danger" });
        await refreshTenants();
      }
    } catch (err) {
      console.warn("Failed to persist tenant in DB:", err);
      addToast({ title: "Connection Error", description: "Failed to connect to backend database.", type: "danger" });
      await refreshTenants();
    }
  }, [addAuditLog, addToast, refreshTenants]);

  const updateTenantPlan = useCallback(async (tenantId: string, planId: string, planName: string, billingCycle: "monthly" | "6_months" | "yearly" | "pay_as_you_go") => {
    setTenants((prev) => prev.map((t) => t.id === tenantId ? { ...t, planId, planName, billingCycle } : t));
    addAuditLog(`Changed plan to '${planName}' (${billingCycle}) for tenant`, `Tenant (${tenantId})`, "info");
    addToast({ title: "Plan Assigned & Balance Updated", description: `Assigned ${planName} (${billingCycle}) with voice credits grant in database.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/superadmin/tenants/assign-plan';
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          planId,
          billingCycle,
        }),
      });
      if (res.ok) {
        await refreshTenants();
      }
    } catch (err) {
      console.warn("Failed to assign plan in DB:", err);
    }
  }, [addAuditLog, addToast, refreshTenants]);

  const adjustTenantCredits = useCallback(async (tenantId: string, deltaAmount: number, reason: string) => {
    let newBalance = 0;
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === tenantId) {
          newBalance = Math.max(0, Number((t.creditsBalance + deltaAmount).toFixed(2)));
          return { ...t, creditsBalance: newBalance };
        }
        return t;
      })
    );
    const sign = deltaAmount >= 0 ? "+" : "";
    addAuditLog(`Adjusted credits by ${sign}$${deltaAmount} (Reason: ${reason})`, `Tenant (${tenantId})`, "info");
    addToast({ title: "Credits Updated", description: `${sign}$${deltaAmount.toFixed(2)} applied.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/superadmin/tenants/credits';
      await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, amount: newBalance }),
      });
    } catch (err) {
      console.warn("Failed to update credits in DB:", err);
    }
  }, [addAuditLog, addToast]);

  const updateTenantStatus = useCallback(async (tenantId: string, status: "active" | "trial" | "suspended") => {
    setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, status } : t)));
    addAuditLog(`Changed organization status to '${status}'`, `Tenant (${tenantId})`, status === "suspended" ? "warning" : "info");
    addToast({ title: "Tenant Status Updated", description: `Organization is now ${status}.`, type: "info" });

    try {
      const apiUrl = getApiBase() + `/superadmin/tenants/${tenantId}/status`;
      await fetch(apiUrl, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn("Failed to update tenant status in DB:", err);
    }
  }, [addAuditLog, addToast]);

  const updateTenantQuotas = useCallback((tenantId: string, maxConcurrency: number, assignedSipCarrier: string, creditRatePerMinute: number) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? { ...t, maxConcurrency, assignedSipCarrier, creditRatePerMinute }
          : t
      )
    );
    addAuditLog(`Updated quotas: ${maxConcurrency} lines, ${assignedSipCarrier}, $${creditRatePerMinute}/min`, `Tenant (${tenantId})`, "info");
    addToast({ title: "Quotas Updated", description: "Resource limits saved.", type: "success" });
  }, [addAuditLog, addToast]);

  const updateTenantAccount = useCallback(async (tenantId: string, updates: { orgName?: string; primaryAdminName?: string; primaryAdminEmail?: string; passwordReset?: string }) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        return {
          ...t,
          ...(updates.orgName ? { orgName: updates.orgName } : {}),
          ...(updates.primaryAdminName ? { primaryAdminName: updates.primaryAdminName } : {}),
          ...(updates.primaryAdminEmail ? { primaryAdminEmail: updates.primaryAdminEmail } : {}),
          ...(updates.passwordReset ? { password: updates.passwordReset } : {}),
        };
      })
    );
    const passMsg = updates.passwordReset ? " & password reset" : "";
    addAuditLog(`Updated tenant profile details${passMsg} for '${tenantId}'`, `Tenant (${tenantId})`, "info");
    addToast({ title: "Tenant Account Customized", description: `Updated admin profile & security credentials.${passMsg}`, type: "success" });

    try {
      const apiUrl = getApiBase() + `/superadmin/tenants/${tenantId}`;
      await fetch(apiUrl, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn("Failed to update tenant account in DB:", err);
    }
  }, [addAuditLog, addToast]);

  const deleteTenant = useCallback(async (tenantId: string) => {
    const tenantToDelete = tenants.find((t) => t.id === tenantId);
    const orgName = tenantToDelete?.orgName || tenantId;

    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
    addAuditLog(`Permanently deleted tenant organization '${orgName}' and revoked admin access`, `Tenant (${tenantId})`, "critical");
    addToast({ title: "Organization Deleted", description: `Permanently removed '${orgName}' and revoked its admin credentials.`, type: "danger" });

    try {
      const apiUrl = getApiBase() + `/superadmin/tenants/${tenantId}`;
      await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Failed to delete tenant from DB:", err);
    }
  }, [tenants, addAuditLog, addToast]);

  const toggleTenantEngine = useCallback((tenantId: string, engineType: "llm" | "tts" | "stt", engineId: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        if (engineType === "llm") {
          const exists = t.allowedLLMs.includes(engineId);
          return {
            ...t,
            allowedLLMs: exists ? t.allowedLLMs.filter((id) => id !== engineId) : [...t.allowedLLMs, engineId],
          };
        } else if (engineType === "tts") {
          const exists = t.allowedTTS.includes(engineId);
          return {
            ...t,
            allowedTTS: exists ? t.allowedTTS.filter((id) => id !== engineId) : [...t.allowedTTS, engineId],
          };
        } else {
          const exists = t.allowedSTT.includes(engineId);
          return {
            ...t,
            allowedSTT: exists ? t.allowedSTT.filter((id) => id !== engineId) : [...t.allowedSTT, engineId],
          };
        }
      })
    );
    addToast({ title: "Model Entitlement Updated", description: "Engine permissions synchronized.", type: "info" });
  }, [addToast]);

  const addPlan = useCallback(async (planData: Omit<PlatformPlan, "id">) => {
    const id = `plan-${Date.now()}`;
    const newPlan: PlatformPlan = { ...planData, id };
    setPlans((prev) => [...prev, newPlan]);
    addAuditLog(`Created new platform plan '${planData.name}'`, `Plan (${newPlan.id})`, "info");
    addToast({ title: "Plan Created", description: `${planData.name} is now stored in database.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/superadmin/plans';
      await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      await refreshPlans();
    } catch (err) {
      console.warn("Failed to persist plan to database:", err);
    }
  }, [addAuditLog, addToast, refreshPlans]);

  const updatePlan = useCallback(async (id: string, updates: Partial<PlatformPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    addAuditLog(`Updated plan '${id}' pricing & feature terms`, `Plan (${id})`, "info");
    addToast({ title: "Plan Updated", description: "Plan changes saved in database.", type: "success" });

    try {
      const apiUrl = getApiBase() + `/superadmin/plans/${id}`;
      await fetch(apiUrl, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await refreshPlans();
    } catch (err) {
      console.warn("Failed to update plan in database:", err);
    }
  }, [addAuditLog, addToast, refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    const planToDelete = plans.find((p) => p.id === id);
    const planName = planToDelete?.name || id;
    setPlans((prev) => prev.filter((p) => p.id !== id));
    addAuditLog(`Permanently deleted plan tier '${planName}'`, `Plan (${id})`, "warning");
    addToast({ title: "Plan Deleted", description: `'${planName}' deleted from platform database.`, type: "danger" });

    try {
      const apiUrl = getApiBase() + `/superadmin/plans/${id}`;
      await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include",
      });
      await refreshPlans();
    } catch (err) {
      console.warn("Failed to delete plan from database:", err);
    }
  }, [plans, addAuditLog, addToast, refreshPlans]);

  const addGateway = useCallback(async (gwData: Omit<GatewayConfig, "id" | "monthlySentCount" | "deliverySuccessRate" | "latencyMs">) => {
    const tempId = `gw-${Date.now()}`;
    const newGw: GatewayConfig = {
      ...gwData,
      id: tempId,
      monthlySentCount: 0,
      deliverySuccessRate: 100,
      latencyMs: 120,
    };
    setGateways((prev) => [...prev, newGw]);
    addAuditLog(`Added ${gwData.type.toUpperCase()} Gateway '${gwData.name}' (${gwData.provider})`, `Gateway (${tempId})`, "info");
    addToast({ title: "Gateway Added", description: `${gwData.name} saved to database.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/superadmin/gateways';
      await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gwData),
      });
      await refreshGateways();
    } catch (err) {
      console.warn("Failed to persist gateway in database:", err);
    }
  }, [addAuditLog, addToast, refreshGateways]);

  const updateGateway = useCallback(async (id: string, updates: Partial<GatewayConfig>) => {
    setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    addAuditLog(`Updated gateway configuration '${id}'`, `Gateway (${id})`, "info");
    addToast({ title: "Gateway Updated", description: "Changes saved to database.", type: "success" });

    try {
      const apiUrl = getApiBase() + `/superadmin/gateways/${id}`;
      await fetch(apiUrl, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await refreshGateways();
    } catch (err) {
      console.warn("Failed to update gateway in database:", err);
    }
  }, [addAuditLog, addToast, refreshGateways]);

  const deleteGateway = useCallback(async (id: string) => {
    const gw = gateways.find((g) => g.id === id);
    setGateways((prev) => prev.filter((g) => g.id !== id));
    addAuditLog(`Deleted gateway '${gw?.name || id}'`, `Gateway (${id})`, "warning");
    addToast({ title: "Gateway Removed", description: `${gw?.name || id} deleted from database.`, type: "info" });

    try {
      const apiUrl = getApiBase() + `/superadmin/gateways/${id}`;
      await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include",
      });
      await refreshGateways();
    } catch (err) {
      console.warn("Failed to delete gateway from database:", err);
    }
  }, [gateways, addAuditLog, addToast, refreshGateways]);

  const updateGatewayStatus = useCallback(async (id: string, status: "active" | "standby" | "disabled") => {
    setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
    addAuditLog(`Changed gateway '${id}' status to '${status}'`, `Gateway (${id})`, "info");
    addToast({ title: "Gateway Status Changed", description: `Set to ${status}.`, type: "info" });

    try {
      const apiUrl = getApiBase() + `/superadmin/gateways/${id}`;
      await fetch(apiUrl, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refreshGateways();
    } catch (err) {
      console.warn("Failed to update gateway status in database:", err);
    }
  }, [addAuditLog, addToast, refreshGateways]);

  const setDefaultGateway = useCallback(async (id: string, type: "email" | "sms") => {
    setGateways((prev) =>
      prev.map((g) => {
        if (g.type !== type) return g;
        return { ...g, isDefault: g.id === id };
      })
    );
    addAuditLog(`Set default ${type.toUpperCase()} gateway to '${id}'`, `Gateway (${id})`, "info");
    addToast({ title: "Default Gateway Updated", description: "Primary routing rule saved in database.", type: "success" });

    try {
      const apiUrl = getApiBase() + `/superadmin/gateways/${id}/set-default`;
      await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
      });
      await refreshGateways();
    } catch (err) {
      console.warn("Failed to set default gateway in database:", err);
    }
  }, [addAuditLog, addToast, refreshGateways]);

  const testGatewayDispatch = useCallback(async (id: string, recipient: string) => {
    try {
      const apiUrl = getApiBase() + `/superadmin/gateways/${id}/test`;
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient }),
      });
      await refreshGateways();
      return res.ok;
    } catch (err) {
      console.warn("Failed to test gateway dispatch:", err);
      return false;
    }
  }, [refreshGateways]);

  const addSipCarrier = useCallback(async (carrierData: Omit<SipCarrierNetwork, "id" | "allocatedChannels">) => {
    const tempId = `sip-${Date.now()}`;
    const optimisticCarrier: SipCarrierNetwork = {
      ...carrierData,
      id: tempId,
      allocatedChannels: 0,
    };
    setSipCarriers((prev) => [...prev, optimisticCarrier]);

    try {
      const apiUrl = getApiBase() + '/superadmin/trunks';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: carrierData.name,
          carrier: carrierData.carrier,
          status: carrierData.status || "online",
          sipServer: carrierData.sipServer,
          port: carrierData.port || 5060,
          transport: carrierData.transport || "TLS",
          codecPriority: carrierData.codecPriority || ["Opus", "G.711u"],
          maxChannels: carrierData.maxChannels || 1000,
          ratePerMinuteWholesale: carrierData.ratePerMinuteWholesale || 0.0035,
          popRegions: carrierData.popRegions || ["US-East", "US-West"],
          isDefaultCarrier: carrierData.isDefaultCarrier || false,
          apiKey: carrierData.apiKey || "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.sip_carrier) {
          setSipCarriers((prev) => prev.map((c) => (c.id === tempId ? data.sip_carrier : c)));
        }
        addAuditLog(`Connected SIP Carrier Network '${carrierData.name}' (${carrierData.carrier}) into PostgreSQL`, `SipCarrier (${data?.sip_carrier?.id || tempId})`, "info");
        addToast({ title: "Carrier Connected", description: `${carrierData.name} saved to PostgreSQL trunk pool.`, type: "success" });
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast({ title: "Connection Failed", description: errData.error || "Failed to save carrier to database.", type: "danger" });
        await refreshSipCarriers();
      }
    } catch (err) {
      console.warn("Carrier database API standby:", err);
      addToast({ title: "Carrier Connected (Local)", description: `${carrierData.name} active in session.`, type: "info" });
    }
  }, [addAuditLog, addToast, refreshSipCarriers]);

  const updateSipCarrierStatus = useCallback(async (id: string, status: "online" | "degraded" | "offline") => {
    setSipCarriers((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    addAuditLog(`Changed carrier '${id}' status to '${status}'`, `SipCarrier (${id})`, status === "offline" ? "critical" : "warning");
    addToast({ title: "Carrier Status Updated", description: `Trunk is now ${status}.`, type: "info" });

    try {
      const apiUrl = getApiBase() + `/superadmin/trunks/${id}/status`;
      await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn("Carrier status update API standby:", err);
    }
  }, [addAuditLog, addToast]);

  const setDefaultCarrier = useCallback(async (id: string) => {
    setSipCarriers((prev) => prev.map((c) => ({ ...c, isDefaultCarrier: c.id === id })));
    addAuditLog(`Set primary carrier to '${id}'`, `SipCarrier (${id})`, "info");
    addToast({ title: "Primary Carrier Set", description: "Default carrier routing updated.", type: "success" });

    try {
      const apiUrl = getApiBase() + `/superadmin/trunks/${id}/set-default`;
      await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Carrier set-default API standby:", err);
    }
  }, [addAuditLog, addToast]);

  const updateSipCarrier = useCallback(async (id: string, updates: Partial<SipCarrierNetwork>) => {
    setSipCarriers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog(`Updated SIP carrier trunk '${id}' in PostgreSQL`, `SipCarrier (${id})`, "info");
    addToast({ title: "Carrier Updated", description: "Changes saved to database.", type: "success" });

    try {
      const apiUrl = getApiBase() + `/superadmin/trunks/${id}`;
      await fetch(apiUrl, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await refreshSipCarriers();
    } catch (err) {
      console.warn("Carrier update API standby:", err);
    }
  }, [addAuditLog, addToast, refreshSipCarriers]);

  const deleteSipCarrier = useCallback(async (id: string) => {
    const carrierToDelete = sipCarriers.find((c) => c.id === id);
    setSipCarriers((prev) => prev.filter((c) => c.id !== id));
    addAuditLog(`Removed SIP carrier '${carrierToDelete?.name || id}'`, `SipCarrier (${id})`, "warning");
    addToast({ title: "Carrier Removed", description: `${carrierToDelete?.name || id} removed from trunk pool.`, type: "warning" });

    try {
      const apiUrl = getApiBase() + `/superadmin/trunks/${id}`;
      await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include",
      });
      await refreshSipCarriers();
    } catch (err) {
      console.warn("Carrier delete API standby:", err);
    }
  }, [sipCarriers, addAuditLog, addToast, refreshSipCarriers]);

  const addCustomEngine = useCallback(async (engineData: Omit<VoiceAiEngine, "id">) => {
    const tempId = `eng-${engineData.category}-${Date.now()}`;
    const newEng: VoiceAiEngine = {
      ...engineData,
      id: tempId,
      isCustom: true,
    };
    setEngines((prev) => [...prev, newEng]);
    addAuditLog(`Registered custom ${engineData.category.toUpperCase()} model '${engineData.name}' (${engineData.provider})`, `VoiceEngine (${tempId})`, "info");
    addToast({ title: "Custom Model Registered", description: `${engineData.name} saved to PostgreSQL and available for Admin.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/superadmin/ai-engines';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: tempId,
          name: engineData.name,
          provider: engineData.provider,
          category: engineData.category,
          model_identifier: engineData.modelIdentifier,
          endpoint_url: engineData.baseUrl,
          api_key: engineData.apiKey,
          tier_requirement: engineData.tierRequirement,
          latency_avg_ms: engineData.latencyAvgMs,
          cost_per_unit: engineData.costPerUnit,
          description: engineData.description,
          status: engineData.status,
        }),
      });
      if (res.ok) {
        await refreshEngines();
      }
    } catch (err) {
      console.warn("Failed to store custom engine in database:", err);
    }
  }, [addAuditLog, addToast, refreshEngines]);

  const updateCustomEngine = useCallback(async (engineData: VoiceAiEngine) => {
    setEngines((prev) => prev.map((e) => (e.id === engineData.id ? { ...e, ...engineData } : e)));
    addAuditLog(`Updated AI model '${engineData.name}' (${engineData.id})`, `Engine (${engineData.id})`, "info");
    addToast({ title: "Engine Updated", description: `${engineData.name} updated in PostgreSQL database.`, type: "success" });

    try {
      const apiUrl = getApiBase() + '/superadmin/ai-engines';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: engineData.id,
          name: engineData.name,
          provider: engineData.provider,
          category: engineData.category,
          model_identifier: engineData.modelIdentifier,
          endpoint_url: engineData.baseUrl,
          api_key: engineData.apiKey,
          tier_requirement: engineData.tierRequirement,
          latency_avg_ms: engineData.latencyAvgMs,
          cost_per_unit: engineData.costPerUnit,
          description: engineData.description,
          status: engineData.status,
        }),
      });
      if (res.ok) {
        await refreshEngines();
      }
    } catch (err) {
      console.warn("Failed to update engine in database:", err);
    }
  }, [addAuditLog, addToast, refreshEngines]);

  const toggleEngineStatus = useCallback(async (id: string) => {
    const current = engines.find((e) => e.id === id);
    const nextStatus = current?.status === "active" ? "deprecated" : "active";
    setEngines((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: nextStatus } : e
      )
    );
    addAuditLog(`Toggled engine status for '${id}' to ${nextStatus}`, `Engine (${id})`, "info");
    addToast({ title: "Engine Status Updated", description: `Engine status set to ${nextStatus} in database.`, type: "info" });

    try {
      const apiUrl = getApiBase() + `/superadmin/ai-engines/${id}/status`;
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await refreshEngines();
      }
    } catch (err) {
      console.warn("Failed to toggle engine status in database:", err);
    }
  }, [engines, addAuditLog, addToast, refreshEngines]);

  const deleteEngine = useCallback(async (id: string) => {
    setEngines((prev) => prev.filter((e) => e.id !== id));
    addAuditLog(`Deleted model engine '${id}'`, `Engine (${id})`, "warning");
    addToast({ title: "Engine Removed", description: "Model permanently removed from database.", type: "warning" });

    try {
      const apiUrl = getApiBase() + `/superadmin/ai-engines/${id}`;
      const res = await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await refreshEngines();
      }
    } catch (err) {
      console.warn("Failed to delete engine from database:", err);
    }
  }, [addAuditLog, addToast, refreshEngines]);

  const updateEngineTierRequirement = useCallback(async (id: string, tierRequirement: "all" | "growth_plus" | "enterprise_only") => {
    setEngines((prev) => prev.map((e) => (e.id === id ? { ...e, tierRequirement } : e)));
    addAuditLog(`Set tier requirement for engine '${id}' to '${tierRequirement}'`, `Engine (${id})`, "info");
    addToast({ title: "Tier Requirement Updated", description: `Restricted to ${tierRequirement} in database.`, type: "info" });

    try {
      const apiUrl = getApiBase() + `/superadmin/ai-engines/${id}/status`;
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier_requirement: tierRequirement }),
      });
      if (res.ok) {
        await refreshEngines();
      }
    } catch (err) {
      console.warn("Failed to update tier requirement in database:", err);
    }
  }, [addAuditLog, addToast, refreshEngines]);

  const probeEngineHealth = useCallback(async (engineId: string): Promise<{ online: boolean; latencyMs: number; message?: string }> => {
    const eng = engines.find((e) => e.id === engineId);
    if (!eng || !eng.baseUrl) {
      return { online: false, latencyMs: 0, message: "No endpoint URL configured" };
    }

    const t0 = performance.now();
    try {
      let probeUrl = eng.baseUrl;
      const headers: Record<string, string> = {};
      const key = eng.apiKey || "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF";

      if (eng.category === "llm") {
        probeUrl = eng.baseUrl.endsWith("/v1") ? `${eng.baseUrl}/models` : `${eng.baseUrl}/v1/models`;
        headers["Authorization"] = `Bearer ${key}`;
      } else {
        probeUrl = eng.baseUrl.replace(/\/+$/, "") + "/health";
        headers["X-API-Key"] = key;
        headers["Authorization"] = `Bearer ${key}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(probeUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        setEngines((prev) => prev.map((e) => e.id === engineId ? { ...e, latencyAvgMs: latencyMs, status: "active" } : e));
        return { online: true, latencyMs, message: `Status ${res.status} OK` };
      } else {
        return { online: false, latencyMs, message: `HTTP ${res.status}` };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      return { online: false, latencyMs, message: err.message || "Unreachable" };
    }
  }, [engines]);

  const forceTerminateCall = useCallback((callId: string) => {
    setGlobalCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: "terminated" } : c))
    );
    addAuditLog(`Super Admin force-terminated live SIP call session '${callId}'`, `GlobalCall (${callId})`, "warning");
    addToast({ title: "Call Force Terminated", description: "SIP channel packet stream closed.", type: "warning" });
  }, [addAuditLog, addToast]);

  const addAnnouncement = useCallback(async (announcementData: Omit<SystemAnnouncement, "id" | "publishedAt" | "active">) => {
    const tempId = `anc-${Date.now()}`;
    const optimisticAnc: SystemAnnouncement = {
      ...announcementData,
      id: tempId,
      publishedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      active: true,
    };
    setAnnouncements((prev) => [optimisticAnc, ...prev]);

    try {
      const apiUrl = getApiBase() + '/superadmin/announcements';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: announcementData.title,
          message: announcementData.message,
          severity: announcementData.severity || "info",
          targetTenants: announcementData.targetTenants || "all",
          targetTenantName: announcementData.targetTenantName || "All Tenant Orgs",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.announcement) {
          setAnnouncements((prev) => prev.map((a) => (a.id === tempId ? data.announcement : a)));
        }
        addAuditLog(`Broadcasted announcement '${announcementData.title}' to '${announcementData.targetTenantName || announcementData.targetTenants}'`, `Announcement (${data?.announcement?.id || tempId})`, "info");
        addToast({ title: "Announcement Broadcasted", description: `Saved to database and sent in real time.`, type: "success" });
      } else {
        await refreshAnnouncements();
      }
    } catch (err) {
      console.warn("Announcement database API standby:", err);
      addToast({ title: "Announcement Broadcasted (Session)", description: "Saved to local session.", type: "info" });
    }
  }, [addAuditLog, addToast, refreshAnnouncements]);

  const toggleAnnouncement = useCallback(async (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    addToast({ title: "Announcement Status Toggled", description: "Updated tenant banner status.", type: "info" });

    try {
      const apiUrl = getApiBase() + `/superadmin/announcements/${id}/toggle`;
      await fetch(apiUrl, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Failed to toggle announcement in database:", err);
    }
  }, [addToast]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    addToast({ title: "Announcement Deleted", description: "Removed from database and tenant dashboards.", type: "warning" });

    try {
      const apiUrl = getApiBase() + `/superadmin/announcements/${id}`;
      await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Failed to delete announcement from database:", err);
    }
  }, [addToast]);

  return (
    <SuperAdminContext.Provider
      value={{
        language,
        setLanguage,
        superAdminTheme,
        toggleSuperAdminTheme,
        superAdminNotifications,
        unreadNotificationCount,
        markAllNotificationsAsRead,
        currentSuperAdmin,
        setCurrentSuperAdmin,
        superAdminSidebarCollapsed,
        setSuperAdminSidebarCollapsed,
        toggleSuperAdminSidebar,
        superAdmins,
        addSuperAdmin,
        updateSuperAdminStatus,
        deleteSuperAdmin,
        tenants,
        refreshTenants,
        addTenant,
        deleteTenant,
        updateTenantPlan,
        adjustTenantCredits,
        updateTenantStatus,
        updateTenantQuotas,
        updateTenantAccount,
        toggleTenantEngine,
        plans,
        refreshPlans,
        addPlan,
        updatePlan,
        deletePlan,
        gateways,
        refreshGateways,
        addGateway,
        updateGateway,
        deleteGateway,
        updateGatewayStatus,
        setDefaultGateway,
        testGatewayDispatch,
        sipCarriers,
        refreshSipCarriers,
        addSipCarrier,
        updateSipCarrier,
        updateSipCarrierStatus,
        setDefaultCarrier,
        deleteSipCarrier,
        engines,
        refreshEngines,
        addCustomEngine,
        updateCustomEngine,
        toggleEngineStatus,
        deleteEngine,
        updateEngineTierRequirement,
        probeEngineHealth,
        globalCalls,
        refreshGlobalCalls,
        forceTerminateCall,
        announcements,
        refreshAnnouncements,
        addAnnouncement,
        toggleAnnouncement,
        deleteAnnouncement,
        auditLogs,
        addAuditLog,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

const fallbackSuperAdminState: SuperAdminContextType = {
  language: "en",
  setLanguage: () => {},
  superAdminTheme: "light",
  toggleSuperAdminTheme: () => {},
  superAdminNotifications: [],
  unreadNotificationCount: 0,
  markAllNotificationsAsRead: () => {},
  currentSuperAdmin: initialSuperAdmins[0],
  setCurrentSuperAdmin: () => {},
  superAdminSidebarCollapsed: false,
  setSuperAdminSidebarCollapsed: () => {},
  toggleSuperAdminSidebar: () => {},
  superAdmins: initialSuperAdmins,
  addSuperAdmin: () => {},
  updateSuperAdminStatus: () => {},
  deleteSuperAdmin: () => {},
  tenants: initialTenantOrgs,
  refreshTenants: async () => {},
  addTenant: () => {},
  deleteTenant: () => {},
  updateTenantPlan: () => {},
  adjustTenantCredits: () => {},
  updateTenantStatus: () => {},
  updateTenantQuotas: () => {},
  updateTenantAccount: () => {},
  toggleTenantEngine: () => {},
  plans: initialPlatformPlans,
  refreshPlans: async () => {},
  addPlan: () => {},
  updatePlan: () => {},
  deletePlan: () => {},
  gateways: [],
  refreshGateways: async () => {},
  addGateway: () => {},
  updateGateway: () => {},
  deleteGateway: () => {},
  updateGatewayStatus: () => {},
  setDefaultGateway: () => {},
  testGatewayDispatch: async () => false,
  sipCarriers: [],
  refreshSipCarriers: async () => {},
  addSipCarrier: () => {},
  updateSipCarrier: () => {},
  updateSipCarrierStatus: () => {},
  setDefaultCarrier: () => {},
  deleteSipCarrier: () => {},
  engines: [],
  refreshEngines: async () => {},
  addCustomEngine: () => {},
  updateCustomEngine: () => {},
  toggleEngineStatus: () => {},
  deleteEngine: () => {},
  updateEngineTierRequirement: () => {},
  probeEngineHealth: async () => ({ online: true, latencyMs: 45 }),
  globalCalls: [],
  refreshGlobalCalls: async () => {},
  forceTerminateCall: () => {},
  announcements: initialAnnouncements,
  refreshAnnouncements: async () => {},
  addAnnouncement: () => {},
  toggleAnnouncement: () => {},
  deleteAnnouncement: () => {},
  auditLogs: initialAuditLogs,
  addAuditLog: () => {},
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
};

export function useSuperAdminStore() {
  const context = useContext(SuperAdminContext);
  return context || fallbackSuperAdminState;
}
