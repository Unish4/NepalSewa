import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import useAuthStore from "../../store/useAuthStore.js";

const LANGUAGES = [
  { code: "en", nativeLabel: "English", flag: "🇬🇧" },
  { code: "ne", nativeLabel: "नेपाली", flag: "🇳🇵" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { isAuthenticated, updatePreferences } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (code) => {
    i18n.changeLanguage(code);
    setOpen(false);

    if (isAuthenticated) {
      try {
        await updatePreferences({ preferredLanguage: code });
      } catch {
        // Silent — local language change already succeeded
      }
    }
  };

  const current =
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[#475569]
          hover:bg-[#f8fafc] transition-colors text-xs font-medium"
        aria-label="Change language"
      >
        <Languages size={15} />
        <span className="hidden sm:inline">
          {current.flag} {current.nativeLabel}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-40 bg-white rounded-xl border
          border-[#e2e8f0] shadow-lg py-1.5 z-50"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center justify-between px-3 py-2
                text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                {lang.nativeLabel}
              </span>
              {i18n.language === lang.code && (
                <Check size={14} className="text-[#16a34a]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
