import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { api } from "../api";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

const PLANS = ["free", "premium", "enterprise"];

// Pannello riservato al super admin della piattaforma (ruolo platform_admin).
// Testo solo in italiano: è uno strumento interno di Mauro per gestire tutte
// le agenzie clienti, non una funzionalità rivolta ai clienti finali del CRM.
export default function PlatformAdmin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [impersonateLink, setImpersonateLink] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  function refresh() {
    api.platformAdminStats().then(setStats).catch(() => {});
    api.platformAdminListTenants().then(setTenants).catch(() => {});
  }

  useEffect(() => {
    if (user?.role === "platform_admin") refresh();
  }, [user]);

  if (!user || user.role !== "platform_admin") {
    return <Navigate to="/" replace />;
  }

  async function toggleSuspend(tenant) {
    setBusyId(tenant.id);
    setError(null);
    try {
      if (tenant.is_active) {
        await api.platformAdminSuspendTenant(tenant.id);
      } else {
        await api.platformAdminUpdateTenant(tenant.id, { is_active: true });
      }
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function changePlan(tenant, plan) {
    setBusyId(tenant.id);
    setError(null);
    try {
      await api.platformAdminUpdateTenant(tenant.id, { plan });
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleImpersonate(tenant) {
    setError(null);
    try {
      const res = await api.platformAdminImpersonate(tenant.id);
      const link = `${window.location.origin}/impersonate#token=${res.access_token}`;
      setImpersonateLink({ tenant: tenant.name, email: res.impersonated_user_email, link });
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Super Admin — Tutte le agenzie</h1>
      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2">{error}</div>}

      {stats && (
        <Card>
          <h2 className="font-semibold mb-3">Panoramica piattaforma</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Stat label="Agenzie totali" value={stats.total_tenants} />
            <Stat label="Attive" value={stats.active_tenants} />
            <Stat label="Sospese" value={stats.suspended_tenants} />
            <Stat label="Utenti totali" value={stats.total_users} />
            <Stat label="Clienti totali (di tutte le agenzie)" value={stats.total_clients} />
            {Object.entries(stats.tenants_by_plan || {}).map(([plan, count]) => (
              <Stat key={plan} label={`Piano ${plan}`} value={count} />
            ))}
          </div>
        </Card>
      )}

      {impersonateLink && (
        <Card className="border-2 border-primary">
          <h2 className="font-semibold mb-2">Link di accesso come {impersonateLink.email} ({impersonateLink.tenant})</h2>
          <p className="text-xs text-ink/60 mb-2">
            Apri questo link in una finestra in incognito: se lo apri nella stessa finestra rischi di sovrascrivere
            la tua sessione da super admin.
          </p>
          <div className="flex gap-2 items-center">
            <input readOnly value={impersonateLink.link} className="flex-1 border border-slate-200 rounded-xl2 px-3 py-2 text-xs" />
            <a href={impersonateLink.link} target="_blank" rel="noreferrer"
               className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm whitespace-nowrap">
              Apri
            </a>
            <button onClick={() => setImpersonateLink(null)} className="text-sm text-ink/50 px-2">✕</button>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold mb-3">Agenzie registrate ({tenants.length})</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/50 border-b border-slate-100">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Piano</th>
                <th className="py-2 pr-3">Utenti</th>
                <th className="py-2 pr-3">Clienti</th>
                <th className="py-2 pr-3">Stato</th>
                <th className="py-2 pr-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="py-2 pr-3 font-medium">{t.name}</td>
                  <td className="py-2 pr-3 text-ink/60 capitalize">{t.account_type.replace("_", " ")}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={t.plan}
                      disabled={busyId === t.id}
                      onChange={(e) => changePlan(t, e.target.value)}
                      className="border border-slate-200 rounded-xl2 px-2 py-1 text-xs capitalize"
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-3">{t.user_count}</td>
                  <td className="py-2 pr-3">{t.client_count}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.is_active ? "bg-secondary/60" : "bg-accent/60"}`}>
                      {t.is_active ? "Attiva" : "Sospesa"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 flex gap-2">
                    <button
                      disabled={busyId === t.id}
                      onClick={() => toggleSuspend(t)}
                      className="text-xs px-2 py-1 rounded-xl2 bg-slate-100 hover:bg-slate-200"
                    >
                      {t.is_active ? "Sospendi" : "Riattiva"}
                    </button>
                    <button
                      onClick={() => handleImpersonate(t)}
                      className="text-xs px-2 py-1 rounded-xl2 bg-secondary/60 hover:bg-secondary"
                    >
                      Accedi come
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-ink/40">Nessuna agenzia registrata.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-bg rounded-xl2 p-3">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-ink/50">{label}</div>
    </div>
  );
}
