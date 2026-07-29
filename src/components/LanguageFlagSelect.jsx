import { useEffect, useRef, useState } from "react";

// "variant" è la chiave mostrata/persistita nell'interfaccia (distingue le due
// bandiere per l'inglese); "i18nCode" è la lingua effettiva caricata da i18next
// (per ora coincide con il codice ISO usato in locales/*.json).
export const LANGUAGE_OPTIONS = [
  { variant: "it", i18nCode: "it", flag: "🇮🇹", label: "Italiano" },
  { variant: "en-US", i18nCode: "en", flag: "🇺🇸", label: "English (US)" },
  { variant: "en-GB", i18nCode: "en", flag: "🇬🇧", label: "English (UK)" },
  { variant: "fr", i18nCode: "fr", flag: "🇫🇷", label: "Français" },
  { variant: "es", i18nCode: "es", flag: "🇪🇸", label: "Español" },
  { variant: "de", i18nCode: "de", flag: "🇩🇪", label: "Deutsch" },
  { variant: "zh", i18nCode: "zh", flag: "🇨🇳", label: "中文" },
  { variant: "ja", i18nCode: "ja", flag: "🇯🇵", label: "日本語" },
  { variant: "ru", i18nCode: "ru", flag: "🇷🇺", label: "Русский" },
  { variant: "ar", i18nCode: "ar", flag: "🇸🇦", label: "العربية" },
];

export function findLanguageOption(variantOrCode) {
  return (
    LANGUAGE_OPTIONS.find((l) => l.variant === variantOrCode) ||
    LANGUAGE_OPTIONS.find((l) => l.i18nCode === variantOrCode) ||
    LANGUAGE_OPTIONS[0]
  );
}

export default function LanguageFlagSelect({ value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = findLanguageOption(value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm bg-bg hover:bg-slate-50"
      >
        <span className="text-lg leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="text-xs opacity-50">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-xl2 shadow-lg z-30 py-1 min-w-[170px]">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.variant}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-bg text-left ${
                opt.variant === current.variant ? "bg-bg font-semibold" : ""
              }`}
            >
              <span className="text-lg leading-none">{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
