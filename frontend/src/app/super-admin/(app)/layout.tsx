"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== "super_admin") {
        router.replace("/super-admin/login");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070A11]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3157D5] to-[#5C82FF] flex items-center justify-center text-white shadow-xl shadow-[#3157D5]/40">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authorizing Master Console Privileges...</span>
          </div>
          <p className="text-xs text-slate-400">Verifying root cryptographic master keys</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "super_admin") {
    return null;
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}
