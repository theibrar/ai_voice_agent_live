"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getApiBase } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { PreviewBanner } from "@/components/preview-banner";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, tenant, isPreview } = useAuth();
  const { setActiveWorkspace, activeWorkspace } = useAppStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      }
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (tenant || user) {
      const workspaceName = tenant?.tenantName || user?.company || "My Workspace";
      const credits = tenant?.creditsBalance !== undefined ? tenant.creditsBalance : 250.00;
      const workspaceId = `tenant-${tenant?.id || user?.tenantId || 1}`;

      setActiveWorkspace({
        id: workspaceId,
        name: workspaceName,
        plan: (tenant?.planName || "Growth") as any,
        credits: credits,
        activeCalls: 0,
      });

      // Also trigger a background fetch of billing details to guarantee live sync
      const apiUrl = getApiBase() + "/billing/details";
      fetch(apiUrl, { method: "GET", credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setActiveWorkspace({
              id: workspaceId,
              name: data.tenantName || workspaceName,
              plan: (data.planName || "Growth") as any,
              credits: data.creditsBalance !== undefined ? data.creditsBalance : credits,
              activeCalls: 0,
            });
          }
        })
        .catch(() => {});
    }
  }, [tenant, user, setActiveWorkspace]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3157D5] to-[#5C82FF] flex items-center justify-center text-white shadow-xl shadow-[#3157D5]/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2 text-[#3157D5] font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying Secure Workspace Authorization...</span>
          </div>
          <p className="text-xs text-[#94A3B8]">Validating tenant cryptosecurity credentials</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PreviewBanner />
      <AppShell>{children}</AppShell>
    </div>
  );
}
