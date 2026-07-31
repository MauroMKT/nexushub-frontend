import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../api";
import Card from "../components/Card";

// Catalogo dei moduli di settore attivabili (Fase 9). I nomi dei moduli
// arrivano dal backend in italiano/inglese (name_it/name_en): il catalogo
// dei ~25 settori non è ancora tradotto in tutte le 9 lingue dell'app,
// quindi qui si sceglie name_en per le lingue non italiane come fallback
// ragionevole finché non viene fatta una localizzazione dedicata.
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

  const moduleName = (m) => (i18n.language?.startsWith("it") ? m.name_it : m.name_en);

  const grouped = catalog.reduce((acc, m) => {
    (acc[m.sector_group] = acc[m.sector_group] || []).push(m);
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

      {!loading && Object.entries(grouped).map(([group, mods]) => (
        <Card key={group}>
          <h2 className="font-semibold mb-3">{group}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mods.map((m) => (
              <div key={m.slug} className={`border rounded-xl2 p-3 ${m.is_active_for_tenant ? "border-secondary bg-secondary/10" : "border-slate-200"}`}>
                <div className="font-medium text-sm mb-1">{moduleName(m)}</div>
                {m.is_active_for_tenant && (
                  <span className="text-[10px] font-semibold text-secondary uppercase">{t("modules.active_badge")}</span>
                )}
                {!m.unlocked && !m.is_active_for_tenant && (
                  <div className="text-xs text-ink/50 mb-2">{t("modules.locked_hint", { plan: m.min_plan })}</div>
                )}
                <div className="mt-2">
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
                    <button
                      onClick={() => navigate("/settings")}
                      className="w-full text-xs px-2 py-1.5 rounded-xl2 font-semibold bg-accent/60 hover:bg-accent"
                    >
                      {t("modules.upgrade_cta")}
                    </button>
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
