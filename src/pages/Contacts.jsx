import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";
import ImportContactsModal from "../components/ImportContactsModal";

const emptyForm = { full_name: "", phone: "", mobile: "", whatsapp: "", email: "", company: "", category: "altro", notes: "" };
const CATEGORIES = ["cliente", "fornitore", "collega", "altro"];

export default function Contacts() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showImport, setShowImport] = useState(false);

  function refresh() {
    api.listContacts(search, categoryFilter).then(setContacts).catch(() => {});
  }

  useEffect(refresh, [search, categoryFilter]);

  async function handleSubmit(e) {
    e.preventDefault();
    await api.createContact(form);
    setForm(emptyForm);
    setShowForm(false);
    refresh();
  }

  async function handleDelete(id) {
    await api.deleteContact(id);
    refresh();
  }

  async function handleImport() {
    await api.importContactsFromClients();
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t("contacts.title")}</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowImport(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-ink font-medium rounded-xl2 px-4 py-2 text-sm"
          >
            {t("contacts.import_from_file")}
          </button>
          <button
            onClick={handleImport}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-ink font-medium rounded-xl2 px-4 py-2 text-sm"
          >
            {t("contacts.import_from_clients")}
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm"
          >
            + {t("contacts.new_contact")}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("contacts.search_placeholder")}
          className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
        >
          <option value="">{t("contacts.all_categories")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`contacts.category_${c}`)}</option>
          ))}
        </select>
      </div>

      {showImport && (
        <ImportContactsModal onClose={() => setShowImport(false)} onImported={refresh} />
      )}

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={t("contacts.full_name")} value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
            <Select label={t("contacts.category")} value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} t={t} />
            <Input label={t("contacts.phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label={t("contacts.mobile")} value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
            <Input label={t("contacts.whatsapp")} value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
            <Input label={t("contacts.email")} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label={t("contacts.company")} value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <div className="md:col-span-2">
              <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
                {t("contacts.save")}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between">
              <div className="font-semibold">{c.full_name}</div>
              <button onClick={() => handleDelete(c.id)} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
            </div>
            {c.company && <div className="text-sm text-ink/60">{c.company}</div>}
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/40 mt-1">
              {t(`contacts.category_${c.category}`)}
            </span>
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              {c.phone && <div>📞 {c.phone}</div>}
              {c.mobile && <div>📱 {c.mobile}</div>}
              {c.whatsapp && <div>💬 {c.whatsapp}</div>}
              {c.email && <div>✉️ {c.email}</div>}
            </div>
            {c.extra_fields && Object.keys(c.extra_fields).length > 0 && (
              <div className="text-xs text-ink/50 mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                {Object.entries(c.extra_fields).map(([k, v]) => (
                  <div key={k}><span className="italic">{k}</span>: {v}</div>
                ))}
              </div>
            )}
          </Card>
        ))}
        {contacts.length === 0 && (
          <p className="text-ink/50 text-sm">{t("contacts.empty")}</p>
        )}
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

function Select({ label, value, onChange, options, t }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl2 px-3 py-2">
        {options.map((o) => (
          <option key={o} value={o}>{t(`contacts.category_${o}`)}</option>
        ))}
      </select>
    </div>
  );
}
