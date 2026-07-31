import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const TYPES = ["residenziale", "commerciale", "terreno", "garage", "altro"];
const STATUSES = ["disponibile", "in_trattativa", "venduto", "affittato"];
const emptyForm = {
  title: "", client_id: "", property_type: "residenziale", address: "",
  size_sqm: "", price: "", status: "disponibile", notes: "",
};

export default function RealEstateProperties() {
  const { t } = useTranslation();
  const tp = (k) => t(`pilotModules.${k}`);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  function refresh() {
    api.listRealEstateProperties().then(setProperties).catch((e) => setError(e.message));
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
        size_sqm: form.size_sqm === "" ? null : Number(form.size_sqm),
        price: form.price === "" ? null : Number(form.price),
      };
      await api.createRealEstateProperty(payload);
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(p, status) {
    await api.updateRealEstateProperty(p.id, { status });
    refresh();
  }

  async function handleDelete(id) {
    await api.deleteRealEstateProperty(id);
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{tp("realEstate.title")}</h1>
          <p className="text-sm text-ink/60">{tp("realEstate.subtitle")}</p>
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
            <Input label={tp("realEstate.field_title")} value={form.title}
                   onChange={(v) => setForm({ ...form, title: v })} required />
            <Select label={tp("common.client_label")} value={form.client_id}
                    onChange={(v) => setForm({ ...form, client_id: v })}
                    options={[{ value: "", label: `— ${tp("common.client_none")}` },
                              ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select label={tp("realEstate.field_type")} value={form.property_type}
                    onChange={(v) => setForm({ ...form, property_type: v })}
                    options={TYPES.map((ty) => ({ value: ty, label: tp(`realEstate.type_${ty}`) }))} />
            <Select label={tp("realEstate.field_status")} value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                    options={STATUSES.map((s) => ({ value: s, label: tp(`realEstate.status_${s}`) }))} />
            <Input label={tp("realEstate.field_address")} value={form.address}
                   onChange={(v) => setForm({ ...form, address: v })} />
            <Input label={tp("realEstate.field_size")} type="number" value={form.size_sqm}
                   onChange={(v) => setForm({ ...form, size_sqm: v })} />
            <Input label={tp("realEstate.field_price")} type="number" value={form.price}
                   onChange={(v) => setForm({ ...form, price: v })} />
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
        {properties.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div className="font-semibold">{p.title}</div>
              <button onClick={() => handleDelete(p.id)} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
            </div>
            {p.client_name && <div className="text-sm text-ink/60">{p.client_name}</div>}
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/40 mt-1">
              {tp(`realEstate.type_${p.property_type}`)}
            </span>
            <select
              value={p.status}
              onChange={(e) => handleStatusChange(p, e.target.value)}
              className="mt-2 ml-1 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{tp(`realEstate.status_${s}`)}</option>
              ))}
            </select>
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              {p.address && <div>📍 {p.address}</div>}
              {p.size_sqm != null && <div>📐 {p.size_sqm} m²</div>}
              {p.price != null && <div>💰 {p.price}</div>}
            </div>
          </Card>
        ))}
        {properties.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
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
