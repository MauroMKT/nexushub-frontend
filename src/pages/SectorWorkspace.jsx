import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { api } from "../api";
import Card from "../components/Card";
import { getModuleName, getRecordLabel } from "../utils/moduleI18n";

const STATUSES = ["aperto", "in_corso", "chiuso"];
const PRIORITIES = ["bassa", "media", "alta"];
const emptyForm = {
  title: "", client_id: "", status: "aperto", value: "", reference_date: "",
  priority: "media", due_date: "", assigned_to: "", tags: "", notes: "",
};

const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;

// Pagina generica per i moduli di settore SENZA una feature dedicata bespoke
// (Fase 9.3, estesa in Fase 9.16 con vista kanban trascinabile, priorità,
// scadenza, assegnatario, tag, campi personalizzati liberi e documenti
// allegati): la stessa pagina serve tutti i ~17 settori "generici" del
// catalogo, cambiando solo etichetta ("Pratica Legale", "Intervento in
// Officina", ecc.) e nome del modulo, letti dal catalogo tramite lo slug
// nella rotta (/sector/:slug).
export default function SectorWorkspace() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const tp = (k) => t(`pilotModules.${k}`);

  const [moduleInfo, setModuleInfo] = useState(null);
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [customFieldRows, setCustomFieldRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  function refreshRecords() {
    api.listSectorRecords(slug).then(setRecords).catch((e) => setError(e.message));
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
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

  const moduleName = moduleInfo ? getModuleName(moduleInfo, i18n.language) : slug;
  const recordLabel = useMemo(() => {
    if (!moduleInfo) return tp("sectorWorkspace.field_title");
    return getRecordLabel(moduleInfo, i18n.language);
  }, [moduleInfo, i18n.language]);

  function addCustomFieldRow() {
    setCustomFieldRows((prev) => [...prev, { key: "", value: "" }]);
  }
  function updateCustomFieldRow(i, field, v) {
    setCustomFieldRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: v } : row)));
  }
  function removeCustomFieldRow(i) {
    setCustomFieldRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const custom_fields = {};
      customFieldRows.forEach((row) => {
        if (row.key.trim()) custom_fields[row.key.trim()] = row.value;
      });
      const payload = {
        ...form, client_id: form.client_id || null,
        value: form.value === "" ? null : Number(form.value),
        reference_date: form.reference_date ? new Date(form.reference_date).toISOString() : null,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        assigned_to: form.assigned_to || null, tags: form.tags || null,
        custom_fields: Object.keys(custom_fields).length ? custom_fields : null,
      };
      const created = await api.createSectorRecord(slug, payload);
      setForm(emptyForm);
      setCustomFieldRows([]);
      setShowForm(false);
      refreshRecords();
      setSelectedId(created.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(recordId, status) {
    await api.updateSectorRecord(slug, recordId, { status });
    refreshRecords();
  }

  async function handleDelete(id) {
    if (!window.confirm(tp("sectorWorkspace.confirm_delete"))) return;
    await api.deleteSectorRecord(slug, id);
    if (selectedId === id) setSelectedId(null);
    refreshRecords();
  }

  const dragRecordId = useRef(null);
  function handleDragStart(id) { dragRecordId.current = id; }
  function handleDrop(status) {
    if (dragRecordId.current) {
      handleStatusChange(dragRecordId.current, status);
      dragRecordId.current = null;
    }
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

  const selected = records.find((r) => r.id === selectedId) || null;

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
            <Select label={tp("sectorWorkspace.field_priority")} value={form.priority}
                    onChange={(v) => setForm({ ...form, priority: v })}
                    options={PRIORITIES.map((p) => ({ value: p, label: tp(`sectorWorkspace.priority_${p}`) }))} />
            <Input label={tp("sectorWorkspace.field_value")} type="number" value={form.value}
                   onChange={(v) => setForm({ ...form, value: v })} />
            <Input label={tp("sectorWorkspace.field_date")} type="date" value={form.reference_date}
                   onChange={(v) => setForm({ ...form, reference_date: v })} />
            <Input label={tp("sectorWorkspace.field_due_date")} type="date" value={form.due_date}
                   onChange={(v) => setForm({ ...form, due_date: v })} />
            <Input label={tp("sectorWorkspace.field_assigned_to")} value={form.assigned_to}
                   onChange={(v) => setForm({ ...form, assigned_to: v })} />
            <div className="md:col-span-2">
              <Input label={tp("sectorWorkspace.field_tags")} value={form.tags}
                     onChange={(v) => setForm({ ...form, tags: v })} />
              <p className="text-xs text-ink/40 mt-1">{tp("sectorWorkspace.tags_hint")}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">{tp("sectorWorkspace.custom_fields_label")}</label>
              <div className="space-y-2">
                {customFieldRows.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={row.key} onChange={(e) => updateCustomFieldRow(i, "key", e.target.value)}
                           placeholder={tp("sectorWorkspace.custom_field_key_placeholder")}
                           className="flex-1 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                    <input value={row.value} onChange={(e) => updateCustomFieldRow(i, "value", e.target.value)}
                           placeholder={tp("sectorWorkspace.custom_field_value_placeholder")}
                           className="flex-1 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                    <button type="button" onClick={() => removeCustomFieldRow(i)} className="text-ink/30 hover:text-red-500 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addCustomFieldRow} className="text-xs text-primary hover:underline mt-2">
                + {tp("sectorWorkspace.add_custom_field")}
              </button>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          {STATUSES.map((status) => (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
              className="bg-secondary/10 rounded-xl2 p-2 min-h-[300px]"
            >
              <div className="text-xs font-semibold text-ink/60 mb-2 px-1 flex items-center justify-between">
                {tp(`sectorWorkspace.status_${status}`)}
                <span className="text-ink/30">({records.filter((r) => r.status === status).length})</span>
              </div>
              <div className="space-y-2">
                {records.filter((r) => r.status === status).map((r) => (
                  <div
                    key={r.id}
                    draggable
                    onDragStart={() => handleDragStart(r.id)}
                    onClick={() => setSelectedId(r.id)}
                    className={`bg-white rounded-xl2 shadow-sm p-2.5 cursor-pointer border ${
                      selectedId === r.id ? "border-primary ring-1 ring-primary" : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-semibold text-sm">{r.title}</div>
                      <PriorityBadge priority={r.priority} tp={tp} />
                    </div>
                    {r.client_name && <div className="text-xs text-ink/50 mt-0.5">{r.client_name}</div>}
                    {r.due_date && <div className="text-xs text-ink/50 mt-1">⏰ {new Date(r.due_date).toLocaleDateString()}</div>}
                    {r.assigned_to && <div className="text-xs text-ink/50">👤 {r.assigned_to}</div>}
                    {r.tags && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                          <span key={tag} className="text-[10px] bg-secondary/30 rounded-full px-1.5 py-0.5">{tag}</span>
                        ))}
                      </div>
                    )}
                    {r.document_count > 0 && <div className="text-xs text-ink/40 mt-1">📎 {r.document_count}</div>}
                  </div>
                ))}
                {records.filter((r) => r.status === status).length === 0 && (
                  <p className="text-xs text-ink/30 px-1">{tp("sectorWorkspace.kanban_empty_column")}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
          {selected ? (
            <RecordDetail record={selected} slug={slug} tp={tp} onDelete={() => handleDelete(selected.id)}
                          onChanged={refreshRecords} onClose={() => setSelectedId(null)} />
          ) : (
            <Card>
              <p className="text-sm text-ink/50">{tp("sectorWorkspace.select_record_hint")}</p>
            </Card>
          )}
        </div>
      </div>

      {records.length === 0 && !showForm && (
        <p className="text-ink/50 text-sm mt-4">{tp("common.empty")}</p>
      )}
    </div>
  );
}

function PriorityBadge({ priority, tp }) {
  const colors = { alta: "bg-red-100 text-red-700", media: "bg-amber-100 text-amber-700", bassa: "bg-slate-100 text-ink/50" };
  return (
    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${colors[priority] || colors.media}`}>
      {tp(`sectorWorkspace.priority_${priority || "media"}`)}
    </span>
  );
}

function RecordDetail({ record, slug, tp, onDelete, onChanged, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function refreshDocuments() {
    api.listSectorRecordDocuments(slug, record.id).then(setDocuments).catch(() => {});
  }
  useEffect(refreshDocuments, [slug, record.id]);

  async function handleFieldChange(field, value) {
    await api.updateSectorRecord(slug, record.id, { [field]: value });
    onChanged();
  }

  async function handleDocChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        setError(tp("sectorWorkspace.error_file_too_large"));
        continue;
      }
      setUploading(files.length > 1 ? `${i + 1}/${files.length}` : true);
      try {
        const base64 = await fileToBase64(file);
        await api.uploadSectorRecordDocument(slug, record.id, {
          filename: file.name, content_type: file.type || "application/octet-stream", content_base64: base64,
        });
      } catch (err) {
        setError(err.message);
      }
    }
    setUploading(false);
    refreshDocuments();
    onChanged();
    e.target.value = "";
  }

  async function handleDocDelete(docId) {
    await api.deleteSectorRecordDocument(slug, record.id, docId);
    refreshDocuments();
    onChanged();
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="font-semibold text-lg">{record.title}</div>
        <div className="flex gap-2">
          <button onClick={onDelete} className="text-ink/30 hover:text-red-500 text-xs">🗑️</button>
          <button onClick={onClose} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
        </div>
      </div>
      {error && <div className="bg-accent/30 text-ink text-xs rounded-xl2 p-2 my-2">{error}</div>}

      <div className="mt-3 space-y-3 text-sm">
        <div>
          <label className="text-xs text-ink/50 block mb-1">{tp("sectorWorkspace.field_priority")}</label>
          <select defaultValue={record.priority} onChange={(e) => handleFieldChange("priority", e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-white">
            {PRIORITIES.map((p) => <option key={p} value={p}>{tp(`sectorWorkspace.priority_${p}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 block mb-1">{tp("sectorWorkspace.field_due_date")}</label>
          <input type="date" defaultValue={record.due_date ? record.due_date.slice(0, 10) : ""}
                 onChange={(e) => handleFieldChange("due_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
                 className="text-xs border border-slate-200 rounded-xl2 px-2 py-1 w-full" />
        </div>
        <div>
          <label className="text-xs text-ink/50 block mb-1">{tp("sectorWorkspace.field_assigned_to")}</label>
          <input defaultValue={record.assigned_to || ""} onBlur={(e) => handleFieldChange("assigned_to", e.target.value)}
                 className="text-xs border border-slate-200 rounded-xl2 px-2 py-1 w-full" />
        </div>
        <div>
          <label className="text-xs text-ink/50 block mb-1">{tp("sectorWorkspace.field_tags")}</label>
          <input defaultValue={record.tags || ""} onBlur={(e) => handleFieldChange("tags", e.target.value)}
                 className="text-xs border border-slate-200 rounded-xl2 px-2 py-1 w-full" />
        </div>
        {record.custom_fields && Object.keys(record.custom_fields).length > 0 && (
          <div>
            <label className="text-xs text-ink/50 block mb-1">{tp("sectorWorkspace.custom_fields_label")}</label>
            <div className="space-y-1">
              {Object.entries(record.custom_fields).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs bg-slate-50 rounded-lg px-2 py-1">
                  <span className="text-ink/60">{k}</span><span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {record.notes && (
          <div>
            <label className="text-xs text-ink/50 block mb-1">{tp("common.notes_label")}</label>
            <p className="text-xs text-ink/70">{record.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <label className="text-xs text-ink/50 block mb-1">{tp("sectorWorkspace.documents_label")}</label>
        <div className="space-y-1 mb-2">
          {documents.map((d) => (
            <div key={d.id} className="flex justify-between items-center text-xs bg-slate-50 rounded-lg px-2 py-1">
              <span className="truncate">{d.filename}</span>
              <button onClick={() => handleDocDelete(d.id)} className="text-ink/30 hover:text-red-500 shrink-0 ml-2">✕</button>
            </div>
          ))}
          {documents.length === 0 && <p className="text-xs text-ink/30">{tp("sectorWorkspace.no_documents")}</p>}
        </div>
        <label className="text-xs text-primary cursor-pointer hover:underline">
          {uploading ? `⏳ ${uploading === true ? "…" : uploading}` : `+ ${tp("sectorWorkspace.upload_document")}`}
          <input type="file" multiple onChange={handleDocChange} disabled={!!uploading} className="hidden" />
        </label>
        <p className="text-[10px] text-ink/30 mt-1">{tp("sectorWorkspace.multi_upload_hint")}</p>
      </div>
    </Card>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
