import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { api } from "../api";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

const PLANS = ["free", "premium", "enterprise"];

// Pannello riservato al super admin della piattaforma (ruolo platform_admin).
// Testo solo in italiano: è uno strumento interno di Mauro per gestire tutte
// le agenzie clienti, non una funzionalità rivolta ai clienti finali del CRM.
export default function PlatformAdmin() {
  const { user, enterTenantView } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  // Pannello moduli espanso per un tenant alla volta (id del tenant, o null).
  const [modulesTenantId, setModulesTenantId] = useState(null);
  const [modulesCatalog, setModulesCatalog] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Cancellazione definitiva: richiede di digitare il nome esatto del tenant.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  // Entra nei dati del tenant restando autenticato come Super Admin: nessun
  // nuovo token, nessun login con le credenziali dell'iscritto. Le pagine
  // normali del CRM (Clienti, Pipeline, Impostazioni, ...) si aprono con i
  // dati di questo tenant, con una barra in alto per uscire in ogni momento.
  // Avvolto in try/catch: se qualcosa fallisce (localStorage bloccato, stato
  // del context non pronto, ecc.) l'errore ora viene mostrato nel banner rosso
  // invece di fallire silenziosamente senza che il click sembri fare nulla.
  function handleEnterAsTenant(tenant) {
    setError(null);
    try {
      enterTenantView(tenant.id);
      navigate("/dashboard");
    } catch (e) {
      setError(`Impossibile entrare nel profilo: ${e?.message || e}`);
    }
  }

  async function toggleModulesPanel(tenant) {
    if (modulesTenantId === tenant.id) {
      setModulesTenantId(null);
      return;
    }
    setModulesTenantId(tenant.id);
    setModulesLoading(true);
    setError(null);
    try {
      const catalog = await api.platformAdminListTenantModules(tenant.id);
      setModulesCatalog(catalog);
    } catch (e) {
      setError(e.message);
    } finally {
      setModulesLoading(false);
    }
  }

  async function toggleModule(tenant, moduleItem) {
    setModulesLoading(true);
    setError(null);
    try {
      if (moduleItem.is_active_for_tenant) {
        await api.platformAdminDeactivateTenantModule(tenant.id, moduleItem.slug);
      } else {
        await api.platformAdminActivateTenantModule(tenant.id, moduleItem.slug);
      }
      const catalog = await api.platformAdminListTenantModules(tenant.id);
      setModulesCatalog(catalog);
    } catch (e) {
      setError(e.message);
    } finally {
      setModulesLoading(false);
    }
  }

  function openDeleteConfirm(tenant) {
    setDeleteTarget(tenant);
    setDeleteConfirmText("");
    setError(null);
  }

  async function confirmDeleteTenant() {
    if (!deleteTarget || deleteConfirmText.trim() !== deleteTarget.name) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await api.platformAdminDeleteTenantPermanent(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteConfirmText("");
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  // Raggruppa il catalogo moduli per sector_group, per una lista leggibile
  // invece di 24 righe piatte.
  const groupedModules = modulesCatalog.reduce((acc, m) => {
    (acc[m.sector_group] = acc[m.sector_group] || []).push(m);
    return acc;
  }, {});

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
                <>
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
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={busyId === t.id}
                          onClick={() => toggleSuspend(t)}
                          className="text-xs px-2 py-1 rounded-xl2 bg-slate-100 hover:bg-slate-200"
                        >
                          {t.is_active ? "Sospendi" : "Riattiva"}
                        </button>
                        <button
                          onClick={() => handleEnterAsTenant(t)}
                          className="text-xs px-2 py-1 rounded-xl2 bg-secondary/60 hover:bg-secondary"
                        >
                          Entra (come Super Admin)
                        </button>
                        <button
                          onClick={() => toggleModulesPanel(t)}
                          className="text-xs px-2 py-1 rounded-xl2 bg-primary/20 hover:bg-primary/30"
                        >
                          {modulesTenantId === t.id ? "Chiudi moduli" : "Moduli"}
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(t)}
                          className="text-xs px-2 py-1 rounded-xl2 bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Elimina definitivamente
                        </button>
                      </div>
                    </td>
                  </tr>
                  {modulesTenantId === t.id && (
                    <tr key={`${t.id}-modules`} className="border-b border-slate-50 bg-bg/50">
                      <td colSpan={7} className="py-3 px-3">
                        {modulesLoading && <div className="text-xs text-ink/50">Caricamento moduli…</div>}
                        {!modulesLoading && (
                          <div className="space-y-3">
                            {Object.entries(groupedModules).map(([group, mods]) => (
                              <div key={group}>
                                <div className="text-xs font-semibold text-ink/60 mb-1">{group}</div>
                                <div className="flex flex-wrap gap-2">
                                  {mods.map((m) => (
                                    <button
                                      key={m.slug}
                                      onClick={() => toggleModule(t, m)}
                                      className={`text-xs px-2 py-1 rounded-xl2 border ${
                                        m.is_active_for_tenant
                                          ? "bg-secondary/60 border-secondary"
                                          : "bg-white border-slate-200 hover:bg-slate-50"
                                      }`}
                                      title={`Piano minimo: ${m.min_plan}`}
                                    >
                                      {m.is_active_for_tenant ? "✓ " : ""}{m.name_it}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {modulesCatalog.length === 0 && (
                              <div className="text-xs text-ink/40">Nessun modulo nel catalogo.</div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-ink/40">Nessuna agenzia registrata.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h2 className="font-semibold mb-2 text-red-700">Cancellazione definitiva</h2>
            <p className="text-sm text-ink/70 mb-3">
              Stai per cancellare <strong>permanentemente e senza possibilità di recupero</strong> l'agenzia
              «{deleteTarget.name}» e tutti i suoi dati (clienti, trattative, fatture, chat, documenti, moduli attivati, utenti).
              Questa azione NON è reversibile, a differenza della sospensione.
            </p>
            <p className="text-sm text-ink/70 mb-2">
              Per confermare, digita esattamente il nome dell'agenzia: <strong>{deleteTarget.name}</strong>
            </p>
            <input
              autoFocus
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm mb-3"
              placeholder={deleteTarget.name}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-sm px-3 py-1.5 rounded-xl2 bg-slate-100 hover:bg-slate-200"
              >
                Annulla
              </button>
              <button
                disabled={deleteBusy || deleteConfirmText.trim() !== deleteTarget.name}
                onClick={confirmDeleteTenant}
                className="text-sm px-3 py-1.5 rounded-xl2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
              >
                {deleteBusy ? "Cancellazione…" : "Cancella definitivamente"}
              </button>
            </div>
          </Card>
        </div>
      )}
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
