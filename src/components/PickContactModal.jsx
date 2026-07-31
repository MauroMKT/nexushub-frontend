import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";

// Modale per portare un nominativo dalla Rubrica ai Clienti (Fase 9.8).
// Riusa GET /contacts (già filtrabile per ricerca/categoria) e chiama il
// nuovo endpoint POST /clients/from-contact/{id} alla selezione.
export default function PickContactModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listContacts(search, "").then(setContacts).catch(() => {});
  }, [search]);

  // I contatti già collegati a un cliente restano visibili (per trasparenza)
  // ma non selezionabili di nuovo: l'endpoint è idempotente, evitiamo però
  // di suggerire un'azione che non farebbe nulla di nuovo.
  const sorted = useMemo(
    () => [...contacts].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [contacts]
  );

  async function handlePick(contact) {
    setError(null);
    setBusyId(contact.id);
    try {
      await api.createClientFromContact(contact.id);
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm">{t("clients.pick_contact_title")}</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink/70 text-sm">✕</button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("clients.pick_contact_search_placeholder")}
            className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
            autoFocus
          />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {sorted.map((c) => (
            <div key={c.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{c.full_name}</div>
                <div className="text-xs text-ink/50 truncate">
                  {[c.company, c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              {c.client_id ? (
                <span className="text-[10px] shrink-0 bg-slate-100 text-slate-500 font-semibold px-2 py-1 rounded-lg">
                  {t("clients.pick_contact_already_client")}
                </span>
              ) : (
                <button
                  onClick={() => handlePick(c)}
                  disabled={busyId === c.id}
                  className="shrink-0 bg-primary hover:bg-primary/80 text-ink font-semibold rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {busyId === c.id ? "…" : t("clients.pick_contact_select")}
                </button>
              )}
            </div>
          ))}
          {sorted.length === 0 && (
            <p className="text-sm text-ink/40 text-center py-8">{t("clients.pick_contact_empty")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
