"use client";

import React from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { translate, getStoredLanguage } from "@/lib/languages";
import { useAppStore } from "@/lib/store";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, badge, actions, children }: PageHeaderProps) {
  let lang = "en";
  try {
    const store = useAppStore();
    if (store && store.language) {
      lang = store.language;
    }
  } catch {
    lang = getStoredLanguage();
  }

  const translatedTitle = translate(title, lang);
  const translatedDesc = description ? translate(description, lang) : undefined;

  return (
    <div className="mb-6 space-y-2">
      <Breadcrumbs />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-[#172033] dark:text-[#F8FAFC] tracking-tight">{translatedTitle}</h1>
            {badge}
          </div>
          {translatedDesc && <p className="text-xs md:text-sm text-[#78849A] dark:text-[#94A3B8] mt-1 leading-relaxed">{translatedDesc}</p>}
        </div>

        {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
      </div>

      {children}
    </div>
  );
}
