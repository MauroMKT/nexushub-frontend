import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";
import ChatPanel from "../components/ChatPanel";
import ClientDocumentsPanel from "../components/ClientDocumentsPanel";
import ImportClientsModal from "../components/ImportClientsModal";
import PickContactModal from "../components/PickContactModal";

const emptyForm = { name: "", company: "", email: "", phone: "", sector: "" };

function PortalInviteButton({ client, t }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(client.email || "");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  async function handleInvite(e) {
    e.preventDefault();
    await api.invitePortalClient(client.id, { email, password });
    setDone(true);
    setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary hover:underline mt-2">
        {done ? t("clients.portal_invited") : t("clients.portal_invite")}
      </button>
    );
  }

  return (
    <form onSubmit={handleInvite} className="mt-2 space-y-1 bg-bg rounded-xl2 p-2">
      <input type="email" required placeholder={t("portal.email")} value={email}
             onChange={(e) => setEmail(e.target.value)} className="w-full text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
      <input type="password" required placeholder={t("portal.password")} value={password}
             onChange={(e) => setPassword(e.target.value)} className="w-full text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
      <button type="submit" className="w-full bg-primary hover:bg-primary/80 rounded-xl2 px-2 py-1 text-xs font-medium">
        {t("clients.portal_invite_send")}
      </button>
    </form>
  );
}

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [openChatId, setOpenChatId] = useState(null);
  const [openDocsId, setOpenDocsId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showPickContact, setShowPickContact] = useState(false);
  const [sectorFilter, setSectorFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("az");

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

  // Elenco settori realmente presenti tra i clienti del tenant, per il filtro
  // a tendina — non serve una lista fissa, il "settore" è testo libero.
  const sectors = useMemo(() => {
    const set = new Set(clients.map((c) => c.sector).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const displayedClients = useMemo(() => {
    let list = sectorFilter ? clients.filter((c) => c.sector === sectorFilter) : clients;
    if (sortOrder !== "none") {
      list = [...list].sort((a, b) =>
        sortOrder === "za" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
      );
    }
    return list;
  }, [clients, sectorFilter, sortOrder]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("clients.title")}</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowPickContact(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-ink font-medium rounded-xl2 px-4 py-2 text-sm"
          >
            📇 {t("clients.add_from_contacts")}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm"
          >
            📥 {t("import.button")}
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm"
          >
            + {t("clients.new_client")}
          </button>
        </div>
      </div>

      {showImport && (
        <ImportClientsModal onClose={() => setShowImport(false)} onImported={refresh} />
      )}

      {showPickContact && (
        <PickContactModal onClose={() => setShowPickContact(false)} onCreated={refresh} />
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
        >
          <option value="">{t("clients.all_sectors")}</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
        >
          <option value="az">{t("common.sort_az")}</option>
          <option value="za">{t("common.sort_za")}</option>
        </select>
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
        {displayedClients.map((c) => (
          <Card key={c.id}>
            <div className="font-semibold">{c.name}</div>
            {c.company && <div className="text-sm text-ink/60">{c.company}</div>}
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              {c.email && <div>✉️ {c.email}</div>}
              {c.phone && <div>📞 {c.phone}</div>}
              {c.sector && <div>🏷️ {c.sector}</div>}
            </div>
            {c.notes && <div className="text-xs text-ink/50 mt-2 italic">📝 {c.notes}</div>}
            {c.extra_fields && Object.keys(c.extra_fields).length > 0 && (
              <div className="text-xs text-ink/50 mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                {Object.entries(c.extra_fields).map(([k, v]) => (
                  <div key={k}><span className="italic">{k}</span>: {v}</div>
                ))}
              </div>
            )}
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
            <PortalInviteButton client={c} t={t} />
            <button
              onClick={() => setOpenChatId((prev) => (prev === c.id ? null : c.id))}
              className="text-xs text-primary hover:underline mt-2 block"
            >
              💬 {t("chat.client_chat_title")}
            </button>
            {openChatId === c.id && (
              <div className="mt-2 border border-slate-100 rounded-xl2 h-72 overflow-hidden">
                <ChatPanel
                  resetKey={c.id}
                  fetchMessages={(after) => api.listClientChat(c.id, after)}
                  sendMessage={(body) => api.sendClientChat(c.id, body)}
                  emptyLabel={t("chat.client_chat_empty")}
                  placeholder={t("chat.client_chat_placeholder")}
                  myLabelMatcher={(m) => m.sender_type === "team"}
                />
              </div>
            )}
            <button
              onClick={() => setOpenDocsId((prev) => (prev === c.id ? null : c.id))}
              className="text-xs text-primary hover:underline mt-2 block"
            >
              📄 {t("documents.title")}
            </button>
            {openDocsId === c.id && (
              <div className="mt-2 border border-slate-100 rounded-xl2 p-2">
                <ClientDocumentsPanel
                  listDocuments={() => api.listClientDocuments(c.id)}
                  uploadDocument={(payload) => api.uploadClientDocument(c.id, payload)}
                  downloadDocument={(docId) => api.downloadClientDocument(c.id, docId)}
                  deleteDocument={(docId) => api.deleteClientDocument(c.id, docId)}
                />
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
