"use client";

import { useEffect, useRef, useState } from "react";

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const dropdownRef = useRef(null);

  // Initialize language from cookie or localStorage
  useEffect(() => {
    try {
      const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/i);
      const savedLang = match
        ? match[1].toLowerCase()
        : localStorage.getItem("krishi_language") || "en";

      if (LANGUAGES.some((l) => l.code === savedLang)) {
        setSelectedLang(savedLang);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load Google Translate script
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,bn,mr,te,ta,gu,ur,kn,or,ml",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    if (!document.querySelector('script[data-gtranslate="true"]')) {
      const script = document.createElement("script");
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.gtranslate = "true";
      document.body.appendChild(script);
    }
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    setIsOpen(false);

    try {
      localStorage.setItem("krishi_language", langCode);

      const hostname = window.location.hostname;

      if (langCode === "en") {
        document.cookie =
          "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${hostname}; path=/;`;
      } else {
        document.cookie = `googtrans=/en/${langCode}; path=/;`;
        document.cookie = `googtrans=/en/${langCode}; domain=${hostname}; path=/;`;
      }

      // Trigger translate event on combo box if available
      const selectEl = document.querySelector(".goog-te-combo");
      if (selectEl) {
        selectEl.value = langCode;
        selectEl.dispatchEvent(new Event("change"));
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Language change error:", error);
      window.location.reload();
    }
  };

  const currentLanguage =
    LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div
      ref={dropdownRef}
      className="fixed top-3 right-4 z-[9999] notranslate"
      style={{ isolation: "isolate" }}
    >
      {/* Hidden google translate mount point */}
      <div id="google_translate_element" style={{ display: "none" }} />

      {/* Language Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:border-green-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">🌐</span>
        <span className="font-medium text-slate-900">
          {currentLanguage.nativeName}
        </span>
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl transition-all">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Language / भाषा चुनें
            </p>
          </div>

          <div className="mt-1 max-h-72 overflow-y-auto space-y-0.5">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === selectedLang;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-green-50 font-semibold text-green-800"
                      : "text-slate-700 hover:bg-stone-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {lang.nativeName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {lang.name}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-base text-green-700">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
