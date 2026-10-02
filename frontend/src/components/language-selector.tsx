"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, Search, ChevronDown } from "lucide-react";
import { BASIC_LANGUAGES, LanguageOption, getStoredLanguage, setStoredLanguage } from "@/lib/languages";

interface LanguageSelectorProps {
  currentLanguage?: string;
  onLanguageChange?: (code: string) => void;
  className?: string;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  className = "",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState("en");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentLanguage) {
      setSelectedCode(currentLanguage);
    } else {
      setSelectedCode(getStoredLanguage());
    }
  }, [currentLanguage]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeLang = BASIC_LANGUAGES.find((l) => l.code === selectedCode) || BASIC_LANGUAGES[0];

  const filteredLanguages = BASIC_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (lang: LanguageOption) => {
    setSelectedCode(lang.code);
    setStoredLanguage(lang.code);
    if (onLanguageChange) {
      onLanguageChange(lang.code);
    }
    setIsOpen(false);
    setSearch("");

    // Set Google Translate cookie directly across host, domain, and root path
    const gCode = lang.code === "zh" ? "zh-CN" : lang.code;
    const cookieVal = lang.code === "en" ? "" : `/en/${gCode}`;
    const expires = lang.code === "en" ? "expires=Thu, 01 Jan 1970 00:00:00 UTC;" : "expires=Fri, 31 Dec 9999 23:59:59 GMT;";
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";

    try {
      document.cookie = `googtrans=${cookieVal}; path=/; ${expires}`;
      if (hostname) {
        document.cookie = `googtrans=${cookieVal}; domain=${hostname}; path=/; ${expires}`;
        if (hostname.includes(".") && !hostname.startsWith(".")) {
          document.cookie = `googtrans=${cookieVal}; domain=.${hostname}; path=/; ${expires}`;
        }
      }
    } catch {}

    // Dispatch global event so all providers update immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("apex-language-change", { detail: lang.code }));
    }

    // Trigger Google Translate dropdown
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      const targetVal = lang.code === "en" ? "" : gCode;
      select.value = targetVal;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      select.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (typeof window !== "undefined") {
      // If combo not ready yet, reload so the engine boots with the new cookie
      setTimeout(() => {
        window.location.reload();
      }, 150);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        translate="no"
        onClick={() => setIsOpen((prev) => !prev)}
        className="notranslate flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold text-white transition-all shadow-2xs cursor-pointer focus:outline-hidden"
        title={`Selected Language: ${activeLang.name} (${activeLang.nativeName})`}
      >
        <span className="text-sm shrink-0 leading-none">{activeLang.flag}</span>
        <span className="font-semibold">{activeLang.name}</span>
        <ChevronDown className={`w-3 h-3 text-white/80 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white text-[#0F172A] rounded-3xl shadow-2xl border border-[#E2E8F0] p-3 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#3157D5]" />
              <span className="text-xs font-extrabold text-[#0F172A]">Select Language</span>
            </div>
            <span className="text-[10px] font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
              20 Available
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3157D5]"
            />
          </div>

          {/* 20 Languages Scrollable List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {filteredLanguages.map((lang) => {
              const isSelected = lang.code === selectedCode;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#3157D5] text-white font-bold shadow-2xs"
                      : "text-[#0F172A] hover:bg-[#EEF2FD]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{lang.flag}</span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{lang.name}</p>
                      <p className={`text-[10px] truncate ${isSelected ? "text-white/85" : "text-[#64748B]"}`}>
                        {lang.nativeName}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <div className="p-4 text-center text-xs text-[#64748B]">No languages matched &quot;{search}&quot;</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
