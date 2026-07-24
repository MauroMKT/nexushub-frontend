import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const emptyForm = { name: "", company: "", email: "", phone: "", sector: "" };

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    api.listClients().then(setClients).catch(() => {});
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await api.createClient(form);
    setForm(emptyForm);
    setShowForm(false);
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("clients.title")}</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm"
        >
          + {t("clients.new_client")}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={t("clients.name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Input label={t("clients.company")} value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Input label={t("clients.email")} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label={t("clients.phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label={t("clients.sector")} value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} />
            <div className="md:col-span-2">
              <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
                {t("clients.save")}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => (
          <Card key={c.id}>
            <div className="font-semibold">{c.name}</div>
            {c.company && <div className="text-sm text-ink/60">{c.company}</div>}
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              {c.email && <div>✉️ {c.email}</div>}
              {c.phone && <div>📞 {c.phone}</div>}
              {c.sector && <div>🏷️ {c.sector}</div>}
            </div>
            {c.tags?.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {c.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, required = false }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input
        value={value} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl2 px-3 py-2"
      />
    </div>
  );
}
