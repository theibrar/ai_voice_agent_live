"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/dashboard" || pathname === "/" || pathname === "/login" || pathname === "/forgot-password") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  const formatSegment = (seg: string) => {
    if (seg.startsWith("agent-") || seg.startsWith("camp-") || seg.startsWith("call-")) {
      return seg.toUpperCase();
    }
    return seg
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <nav className="flex items-center gap-1.5 text-xs text-[#78849A] mb-4">
      <Link href="/dashboard" className="flex items-center hover:text-[#3157D5] transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {segments.map((seg, idx) => {
        const url = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        return (
          <React.Fragment key={url}>
            <ChevronRight className="w-3.5 h-3.5 text-[#78849A]/60" />
            {isLast ? (
              <span className="font-semibold text-[#172033]">{formatSegment(seg)}</span>
            ) : (
              <Link href={url} className="hover:text-[#3157D5] transition-colors">
                {formatSegment(seg)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
