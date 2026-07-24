import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import { changeLanguage } from "../i18n";

export default function Topbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
      <div className="md:hidden font-bold text-primary">{t("app_name")}</div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <select
          aria-label={t("settings.language")}
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="border border-slate-200 rounded-xl2 px-2 py-1 text-sm bg-bg"
        >
          <option value="it">Italiano</option>
          <option value="en">English</option>
        </select>
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
