import { useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "../components/Card";

// Elenco moduli documentati nella guida, nello stesso ordine della sidebar.
const MODULE_KEYS = [
  "dashboard",
  "clients",
  "contacts",
  "pipeline",
  "calendar",
  "tasks",
  "automations",
  "whatsapp",
  "email",
  "chat",
  "accounting",
  "settings",
  "portal",
];

const MODULE_ICONS = {
  dashboard: "🏠",
  clients: "👥",
  contacts: "📇",
  pipeline: "📊",
  calendar: "📅",
  tasks: "✅",
  automations: "⚡",
  whatsapp: "💬",
  email: "✉️",
  chat: "💬",
  accounting: "🧾",
  settings: "⚙️",
  portal: "🌐",
};

export default function Guide() {
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState("dashboard");

  function toggle(key) {
    setOpenKey((current) => (current === key ? null : key));
  }

  // Tutte le chiavi modulo hanno un'etichetta in nav.*, tranne "portal"
  // (il portale clienti non è una voce della sidebar del team) che usa portal.title.
  function moduleLabel(key) {
    return key === "portal" ? t("portal.title") : t(`nav.${key}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t("guide.title")}</h1>
      <p className="text-ink/60 mb-6">{t("guide.intro")}</p>

      <div className="space-y-2">
        {MODULE_KEYS.map((key) => {
          const isOpen = openKey === key;
          return (
            <Card key={key} className="!p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(key)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-secondary/20 transition-colors"
              >
                <span className="flex items-center gap-3 font-semibold">
                  <span aria-hidden="true">{MODULE_ICONS[key]}</span>
                  <span>{moduleLabel(key)}</span>
                </span>
                <span className={`transition-transform text-ink/40 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">
                  ▾
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-ink/70 leading-relaxed border-t border-slate-100 pt-4">
                  {t(`guide.${key}_body`)}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
