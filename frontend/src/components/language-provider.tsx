"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getStoredLanguage, setStoredLanguage, BASIC_LANGUAGES } from "@/lib/languages";
import { useAppStore } from "@/lib/store";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language } = useAppStore();
  const [activeLanguage, setActiveLanguage] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return getStoredLanguage() || language || "en";
    }
    return "en";
  });

  // 1. Sync active language with global store & custom events
  React.useEffect(() => {
    if (language && language !== activeLanguage) {
      setActiveLanguage(language);
      setStoredLanguage(language);
    }
  }, [language, activeLanguage]);

  React.useEffect(() => {
    const handleLangEvent = (e: any) => {
      if (e.detail && e.detail !== activeLanguage) {
        setActiveLanguage(e.detail);
        setStoredLanguage(e.detail);
      }
    };
    window.addEventListener("apex-language-change", handleLangEvent);
    return () => window.removeEventListener("apex-language-change", handleLangEvent);
  }, [activeLanguage]);

  // 2. Initialize Google Translate Script
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const cleanupBadges = () => {
      const badges = document.querySelectorAll(
        ".VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-aZ2wEe-wOHMy, .VIpgJd-ZVi9od-aZ2wEe-OiiCO, .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame"
      );
      badges.forEach((b) => b.remove());
    };

    cleanupBadges();
    const interval = setInterval(cleanupBadges, 2000);

    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: BASIC_LANGUAGES.map((l) => l.code).join(","),
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      } catch (e) {
        console.error("Google translate init error", e);
      }
    };

    const existingScript = document.getElementById("google-translate-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: BASIC_LANGUAGES.map((l) => l.code).join(","),
            autoDisplay: false,
          },
          "google_translate_element"
        );
      } catch (e) {}
    }

    return () => clearInterval(interval);
  }, []);

  // 3. Whole-Page Google Translate Engine Synchronization
  useEffect(() => {
    const currentLang = activeLanguage || getStoredLanguage() || "en";

    // Set HTML lang and dir attributes
    const langObj = BASIC_LANGUAGES.find((l) => l.code === currentLang);
    if (document.documentElement) {
      document.documentElement.setAttribute("lang", currentLang);
      document.documentElement.setAttribute("dir", langObj?.dir || "ltr");
    }

    // Manage Google Translate cookie
    const setGoogleTranslateCookie = (langCode: string) => {
      try {
        const gCode = langCode === "zh" ? "zh-CN" : langCode;
        if (langCode === "en") {
          document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;";
          try {
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
          } catch {}
        } else {
          const val = `/en/${gCode}`;
          document.cookie = `googtrans=${val}; path=/;`;
          try {
            document.cookie = `googtrans=${val}; path=/; domain=${window.location.hostname};`;
          } catch {}
        }
      } catch (e) {}
    };

    setGoogleTranslateCookie(currentLang);

    // Trigger Google Translate select element
    const triggerGoogleTranslate = () => {
      const gCode = currentLang === "zh" ? "zh-CN" : currentLang;
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        const targetVal = currentLang === "en" ? "" : gCode;
        if (select.value !== targetVal) {
          select.value = targetVal;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    };

    triggerGoogleTranslate();
    const timer1 = setTimeout(triggerGoogleTranslate, 200);
    const timer2 = setTimeout(triggerGoogleTranslate, 500);
    const timer3 = setTimeout(triggerGoogleTranslate, 1200);
    const timer4 = setTimeout(triggerGoogleTranslate, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [activeLanguage, pathname]);

  return <>{children}</>;
}

