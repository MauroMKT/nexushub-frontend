import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const emptyForm = { title: "", client_id: "", start_time: "", end_time: "", location: "" };

export default function CalendarPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    api.listAppointments().then(setAppointments).catch(() => {});
    api.listClients().then(setClients).catch(() => {});
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await api.createAppointment({
      ...form,
      client_id: form.client_id || null,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
    });
    setForm(emptyForm);
    setShowForm(false);
    refresh();
  }

  function clientName(id) {
    return clients.find((c) => c.id === id)?.name;
  }

  async function handleConfirm(id) {
    await api.confirmAppointment(id);
    refresh();
  }

  async function handleReject(id) {
    if (!window.confirm(t("calendar.confirm_reject"))) return;
    await api.deleteAppointment(id);
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm"
        >
          + {t("calendar.new_appointment")}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">Titolo</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                     className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Cliente</label>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl2 px-3 py-2">
                <option value="">-</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Luogo</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                     className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Inizio</label>
              <input type="datetime-local" required value={form.start_time}
                     onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                     className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Fine</label>
              <input type="datetime-local" required value={form.end_time}
                     onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                     className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
                {t("clients.save")}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {appointments.map((a) => (
          <Card key={a.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2 flex-wrap">
                {a.title}
                {a.is_public_booking && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/50">{t("calendar.public_booking_badge")}</span>
                )}
              </div>
              <div className="text-sm text-ink/60">
                {new Date(a.start_time).toLocaleString()} {clientName(a.client_id) ? `· ${clientName(a.client_id)}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {a.is_public_booking && a.status === "scheduled" && (
                <>
                  <button onClick={() => handleConfirm(a.id)} className="text-xs bg-secondary hover:bg-secondary/80 rounded-xl2 px-2 py-1">
                    {t("calendar.confirm")}
                  </button>
                  <button onClick={() => handleReject(a.id)} className="text-xs text-red-500 hover:underline">
                    {t("calendar.reject")}
                  </button>
                </>
              )}
              <span className="text-xs px-2 py-1 rounded-full bg-secondary/40 capitalize">{a.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
