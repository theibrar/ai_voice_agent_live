"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getStoredLanguage, setStoredLanguage, translate, BASIC_LANGUAGES } from "@/lib/languages";
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

  // 2. Initialize Silent Google Translate Engine ONLY if non-English is needed
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Remove any rogue Google Translate floating toolbars or badges
    const cleanupBadges = () => {
      const badges = document.querySelectorAll(".VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-aZ2wEe-wOHMy, .VIpgJd-ZVi9od-aZ2wEe-OiiCO, .goog-te-banner-frame, #goog-gt-tt");
      badges.forEach((b) => b.remove());
    };

    cleanupBadges();
    const interval = setInterval(cleanupBadges, 2000);

    const currentLang = activeLanguage || getStoredLanguage() || "en";
    if (currentLang !== "en") {
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
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => clearInterval(interval);
  }, [activeLanguage]);

  // 3. Trigger Translation on activeLanguage or pathname change
  useEffect(() => {
    const currentLang = activeLanguage || getStoredLanguage() || "en";

    // Set HTML lang and dir attributes
    const langObj = BASIC_LANGUAGES.find((l) => l.code === currentLang);
    if (document.documentElement) {
      document.documentElement.setAttribute("lang", currentLang);
      document.documentElement.setAttribute("dir", langObj?.dir || "ltr");
    }

    // If English, reset Google Translate cookies and return early
    if (currentLang === "en") {
      try {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      } catch (e) {}
      return;
    }

    // Set Google Translate cookies for non-English
    const setGoogleTranslateCookie = (langCode: string) => {
      try {
        const val = `/en/${langCode}`;
        document.cookie = `googtrans=${val}; path=/;`;
        document.cookie = `googtrans=${val}; path=/; domain=${window.location.hostname};`;
      } catch (e) {}
    };

    setGoogleTranslateCookie(currentLang);

    // Trigger Google Translate dropdown change silently
    const triggerGoogleTranslate = () => {
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        if (select.value !== currentLang) {
          select.value = currentLang;
          select.dispatchEvent(new Event("change"));
        }
      }
    };

    triggerGoogleTranslate();
    const timer1 = setTimeout(triggerGoogleTranslate, 300);
    const timer2 = setTimeout(triggerGoogleTranslate, 1000);

    // Run Fast Client-side DOM translation for immediate instant UI response
    const translateElementTree = (root: Node) => {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (["script", "style", "code", "pre", "noscript", "svg"].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest(".skiptranslate") || parent.closest("[data-no-translate]")) {
              return NodeFilter.FILTER_REJECT;
            }
            const text = node.nodeValue?.trim();
            if (!text || text.length < 2 || /^[0-9\s:,\.\-\+\(\)\$%#@\/\\=><_]+$/.test(text)) {
              return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const nodes: Node[] = [];
      let cur = walker.nextNode();
      while (cur) {
        nodes.push(cur);
        cur = walker.nextNode();
      }

      for (const node of nodes) {
        const text = node.nodeValue?.trim();
        if (!text) continue;
        const translated = translate(text, currentLang);
        if (translated && translated !== text) {
          const orig = node.nodeValue || "";
          const leading = orig.match(/^\s*/)?.[0] || "";
          const trailing = orig.match(/\s*$/)?.[0] || "";
          node.nodeValue = `${leading}${translated}${trailing}`;
        }
      }

      // Also translate inputs & textareas placeholders
      if (root instanceof Element) {
        const inputs = root.querySelectorAll("input[placeholder], textarea[placeholder]");
        inputs.forEach((input) => {
          const el = input as HTMLInputElement;
          const ph = el.placeholder?.trim();
          if (ph) {
            const trans = translate(ph, currentLang);
            if (trans && trans !== ph) {
              el.placeholder = trans;
            }
          }
        });
      }
    };

    translateElementTree(document.body);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeLanguage, pathname]);

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} />
      {children}
    </>
  );
}
