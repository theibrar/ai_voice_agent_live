"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ChevronDown, Check, Building2, Plus } from "lucide-react";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace, addToast } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#E5EAF2] bg-white hover:bg-[#F4F7FB] transition-colors text-left focus:outline-hidden focus:ring-2 focus:ring-[#3157D5]/20"
      >
        <div className="w-6 h-6 rounded-lg bg-[#3157D5] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
          {activeWorkspace.name.substring(0, 1)}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-[#172033] leading-none truncate max-w-[130px]">
            {activeWorkspace.name}
          </span>
          <span className="text-[10px] text-[#78849A] font-medium leading-tight mt-0.5">
            {activeWorkspace.plan} Tier
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#78849A] ml-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-[#E5EAF2] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#78849A] uppercase tracking-wider">
              Switch Workspace
            </div>

            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws);
                  setOpen(false);
                  addToast({
                    title: "Workspace Switched",
                    description: `Active workspace: ${ws.name}`,
                    type: "info",
                  });
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#F4F7FB] text-[#172033] transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#101A33] text-white flex items-center justify-center text-xs font-bold">
                    {ws.name.substring(0, 1)}
                  </div>
                  <div>
                    <p className="font-semibold">{ws.name}</p>
                    <p className="text-[10px] text-[#78849A]">{ws.plan} • ${ws.credits.toFixed(2)}</p>
                  </div>
                </div>
                {activeWorkspace.id === ws.id && <Check className="w-4 h-4 text-[#3157D5]" />}
              </button>
            ))}

            <div className="border-t border-[#E5EAF2] mt-1 pt-1 px-1">
              <button
                onClick={() => {
                  setOpen(false);
                  addToast({
                    title: "Workspace Provisioning",
                    description: "Multi-tenant workspace setup opened.",
                    type: "info",
                  });
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#3157D5] font-medium hover:bg-[#EEF2FD] rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
