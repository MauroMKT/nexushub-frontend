import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const STATUSES = ["in_corso", "in_pausa", "completato"];
const emptyForm = {
  title: "", client_id: "", status: "in_corso", is_retainer: false,
  retainer_monthly: "", hours_budget: "", hours_logged: 0, notes: "",
};

export default function AgencyProjects() {
  const { t } = useTranslation();
  const tp = (k) => t(`pilotModules.${k}`);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  function refresh() {
    api.listAgencyProjects().then(setProjects).catch((e) => setError(e.message));
  }

  useEffect(() => {
    refresh();
    api.listClients().then(setClients).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form, client_id: form.client_id || null,
        retainer_monthly: form.retainer_monthly === "" ? null : Number(form.retainer_monthly),
        hours_budget: form.hours_budget === "" ? null : Number(form.hours_budget),
        hours_logged: Number(form.hours_logged) || 0,
      };
      await api.createAgencyProject(payload);
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(p, status) {
    await api.updateAgencyProject(p.id, { status });
    refresh();
  }

  async function handleDelete(id) {
    await api.deleteAgencyProject(id);
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{tp("agency.title")}</h1>
          <p className="text-sm text-ink/60">{tp("agency.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm"
        >
          {tp("common.new")}
        </button>
      </div>

      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-4">{error}</div>}

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={tp("agency.field_title")} value={form.title}
                   onChange={(v) => setForm({ ...form, title: v })} required />
            <Select label={tp("common.client_label")} value={form.client_id}
                    onChange={(v) => setForm({ ...form, client_id: v })}
                    options={[{ value: "", label: `— ${tp("common.client_none")}` },
                              ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select label={tp("agency.field_status")} value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                    options={STATUSES.map((s) => ({ value: s, label: tp(`agency.status_${s}`) }))} />
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={form.is_retainer}
                     onChange={(e) => setForm({ ...form, is_retainer: e.target.checked })} />
              {tp("agency.field_is_retainer")}
            </label>
            {form.is_retainer && (
              <Input label={tp("agency.field_retainer_monthly")} type="number" value={form.retainer_monthly}
                     onChange={(v) => setForm({ ...form, retainer_monthly: v })} />
            )}
            <Input label={tp("agency.field_hours_budget")} type="number" value={form.hours_budget}
                   onChange={(v) => setForm({ ...form, hours_budget: v })} />
            <Input label={tp("agency.field_hours_logged")} type="number" value={form.hours_logged}
                   onChange={(v) => setForm({ ...form, hours_logged: v })} />
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">{tp("common.notes_label")}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl2 px-3 py-2" rows={2} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
                {tp("common.save")}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div className="font-semibold">{p.title}</div>
              <button onClick={() => handleDelete(p.id)} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
            </div>
            {p.client_name && <div className="text-sm text-ink/60">{p.client_name}</div>}
            <select
              value={p.status}
              onChange={(e) => handleStatusChange(p, e.target.value)}
              className="mt-2 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{tp(`agency.status_${s}`)}</option>
              ))}
            </select>
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              {p.is_retainer && p.retainer_monthly != null && <div>💶 {p.retainer_monthly}/mese</div>}
              {p.hours_budget != null && <div>⏱️ {p.hours_logged}/{p.hours_budget}h</div>}
            </div>
          </Card>
        ))}
        {projects.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input
        type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl2 px-3 py-2"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl2 px-3 py-2">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
