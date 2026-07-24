import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

export default function Dashboard() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.dashboardSummary().then(setSummary).catch(() => {});
  }, []);

  const kpis = summary
    ? [
        { label: t("dashboard.total_clients"), value: summary.total_clients, color: "bg-primary/30" },
        { label: t("dashboard.appointments_this_week"), value: summary.appointments_this_week, color: "bg-secondary/40" },
        { label: t("dashboard.tasks_due"), value: summary.tasks_due, color: "bg-positive/50" },
        { label: t("dashboard.open_deals"), value: summary.open_deals, color: "bg-accent/40" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("dashboard.title")}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className={k.color}>
            <div className="text-3xl font-bold">{k.value}</div>
            <div className="text-sm text-ink/70 mt-1">{k.label}</div>
          </Card>
        ))}
      </div>
      {summary && (
        <Card className="mt-4">
          <div className="text-sm text-ink/70">{t("dashboard.pipeline_value")}</div>
          <div className="text-2xl font-bold">
            {summary.pipeline_value.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
          </div>
        </Card>
      )}
    </div>
  );
}
