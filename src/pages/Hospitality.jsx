import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const RES_STATUSES = ["confirmed", "seated", "completed", "cancelled", "no_show"];
const MENU_CATEGORIES = ["antipasti", "primi", "secondi", "dolci", "bevande", "altro"];

const emptyReservation = {
  client_id: "", guest_name: "", party_size: 2, table_label: "",
  reservation_time: "", status: "confirmed", notes: "",
};
const emptyMenuItem = { name: "", category: "antipasti", price: 0, description: "", is_available: true };

export default function Hospitality() {
  const { t } = useTranslation();
  const tp = (k) => t(`pilotModules.${k}`);
  const [tab, setTab] = useState("reservations");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tp("hospitality.title")}</h1>
        <p className="text-sm text-ink/60">{tp("hospitality.subtitle")}</p>
      </div>
      <div className="flex gap-2 mb-6">
        <TabButton active={tab === "reservations"} onClick={() => setTab("reservations")} label={tp("hospitality.tab_reservations")} />
        <TabButton active={tab === "menu"} onClick={() => setTab("menu")} label={tp("hospitality.tab_menu")} />
      </div>
      {tab === "reservations" ? <ReservationsTab tp={tp} /> : <MenuTab tp={tp} />}
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl2 text-sm font-semibold border transition-colors ${
        active ? "bg-primary border-primary text-ink" : "border-slate-200 text-ink/60 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function ReservationsTab({ tp }) {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyReservation);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  function refresh() {
    api.listReservations().then(setReservations).catch((e) => setError(e.message));
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
        guest_name: form.guest_name || null,
        party_size: Number(form.party_size) || 1,
        reservation_time: form.reservation_time ? new Date(form.reservation_time).toISOString() : null,
      };
      await api.createReservation(payload);
      setForm(emptyReservation);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(r, status) {
    await api.updateReservation(r.id, { status });
    refresh();
  }

  async function handleDelete(id) {
    await api.deleteReservation(id);
    refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm((s) => !s)} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
          {tp("common.new")}
        </button>
      </div>
      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-4">{error}</div>}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label={tp("common.client_label")} value={form.client_id}
                    onChange={(v) => setForm({ ...form, client_id: v })}
                    options={[{ value: "", label: `— ${tp("common.client_none")}` },
                              ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Input label={tp("hospitality.field_guest_name")} value={form.guest_name}
                   onChange={(v) => setForm({ ...form, guest_name: v })} />
            <Input label={tp("hospitality.field_party_size")} type="number" value={form.party_size}
                   onChange={(v) => setForm({ ...form, party_size: v })} />
            <Input label={tp("hospitality.field_table_label")} value={form.table_label}
                   onChange={(v) => setForm({ ...form, table_label: v })} />
            <Input label={tp("hospitality.field_reservation_time")} type="datetime-local" value={form.reservation_time}
                   onChange={(v) => setForm({ ...form, reservation_time: v })} required />
            <Select label={tp("hospitality.field_status")} value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                    options={RES_STATUSES.map((s) => ({ value: s, label: tp(`hospitality.status_${s}`) }))} />
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
        {reservations.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between">
              <div className="font-semibold">{r.client_name || r.guest_name || "—"}</div>
              <button onClick={() => handleDelete(r.id)} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
            </div>
            <div className="text-sm text-ink/60">{new Date(r.reservation_time).toLocaleString()}</div>
            <select
              value={r.status}
              onChange={(e) => handleStatusChange(r, e.target.value)}
              className="mt-2 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
            >
              {RES_STATUSES.map((s) => (
                <option key={s} value={s}>{tp(`hospitality.status_${s}`)}</option>
              ))}
            </select>
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              <div>👥 {r.party_size}</div>
              {r.table_label && <div>🪑 {r.table_label}</div>}
            </div>
          </Card>
        ))}
        {reservations.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
      </div>
    </div>
  );
}

function MenuTab({ tp }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyMenuItem);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  function refresh() {
    api.listMenuItems().then(setItems).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createMenuItem({ ...form, price: Number(form.price) || 0 });
      setForm(emptyMenuItem);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleAvailable(item) {
    await api.updateMenuItem(item.id, { is_available: !item.is_available });
    refresh();
  }

  async function handleDelete(id) {
    await api.deleteMenuItem(id);
    refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm((s) => !s)} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
          {tp("common.new")}
        </button>
      </div>
      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-4">{error}</div>}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={tp("hospitality.field_menu_name")} value={form.name}
                   onChange={(v) => setForm({ ...form, name: v })} required />
            <Select label={tp("hospitality.field_menu_category")} value={form.category}
                    onChange={(v) => setForm({ ...form, category: v })}
                    options={MENU_CATEGORIES.map((c) => ({ value: c, label: tp(`hospitality.category_${c}`) }))} />
            <Input label={tp("hospitality.field_menu_price")} type="number" value={form.price}
                   onChange={(v) => setForm({ ...form, price: v })} />
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={form.is_available}
                     onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              {tp("hospitality.field_menu_available")}
            </label>
            <div className="md:col-span-2">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
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
        {items.map((m) => (
          <Card key={m.id} className={m.is_available ? "" : "opacity-50"}>
            <div className="flex items-start justify-between">
              <div className="font-semibold">{m.name}</div>
              <button onClick={() => handleDelete(m.id)} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
            </div>
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/40 mt-1">
              {tp(`hospitality.category_${m.category}`)}
            </span>
            <div className="text-sm text-ink/70 mt-2">💰 {m.price}</div>
            <button onClick={() => toggleAvailable(m)} className="mt-2 text-xs underline text-ink/60">
              {tp("hospitality.field_menu_available")}: {m.is_available ? "✓" : "✕"}
            </button>
          </Card>
        ))}
        {items.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
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
