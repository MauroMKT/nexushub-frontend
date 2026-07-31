import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const PHASES = ["progettazione", "permessi", "esecuzione", "collaudo", "chiuso"];
const emptyForm = { title: "", client_id: "", phase: "progettazione", deadline: "", budget: 0, notes: "" };

export default function EngineeringProjects() {
  const { t } = useTranslation();
  const tp = (k, opts) => t(`pilotModules.${k}`, opts);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  function refresh() {
    api.listEngineeringProjects().then(setProjects).catch((e) => setError(e.message));
  }

  useEffect(() => {
    refresh();
    api.listClients().then(setClients).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...form, client_id: form.client_id || null, budget: Number(form.budget) || 0 };
      await api.createEngineeringProject(payload);
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePhaseChange(project, phase) {
    await api.updateEngineeringProject(project.id, { phase });
    refresh();
  }

  async function handleDelete(id) {
    await api.deleteEngineeringProject(id);
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{tp("engineering.title")}</h1>
          <p className="text-sm text-ink/60">{tp("engineering.subtitle")}</p>
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
            <Input label={tp("engineering.field_title")} value={form.title}
                   onChange={(v) => setForm({ ...form, title: v })} required />
            <Select label={tp("common.client_label")} value={form.client_id}
                    onChange={(v) => setForm({ ...form, client_id: v })}
                    options={[{ value: "", label: `— ${tp("common.client_none")}` },
                              ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select label={tp("engineering.field_phase")} value={form.phase}
                    onChange={(v) => setForm({ ...form, phase: v })}
                    options={PHASES.map((p) => ({ value: p, label: tp(`engineering.phase_${p}`) }))} />
            <Input label={tp("engineering.field_budget")} type="number" value={form.budget}
                   onChange={(v) => setForm({ ...form, budget: v })} />
            <Input label={tp("engineering.field_deadline")} type="date" value={form.deadline}
                   onChange={(v) => setForm({ ...form, deadline: v })} />
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
              value={p.phase}
              onChange={(e) => handlePhaseChange(p, e.target.value)}
              className="mt-2 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
            >
              {PHASES.map((ph) => (
                <option key={ph} value={ph}>{tp(`engineering.phase_${ph}`)}</option>
              ))}
            </select>
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              {p.budget > 0 && <div>💰 {p.budget}</div>}
              {p.deadline && <div>📅 {new Date(p.deadline).toLocaleDateString()}</div>}
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
