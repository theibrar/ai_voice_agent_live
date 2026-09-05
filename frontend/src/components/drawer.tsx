"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: "md" | "lg" | "xl" | "2xl";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = "lg",
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-[#101A33]/50 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={cn(
            "w-screen bg-white shadow-2xl border-l border-[#E5EAF2] flex flex-col animate-in slide-in-from-right duration-200",
            widthClasses[width]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EAF2] bg-[#F4F7FB]/50 shrink-0">
            <div>
              <h3 className="text-base font-bold text-[#172033]">{title}</h3>
              {description && <p className="text-xs text-[#78849A] mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#78849A] hover:text-[#172033] hover:bg-white rounded-lg border border-transparent hover:border-[#E5EAF2] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
