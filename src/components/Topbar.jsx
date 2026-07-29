import { useState } from "react";
import { useTranslation } from "react-i18next";

import LanguageFlagSelect, { findLanguageOption } from "./LanguageFlagSelect";
import { useAuth } from "../context/AuthContext";
import { changeLanguage } from "../i18n";

export default function Topbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [variant, setVariant] = useState(
    localStorage.getItem("nexushub_lang_variant") || findLanguageOption(localStorage.getItem("nexushub_lang")).variant
  );

  function handleLanguageChange(opt) {
    changeLanguage(opt.i18nCode);
    localStorage.setItem("nexushub_lang_variant", opt.variant);
    setVariant(opt.variant);
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
      <div className="md:hidden font-bold text-primary">{t("app_name")}</div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <LanguageFlagSelect value={variant} onChange={handleLanguageChange} />
        {user && (
          <>
            <span className="text-sm text-ink/70 hidden sm:inline">{user.full_name}</span>
            <button
              onClick={logout}
              className="text-sm px-3 py-1.5 rounded-xl2 bg-accent/60 hover:bg-accent text-ink font-medium"
            >
              {t("common.logout")}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
