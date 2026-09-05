"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "user";
  tenantId: number;
  avatar: string;
  phone: string;
  company: string;
  status: string;
}

export interface AuthTenant {
  id: number;
  tenantName: string;
  adminName: string;
  adminEmail: string;
  status: string;
  creditsBalance: number;
  planId?: string;
  planName?: string;
  billingCycle?: string;
  creditRatePerMinute?: number;
  maxConcurrency?: number;
  mrr?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  role: string | null;
  tenantId: number;
  isPreview: boolean;
  superAdminId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, requiredRole?: string) => Promise<{ success: boolean; error?: string; isSuperAdmin?: boolean }>;
  logout: () => Promise<void>;
  startPreview: (tenantId: number) => Promise<boolean>;
  exitPreview: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getApiBase = () => {
  if (typeof window !== "undefined") {
    // When in browser on production domain or HTTPS, use relative path '/api/v1'
    // This guarantees same-origin requests through Nginx without mixed-content or localhost errors
    if (window.location.protocol === "https:" || window.location.hostname !== "localhost") {
      return "/api/v1";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AuthTenant | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<number>(0);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stable ref to prevent double-run in StrictMode / repeated renders
  const authCheckedRef = useRef(false);

  // No dependencies — stable function reference forever
  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        setTenant(data.tenant && data.tenant.id ? data.tenant : null);
        setRole(data.role || (data.user?.role ?? null));
        setTenantId(data.tenantId || (data.tenant ? data.tenant.id : 0));
        setIsPreview(!!data.isPreview);
        setSuperAdminId(data.superAdminId || null);
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("app:auth_updated", { detail: data }));
        }
      } else {
        setUser(null);
        setTenant(null);
        setRole(null);
        setTenantId(0);
        setIsPreview(false);
        setSuperAdminId(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.warn("Authentication check failed:", err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Run ONCE on mount only
  useEffect(() => {
    if (!authCheckedRef.current) {
      authCheckedRef.current = true;
      refreshAuth();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const login = async (email: string, pass: string, requiredRole?: string) => {
    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: pass,
          requiredRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Invalid email or password. Please verify your credentials.",
        };
      }

      if (data.token && typeof document !== "undefined") {
        document.cookie = `access_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      await refreshAuth();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:auth_updated", { detail: data }));
      }
      const isSuperAdmin = data.user?.role === "super_admin" || email.includes("superadmin");
      return { success: true, isSuperAdmin };
    } catch (err: any) {
      return { success: false, error: "Unable to connect to authentication server." };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${getApiBase()}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null);
      setTenant(null);
      setRole(null);
      setTenantId(0);
      setIsPreview(false);
      setSuperAdminId(null);
      setIsAuthenticated(false);
      if (typeof document !== "undefined") {
        document.cookie = "access_token=; path=/; max-age=0;";
        document.cookie = "preview_token=; path=/; max-age=0;";
      }
      router.push("/login");
    }
  };

  const startPreview = async (targetTenantId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/superadmin/preview/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: targetTenantId }),
      });

      if (!res.ok) {
        return false;
      }

      await refreshAuth();
      router.push("/dashboard");
      return true;
    } catch (e) {
      console.warn("Start preview error:", e);
      return false;
    }
  };

  const exitPreview = async () => {
    try {
      await fetch(`${getApiBase()}/superadmin/preview/exit`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Exit preview error:", e);
    } finally {
      await refreshAuth();
      router.push("/super-admin/admins");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        role,
        tenantId,
        isPreview,
        superAdminId,
        isAuthenticated,
        isLoading,
        login,
        logout,
        startPreview,
        exitPreview,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
