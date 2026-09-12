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

function getInitialLanguage() {
  if (typeof window === "undefined") return "en";
  try {
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/i);
    if (match && match[1]) {
      const code = match[1].toLowerCase();
      if (LANGUAGES.some((l) => l.code === code)) {
        return code;
      }
    }
    const saved = localStorage.getItem("krishi_language");
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch {
    // Ignore errors during hydration
  }
  return "en";
}

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedLang, setSelectedLang] = useState(getInitialLanguage);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const hasScrolled = window.scrollY > 24;
      setIsScrolled(hasScrolled);
      if (hasScrolled) {
        setIsOpen(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync active language periodically so external resets are detected
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const active = getInitialLanguage();
      setSelectedLang((prev) => (prev !== active ? active : prev));
    }, 800);

    return () => clearInterval(syncInterval);
  }, []);

  // Aggressively suppress Google Translate banner and body push-down
  useEffect(() => {
    if (typeof window === "undefined") return;

    const suppressBanner = () => {
      // Keep body and html top at 0
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.setProperty("top", "0px", "important");
      }
      if (
        document.body.style.position &&
        document.body.style.position !== "static"
      ) {
        document.body.style.setProperty("position", "static", "important");
      }
      if (
        document.documentElement.style.top &&
        document.documentElement.style.top !== "0px"
      ) {
        document.documentElement.style.setProperty("top", "0px", "important");
      }

      // Hide banner iframes and skiptranslate elements
      const targets = document.querySelectorAll(
        'iframe.goog-te-banner-frame, iframe[id*=":1.container"], iframe[id*=":2.container"], iframe[class*="VIpgJd"], .VIpgJd-ZVi9od-OR9Gae-OStTKf, .VIpgJd-ZVi9od-l4eHX-hSRGPd, body > .skiptranslate:not(#google_translate_element)'
      );
      targets.forEach((el) => {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("height", "0px", "important");
        el.style.setProperty("width", "0px", "important");
        el.style.setProperty("position", "absolute", "important");
        el.style.setProperty("top", "-9999px", "important");
      });
    };

    suppressBanner();
    const interval = setInterval(suppressBanner, 200);

    const observer = new MutationObserver(() => {
      suppressBanner();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
      childList: true,
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
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
            layout:
              window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
      }
    };

    if (!document.querySelector('script[data-gtranslate="true"]')) {
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.gtranslate = "true";
      document.body.appendChild(script);
    }
  }, []);

  // Handle outside click & escape
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
      const domainParts = hostname.split(".");

      if (langCode === "en") {
        // Clear all googtrans cookies
        document.cookie =
          "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${hostname}; path=/;`;
        if (domainParts.length > 1) {
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${hostname}; path=/;`;
        }

        // Trigger original language selection in combo if available
        const selectEl = document.querySelector(".goog-te-combo");
        if (selectEl) {
          selectEl.selectedIndex = 0;
          selectEl.value = "";
          selectEl.dispatchEvent(new Event("change"));
        } else {
          window.location.reload();
        }
      } else {
        document.cookie = `googtrans=/en/${langCode}; path=/;`;
        document.cookie = `googtrans=/en/${langCode}; domain=${hostname}; path=/;`;

        const selectEl = document.querySelector(".goog-te-combo");
        if (selectEl) {
          let found = false;
          for (let i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].value === langCode) {
              selectEl.selectedIndex = i;
              found = true;
              break;
            }
          }
          if (found) {
            selectEl.dispatchEvent(new Event("change"));
          } else {
            selectEl.value = langCode;
            selectEl.dispatchEvent(new Event("change"));
          }
        } else {
          window.location.reload();
        }
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
      className={`relative z-50 notranslate transition-all duration-200 ${
        isScrolled
          ? "pointer-events-none invisible -translate-y-3 opacity-0"
          : "visible opacity-100"
      }`}
      style={{ isolation: "isolate" }}
    >
      {/* Hidden google translate mount point */}
      <div id="google_translate_element" style={{ display: "none" }} />

      {/* Language Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm backdrop-blur transition hover:border-green-600 hover:bg-white focus:outline-none focus:ring-1 focus:ring-green-500/20"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-xs leading-none">🌐</span>
        <span className="text-xs font-medium text-slate-900">
          {currentLanguage.nativeName}
        </span>
        <svg
          className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
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
