import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { changeLanguage } from "../i18n";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [team, setTeam] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");

  function refresh() {
    api.getTenantSettings().then(setTenant).catch(() => {});
    api.listTeam().then(setTeam).catch(() => {});
  }

  useEffect(refresh, []);

  async function handleInvite(e) {
    e.preventDefault();
    await api.inviteTeamMember({
      email: inviteEmail, full_name: inviteName, password: invitePassword, role: "member",
    });
    setInviteEmail(""); setInviteName(""); setInvitePassword("");
    refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      <Card>
        <h2 className="font-semibold mb-3">{tenant?.name}</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">{t("settings.language")}</label>
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="border border-slate-200 rounded-xl2 px-2 py-1 text-sm"
          >
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </select>
        </div>
        <p className="text-xs text-ink/50 mt-2">
          Piano attuale: <span className="font-medium capitalize">{tenant?.plan}</span> · Settore: {tenant?.sector || "-"}
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("settings.team")}</h2>
        <ul className="divide-y divide-slate-100 mb-4">
          {team.map((m) => (
            <li key={m.id} className="py-2 flex justify-between text-sm">
              <span>{m.full_name} <span className="text-ink/40">({m.email})</span></span>
              <span className="capitalize text-ink/60">{m.role}</span>
            </li>
          ))}
        </ul>
        {user?.role === "admin" && (
          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input placeholder="Nome" required value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                   className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm" />
            <input placeholder="Email" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                   className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm" />
            <input placeholder="Password" type="password" required value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)}
                   className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm" />
            <button type="submit" className="sm:col-span-3 bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
              {t("settings.invite")}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
