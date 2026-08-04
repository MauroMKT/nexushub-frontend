import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const PHASES = ["progettazione", "permessi", "esecuzione", "collaudo", "chiuso"];
const emptyForm = {
  title: "", client_id: "", phase: "progettazione", deadline: "", budget: 0,
  budget_actual: 0, assigned_to: "", notes: "",
};
const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;

// Pagina del modulo pilota "Servizi di Ingegneria" (Fase 9.1, estesa in Fase
// 9.16 con documenti/permessi, budget a consuntivo e storico cambi fase).
export default function EngineeringProjects() {
  const { t } = useTranslation();
  const tp = (k, opts) => t(`pilotModules.${k}`, opts);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
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
      const payload = {
        ...form, client_id: form.client_id || null, budget: Number(form.budget) || 0,
        budget_actual: Number(form.budget_actual) || 0, assigned_to: form.assigned_to || null,
      };
      const created = await api.createEngineeringProject(payload);
      setForm(emptyForm);
      setShowForm(false);
      refresh();
      setSelectedId(created.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePhaseChange(project, phase) {
    await api.updateEngineeringProject(project.id, { phase });
    refresh();
  }

  async function handleDelete(id) {
    if (!window.confirm(tp("engineering.confirm_delete"))) return;
    await api.deleteEngineeringProject(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  }

  const selected = projects.find((p) => p.id === selectedId) || null;

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
            <Input label={tp("engineering.field_assigned_to")} value={form.assigned_to}
                   onChange={(v) => setForm({ ...form, assigned_to: v })} />
            <Input label={tp("engineering.field_budget")} type="number" value={form.budget}
                   onChange={(v) => setForm({ ...form, budget: v })} />
            <Input label={tp("engineering.field_budget_actual")} type="number" value={form.budget_actual}
                   onChange={(v) => setForm({ ...form, budget_actual: v })} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`bg-white rounded-xl2 shadow-sm p-3 cursor-pointer border ${
                selectedId === p.id ? "border-primary ring-1 ring-primary" : "border-slate-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="font-semibold">{p.title}</div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
              </div>
              {p.client_name && <div className="text-sm text-ink/60">{p.client_name}</div>}
              <select
                value={p.phase}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handlePhaseChange(p, e.target.value)}
                className="mt-2 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
              >
                {PHASES.map((ph) => (
                  <option key={ph} value={ph}>{tp(`engineering.phase_${ph}`)}</option>
                ))}
              </select>
              <div className="text-sm text-ink/70 mt-2 space-y-0.5">
                {p.assigned_to && <div>👤 {p.assigned_to}</div>}
                {p.budget > 0 && (
                  <div className={p.over_budget ? "text-red-600 font-semibold" : ""}>
                    💰 {p.budget_actual}/{p.budget} {p.over_budget && `⚠️ ${tp("engineering.over_budget")}`}
                  </div>
                )}
                {p.deadline && <div>📅 {new Date(p.deadline).toLocaleDateString()}</div>}
                {p.document_count > 0 && <div className="text-xs text-ink/40">📎 {p.document_count}</div>}
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
        </div>

        <div>
          {selected ? (
            <ProjectDetail project={selected} tp={tp} onChanged={refresh} onClose={() => setSelectedId(null)} />
          ) : (
            <Card>
              <p className="text-sm text-ink/50">{tp("engineering.select_project_hint")}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({ project, tp, onChanged, onClose }) {
  const [tab, setTab] = useState("phases");
  const [phaseLog, setPhaseLog] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function refreshAll() {
    api.listEngineeringPhaseLog(project.id).then(setPhaseLog).catch(() => {});
    api.listEngineeringDocuments(project.id).then(setDocuments).catch(() => {});
  }
  useEffect(refreshAll, [project.id]);

  async function handleDocChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        setError(tp("engineering.error_file_too_large"));
        continue;
      }
      setUploading(files.length > 1 ? `${i + 1}/${files.length}` : true);
      try {
        const base64 = await fileToBase64(file);
        await api.uploadEngineeringDocument(project.id, {
          filename: file.name, content_type: file.type || "application/octet-stream", content_base64: base64,
        });
      } catch (err) {
        setError(err.message);
      }
    }
    setUploading(false);
    refreshAll();
    onChanged();
    e.target.value = "";
  }

  async function handleDeleteDoc(id) {
    await api.deleteEngineeringDocument(project.id, id);
    refreshAll();
    onChanged();
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="font-semibold text-lg">{project.title}</div>
        <button onClick={onClose} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
      </div>
      {error && <div className="bg-accent/30 text-ink text-xs rounded-xl2 p-2 my-2">{error}</div>}

      <div className="flex gap-1 mt-3 mb-3">
        {["phases", "documents"].map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
                  className={`text-xs px-2 py-1 rounded-lg ${tab === tb ? "bg-primary text-ink font-semibold" : "text-ink/50"}`}>
            {tp(`engineering.tab_${tb}`)}
          </button>
        ))}
      </div>

      {tab === "phases" && (
        <div className="space-y-2">
          {phaseLog.map((log, i) => (
            <div key={log.id} className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full shrink-0 ${i === phaseLog.length - 1 ? "bg-primary" : "bg-slate-300"}`} />
              <span className="font-medium">{tp(`engineering.phase_${log.phase}`)}</span>
              <span className="text-ink/40">{new Date(log.changed_at).toLocaleDateString()}</span>
            </div>
          ))}
          {phaseLog.length === 0 && <p className="text-xs text-ink/30">{tp("engineering.no_phase_log")}</p>}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <div className="space-y-1 mb-2">
            {documents.map((d) => (
              <div key={d.id} className="flex justify-between items-center text-xs bg-slate-50 rounded-lg px-2 py-1">
                <span className="truncate">{d.filename}</span>
                <button onClick={() => handleDeleteDoc(d.id)} className="text-ink/30 hover:text-red-500 shrink-0 ml-2">✕</button>
              </div>
            ))}
            {documents.length === 0 && <p className="text-xs text-ink/30">{tp("engineering.no_documents")}</p>}
          </div>
          <label className="text-xs text-primary cursor-pointer hover:underline">
            {uploading ? `⏳ ${uploading === true ? "…" : uploading}` : `+ ${tp("engineering.upload_document")}`}
            <input type="file" multiple onChange={handleDocChange} disabled={!!uploading} className="hidden" />
          </label>
          <p className="text-[10px] text-ink/30 mt-1">{tp("engineering.multi_upload_hint")}</p>
        </div>
      )}
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
