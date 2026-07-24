import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

// Pipeline vendite kanban (M1). Drag & drop semplificato con select di fase
// per restare accessibile anche senza mouse (Sezione 5.2 - accessibilita').
export default function Pipeline() {
  const { t } = useTranslation();
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [clients, setClients] = useState([]);

  function refresh() {
    api.listStages().then(setStages);
    api.listDeals().then(setDeals);
    api.listClients().then(setClients);
  }

  useEffect(refresh, []);

  async function moveDeal(dealId, stageId) {
    await api.moveDeal(dealId, stageId);
    refresh();
  }

  function clientName(id) {
    return clients.find((c) => c.id === id)?.name || "-";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("pipeline.title")}</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="min-w-[260px]">
            <div className="font-semibold text-sm mb-2 px-1">{stage.name}</div>
            <div className="space-y-2">
              {deals.filter((d) => d.stage_id === stage.id).map((deal) => (
                <Card key={deal.id} className="bg-primary/10">
                  <div className="font-medium text-sm">{deal.title}</div>
                  <div className="text-xs text-ink/60">{clientName(deal.client_id)}</div>
                  <div className="text-sm font-semibold mt-1">
                    {deal.value.toLocaleString(undefined, { style: "currency", currency: deal.currency })}
                  </div>
                  <select
                    className="mt-2 w-full text-xs border border-slate-200 rounded-lg px-1 py-1"
                    value={stage.id}
                    onChange={(e) => moveDeal(deal.id, e.target.value)}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
