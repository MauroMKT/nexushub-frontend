import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { api } from "../api";
import Card from "../components/Card";

const STATUSES = ["aperto", "in_corso", "chiuso"];
const emptyForm = { title: "", client_id: "", status: "aperto", value: "", reference_date: "", notes: "" };

// Pagina generica per i moduli di settore SENZA una feature dedicata bespoke
// (Fase 9.3): la stessa pagina serve tutti i ~18 settori "generici" del
// catalogo, cambiando solo etichetta ("Pratica Legale", "Intervento in
// Officina", ecc.) e nome del modulo, letti dal catalogo tramite lo slug
// nella rotta (/sector/:slug).
export default function SectorWorkspace() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const tp = (k) => t(`pilotModules.${k}`);
  const isItalian = i18n.language?.startsWith("it");

  const [moduleInfo, setModuleInfo] = useState(null);
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  function refreshRecords() {
    api.listSectorRecords(slug).then(setRecords).catch((e) => setError(e.message));
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.listModulesCatalog(), api.listClients()])
      .then(([catalog, clientList]) => {
        const found = catalog.find((m) => m.slug === slug) || null;
        setModuleInfo(found);
        setClients(clientList);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    refreshRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const moduleName = moduleInfo ? (isItalian ? moduleInfo.name_it : moduleInfo.name_en) : slug;
  const recordLabel = useMemo(() => {
    if (!moduleInfo) return tp("sectorWorkspace.field_title");
    return (isItalian ? moduleInfo.record_label_it : moduleInfo.record_label_en) || moduleName;
  }, [moduleInfo, isItalian, moduleName]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form, client_id: form.client_id || null,
        value: form.value === "" ? null : Number(form.value),
        reference_date: form.reference_date ? new Date(form.reference_date).toISOString() : null,
      };
      await api.createSectorRecord(slug, payload);
      setForm(emptyForm);
      setShowForm(false);
      refreshRecords();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(r, status) {
    await api.updateSectorRecord(slug, r.id, { status });
    refreshRecords();
  }

  async function handleDelete(id) {
    await api.deleteSectorRecord(slug, id);
    refreshRecords();
  }

  if (loading) {
    return <p className="text-ink/50 text-sm">…</p>;
  }

  if (!moduleInfo || !moduleInfo.is_active_for_tenant) {
    return (
      <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-4">
        {tp("common.empty")}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{moduleName}</h1>
          <p className="text-sm text-ink/60">{recordLabel}</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm"
        >
          {tp("common.new")} {recordLabel}
        </button>
      </div>

      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-4">{error}</div>}

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={recordLabel} value={form.title}
                   onChange={(v) => setForm({ ...form, title: v })} required />
            <Select label={tp("common.client_label")} value={form.client_id}
                    onChange={(v) => setForm({ ...form, client_id: v })}
                    options={[{ value: "", label: `— ${tp("common.client_none")}` },
                              ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select label={tp("sectorWorkspace.field_status")} value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                    options={STATUSES.map((s) => ({ value: s, label: tp(`sectorWorkspace.status_${s}`) }))} />
            <Input label={tp("sectorWorkspace.field_value")} type="number" value={form.value}
                   onChange={(v) => setForm({ ...form, value: v })} />
            <Input label={tp("sectorWorkspace.field_date")} type="date" value={form.reference_date}
                   onChange={(v) => setForm({ ...form, reference_date: v })} />
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
        {records.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between">
              <div className="font-semibold">{r.title}</div>
              <button onClick={() => handleDelete(r.id)} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
            </div>
            {r.client_name && <div className="text-sm text-ink/60">{r.client_name}</div>}
            <select
              value={r.status}
              onChange={(e) => handleStatusChange(r, e.target.value)}
              className="mt-2 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{tp(`sectorWorkspace.status_${s}`)}</option>
              ))}
            </select>
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              {r.value != null && <div>💰 {r.value}</div>}
              {r.reference_date && <div>📅 {new Date(r.reference_date).toLocaleDateString()}</div>}
            </div>
          </Card>
        ))}
        {records.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
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
