import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { getModuleName } from "../utils/moduleI18n";

// Sidebar moduli attivabili (Sezione 5.2 del documento: layout con sidebar dei moduli)
const ITEMS = [
  { to: "/dashboard", key: "dashboard", icon: "🏠" },
  { to: "/clients", key: "clients", icon: "👥" },
  { to: "/contacts", key: "contacts", icon: "📇" },
  { to: "/pipeline", key: "pipeline", icon: "📊" },
  { to: "/calendar", key: "calendar", icon: "📅" },
  { to: "/tasks", key: "tasks", icon: "✅" },
  { to: "/automations", key: "automations", icon: "⚡" },
  { to: "/whatsapp", key: "whatsapp", icon: "💬" },
  { to: "/email", key: "email", icon: "✉️" },
  { to: "/chat", key: "chat", icon: "💬" },
  { to: "/accounting", key: "accounting", icon: "🧾" },
  { to: "/modules", key: "modules", icon: "🧩" },
  { to: "/guide", key: "guide", icon: "📖" },
  { to: "/settings", key: "settings", icon: "⚙️" },
];

// Voci di navigazione dei moduli pilota di settore (Fase 9.1): compaiono SOLO
// se il tenant ha almeno un modulo attivo che punta a quella dedicated_route
// (es. sia servizi_marketing che servizi_it puntano a /agency-projects: basta
// che uno dei due sia attivo). icon+key indicizzati per dedicated_route.
const PILOT_NAV_META = {
  "/engineering": { key: "engineering", icon: "🛠️" },
  "/agency-projects": { key: "agencyProjects", icon: "📁" },
  "/real-estate": { key: "realEstate", icon: "🏘️" },
  "/hospitality": { key: "hospitality", icon: "🍽️" },
  "/gym": { key: "gym", icon: "🥋" },
};

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  // Voci di navigazione per QUALSIASI modulo attivo con una pagina dedicata:
  // sia i 4 pilota bespoke di Fase 9.1 (route fissa in PILOT_NAV_META, con
  // etichetta tradotta in 9 lingue) sia i ~18 moduli "generici" di Fase 9.3
  // (route dinamica /sector/<slug>, etichetta presa dal nome del modulo nel
  // catalogo — anche questo tradotto in tutte le 9 lingue da Fase 9.4, vedi
  // getModuleName in utils/moduleI18n.js).
  const [dedicatedModules, setDedicatedModules] = useState([]);

  useEffect(() => {
    api.listModulesCatalog()
      .then((catalog) => {
        const active = catalog.filter((m) => m.is_active_for_tenant && m.has_dedicated_feature && m.dedicated_route);
        const byRoute = new Map();
        active.forEach((m) => {
          if (!byRoute.has(m.dedicated_route)) byRoute.set(m.dedicated_route, m);
        });
        setDedicatedModules([...byRoute.values()]);
      })
      .catch(() => setDedicatedModules([]));
  }, []);

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-100 min-h-screen p-4 hidden md:block">
      <div className="text-xl font-bold text-primary mb-8 px-2">{t("app_name")}</div>
      <nav className="space-y-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl2 text-sm font-medium transition-colors ${
                isActive ? "bg-primary/40 text-ink" : "text-ink/70 hover:bg-secondary/30"
              }`
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
        {dedicatedModules.map((m) => {
          const meta = PILOT_NAV_META[m.dedicated_route];
          const label = meta ? t(`nav.${meta.key}`) : getModuleName(m, i18n.language);
          const icon = meta ? meta.icon : "📋";
          return (
            <NavLink
              key={m.dedicated_route}
              to={m.dedicated_route}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/40 text-ink" : "text-ink/70 hover:bg-secondary/30"
                }`
              }
            >
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </NavLink>
          );
        })}
        {user?.role === "platform_admin" && (
          <NavLink
            to="/platform-admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl2 text-sm font-medium transition-colors ${
                isActive ? "bg-primary/40 text-ink" : "text-ink/70 hover:bg-secondary/30"
              }`
            }
          >
            <span aria-hidden="true">🛡️</span>
            <span>{t("nav.super_admin")}</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
