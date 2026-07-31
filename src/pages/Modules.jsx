import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../api";
import Card from "../components/Card";
import { getModuleName, getSectorGroupName } from "../utils/moduleI18n";

// Catalogo dei moduli di settore attivabili (Fase 9). Il backend manda il
// nome del modulo e il gruppo di settore in tutte le 9 lingue dell'app
// (Fase 9.4): getModuleName/getSectorGroupName scelgono quella corrente,
// con fallback su inglese poi italiano (vedi utils/moduleI18n.js).
export default function Modules() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState(null);
  const [error, setError] = useState(null);

  function refresh() {
    setLoading(true);
    api.listModulesCatalog()
      .then(setCatalog)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function toggle(m) {
    setBusySlug(m.slug);
    setError(null);
    try {
      if (m.is_active_for_tenant) {
        await api.deactivateModule(m.slug);
      } else {
        await api.activateModule(m.slug);
      }
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusySlug(null);
    }
  }

  // Acquisto singolo del modulo (Fase 9.2): indipendente dall'upgrade di piano,
  // utile per chi vuole solo QUEL settore. Reindirizza al checkout Stripe;
  // l'attivazione effettiva avviene lato backend alla conferma del pagamento.
  async function buyStandalone(m) {
    setBusySlug(m.slug);
    setError(null);
    try {
      const { checkout_url } = await api.checkoutModulePurchase(m.slug);
      window.location.href = checkout_url;
    } catch (e) {
      setError(e.message);
      setBusySlug(null);
    }
  }

  const moduleName = (m) => getModuleName(m, i18n.language);

  // Raggruppa per sector_group (chiave italiana stabile, non tradotta: serve
  // solo a tenere insieme le righe dello stesso gruppo), ma mostra sempre
  // l'etichetta tradotta con getSectorGroupName.
  const grouped = catalog.reduce((acc, m) => {
    (acc[m.sector_group] = acc[m.sector_group] || { label: getSectorGroupName(m, i18n.language), items: [] });
    acc[m.sector_group].items.push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("modules.title")}</h1>
          <p className="text-sm text-ink/60">{t("modules.subtitle")}</p>
        </div>
        <button onClick={() => navigate("/settings")} className="text-xs underline text-ink/60">
          {t("modules.back_to_settings")}
        </button>
      </div>

      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2">{error}</div>}

      {loading && <p className="text-sm text-ink/50">{t("modules.loading")}</p>}

      {!loading && Object.entries(grouped).map(([group, { label, items: mods }]) => (
        <Card key={group}>
          <h2 className="font-semibold mb-3">{label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mods.map((m) => (
              <div key={m.slug} className={`border rounded-xl2 p-3 ${m.is_active_for_tenant ? "border-secondary bg-secondary/10" : "border-slate-200"}`}>
                <div className="font-medium text-sm mb-1">{moduleName(m)}</div>
                {m.is_active_for_tenant && (
                  <span className="text-[10px] font-semibold text-secondary uppercase">
                    {m.purchased_standalone ? t("modules.purchased_badge") : t("modules.active_badge")}
                  </span>
                )}
                {m.is_active_for_tenant && m.has_dedicated_feature && m.dedicated_route && (
                  <button
                    onClick={() => navigate(m.dedicated_route)}
                    className="block mt-2 text-xs px-2 py-1.5 rounded-xl2 font-semibold bg-primary hover:bg-primary/80 w-full"
                  >
                    {t("modules.open_feature")}
                  </button>
                )}
                {!m.unlocked && !m.is_active_for_tenant && (
                  <div className="text-xs text-ink/50 mb-2">{t("modules.locked_hint", { plan: m.min_plan })}</div>
                )}
                <div className="mt-2 space-y-1.5">
                  {m.unlocked ? (
                    <button
                      disabled={busySlug === m.slug}
                      onClick={() => toggle(m)}
                      className={`w-full text-xs px-2 py-1.5 rounded-xl2 font-semibold ${
                        m.is_active_for_tenant ? "bg-slate-100 hover:bg-slate-200" : "bg-primary hover:bg-primary/80"
                      }`}
                    >
                      {m.is_active_for_tenant ? t("modules.deactivate") : t("modules.activate")}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate("/settings")}
                        className="w-full text-xs px-2 py-1.5 rounded-xl2 font-semibold bg-accent/60 hover:bg-accent"
                      >
                        {t("modules.upgrade_cta")}
                      </button>
                      <button
                        disabled={busySlug === m.slug}
                        onClick={() => buyStandalone(m)}
                        className="w-full text-xs px-2 py-1.5 rounded-xl2 font-semibold border border-primary text-ink hover:bg-primary/10"
                      >
                        {t("modules.buy_standalone_cta")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
