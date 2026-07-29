import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

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
  { to: "/guide", key: "guide", icon: "📖" },
  { to: "/settings", key: "settings", icon: "⚙️" },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
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
            <span>Super Admin</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
