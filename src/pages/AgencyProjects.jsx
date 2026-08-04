import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const STATUSES = ["in_corso", "in_pausa", "completato"];
const MILESTONE_STATUSES = ["da_fare", "in_corso", "completato"];
const emptyForm = {
  title: "", client_id: "", status: "in_corso", is_retainer: false,
  retainer_monthly: "", hours_budget: "", hours_logged: 0, notes: "",
};
const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;

// Pagina del modulo pilota "Servizi IT & Marketing" (Fase 9.1, estesa in Fase
// 9.16 con milestone, time tracking reale e documenti/deliverable). Le ore
// svolte (hours_logged) non sono più un numero libero: dopo la creazione sono
// calcolate dal server come somma delle voci di time tracking.
export default function AgencyProjects() {
  const { t } = useTranslation();
  const tp = (k) => t(`pilotModules.${k}`);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);

  function refresh() {
    api.listAgencyProjects().then(setProjects).catch((e) => setError(e.message));
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
        retainer_monthly: form.retainer_monthly === "" ? null : Number(form.retainer_monthly),
        hours_budget: form.hours_budget === "" ? null : Number(form.hours_budget),
        hours_logged: Number(form.hours_logged) || 0,
      };
      const created = await api.createAgencyProject(payload);
      setForm(emptyForm);
      setShowForm(false);
      refresh();
      setSelectedId(created.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(p, status) {
    await api.updateAgencyProject(p.id, { status });
    refresh();
  }

  async function handleDelete(id) {
    if (!window.confirm(tp("agency.confirm_delete"))) return;
    await api.deleteAgencyProject(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  }

  const selected = projects.find((p) => p.id === selectedId) || null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{tp("agency.title")}</h1>
          <p className="text-sm text-ink/60">{tp("agency.subtitle")}</p>
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
            <Input label={tp("agency.field_title")} value={form.title}
                   onChange={(v) => setForm({ ...form, title: v })} required />
            <Select label={tp("common.client_label")} value={form.client_id}
                    onChange={(v) => setForm({ ...form, client_id: v })}
                    options={[{ value: "", label: `— ${tp("common.client_none")}` },
                              ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select label={tp("agency.field_status")} value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                    options={STATUSES.map((s) => ({ value: s, label: tp(`agency.status_${s}`) }))} />
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={form.is_retainer}
                     onChange={(e) => setForm({ ...form, is_retainer: e.target.checked })} />
              {tp("agency.field_is_retainer")}
            </label>
            {form.is_retainer && (
              <Input label={tp("agency.field_retainer_monthly")} type="number" value={form.retainer_monthly}
                     onChange={(v) => setForm({ ...form, retainer_monthly: v })} />
            )}
            <Input label={tp("agency.field_hours_budget")} type="number" value={form.hours_budget}
                   onChange={(v) => setForm({ ...form, hours_budget: v })} />
            <Input label={tp("agency.field_hours_logged")} type="number" value={form.hours_logged}
                   onChange={(v) => setForm({ ...form, hours_logged: v })} />
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
                value={p.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleStatusChange(p, e.target.value)}
                className="mt-2 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{tp(`agency.status_${s}`)}</option>
                ))}
              </select>
              <div className="text-sm text-ink/70 mt-2 space-y-0.5">
                {p.is_retainer && p.retainer_monthly != null && <div>💶 {p.retainer_monthly}/mese</div>}
                {p.hours_budget != null && (
                  <div className={p.over_budget ? "text-red-600 font-semibold" : ""}>
                    ⏱️ {p.hours_logged}/{p.hours_budget}h {p.over_budget && `⚠️ ${tp("agency.over_budget")}`}
                  </div>
                )}
                <div className="flex gap-3 text-xs text-ink/40">
                  {p.milestone_count > 0 && <span>🎯 {p.milestone_count}</span>}
                  {p.document_count > 0 && <span>📎 {p.document_count}</span>}
                </div>
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
              <p className="text-sm text-ink/50">{tp("agency.select_project_hint")}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({ project, tp, onChanged, onClose }) {
  const [tab, setTab] = useState("milestones");
  const [milestones, setMilestones] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newMilestone, setNewMilestone] = useState({ title: "", due_date: "" });
  const [newEntry, setNewEntry] = useState({ member_label: "", hours: "", description: "" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function refreshAll() {
    api.listAgencyMilestones(project.id).then(setMilestones).catch(() => {});
    api.listAgencyTimeEntries(project.id).then(setTimeEntries).catch(() => {});
    api.listAgencyDocuments(project.id).then(setDocuments).catch(() => {});
  }
  useEffect(refreshAll, [project.id]);

  async function handleAddMilestone(e) {
    e.preventDefault();
    if (!newMilestone.title.trim()) return;
    await api.createAgencyMilestone(project.id, {
      title: newMilestone.title,
      due_date: newMilestone.due_date ? new Date(newMilestone.due_date).toISOString() : null,
    });
    setNewMilestone({ title: "", due_date: "" });
    refreshAll();
    onChanged();
  }

  async function handleMilestoneStatus(m, status) {
    await api.updateAgencyMilestone(project.id, m.id, { status });
    refreshAll();
  }

  async function handleDeleteMilestone(id) {
    await api.deleteAgencyMilestone(project.id, id);
    refreshAll();
    onChanged();
  }

  async function handleAddEntry(e) {
    e.preventDefault();
    setError(null);
    const hours = Number(newEntry.hours);
    if (!hours || hours <= 0) {
      setError(tp("agency.error_hours_positive"));
      return;
    }
    try {
      await api.createAgencyTimeEntry(project.id, {
        member_label: newEntry.member_label || null, hours, description: newEntry.description || null,
      });
      setNewEntry({ member_label: "", hours: "", description: "" });
      refreshAll();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteEntry(id) {
    await api.deleteAgencyTimeEntry(project.id, id);
    refreshAll();
    onChanged();
  }

  async function handleDocChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        setError(tp("agency.error_file_too_large"));
        continue;
      }
      setUploading(files.length > 1 ? `${i + 1}/${files.length}` : true);
      try {
        const base64 = await fileToBase64(file);
        await api.uploadAgencyDocument(project.id, {
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
    await api.deleteAgencyDocument(project.id, id);
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
        {["milestones", "time", "documents"].map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
                  className={`text-xs px-2 py-1 rounded-lg ${tab === tb ? "bg-primary text-ink font-semibold" : "text-ink/50"}`}>
            {tp(`agency.tab_${tb}`)}
          </button>
        ))}
      </div>

      {tab === "milestones" && (
        <div>
          <div className="space-y-1.5 mb-2">
            {milestones.map((m) => (
              <div key={m.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{m.title}</span>
                  <button onClick={() => handleDeleteMilestone(m.id)} className="text-ink/30 hover:text-red-500">✕</button>
                </div>
                {m.due_date && <div className="text-ink/40 mt-0.5">⏰ {new Date(m.due_date).toLocaleDateString()}</div>}
                <select value={m.status} onChange={(e) => handleMilestoneStatus(m, e.target.value)}
                        className="mt-1 text-[11px] border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white">
                  {MILESTONE_STATUSES.map((s) => <option key={s} value={s}>{tp(`agency.milestone_status_${s}`)}</option>)}
                </select>
              </div>
            ))}
            {milestones.length === 0 && <p className="text-xs text-ink/30">{tp("agency.no_milestones")}</p>}
          </div>
          <form onSubmit={handleAddMilestone} className="flex gap-1">
            <input value={newMilestone.title} onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                   placeholder={tp("agency.new_milestone_placeholder")}
                   className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1" />
            <input type="date" value={newMilestone.due_date} onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                   className="text-xs border border-slate-200 rounded-lg px-1 py-1 w-28" />
            <button type="submit" className="text-xs bg-secondary rounded-lg px-2">+</button>
          </form>
        </div>
      )}

      {tab === "time" && (
        <div>
          <div className="space-y-1.5 mb-2">
            {timeEntries.map((e) => (
              <div key={e.id} className="flex justify-between items-start bg-slate-50 rounded-lg p-2 text-xs">
                <div>
                  <div className="font-medium">{e.hours}h {e.member_label && `— ${e.member_label}`}</div>
                  {e.description && <div className="text-ink/50">{e.description}</div>}
                  <div className="text-ink/30">{new Date(e.entry_date).toLocaleDateString()}</div>
                </div>
                <button onClick={() => handleDeleteEntry(e.id)} className="text-ink/30 hover:text-red-500">✕</button>
              </div>
            ))}
            {timeEntries.length === 0 && <p className="text-xs text-ink/30">{tp("agency.no_time_entries")}</p>}
          </div>
          <form onSubmit={handleAddEntry} className="space-y-1">
            <div className="flex gap-1">
              <input value={newEntry.member_label} onChange={(e) => setNewEntry({ ...newEntry, member_label: e.target.value })}
                     placeholder={tp("agency.field_member_label")}
                     className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1" />
              <input type="number" step="0.5" value={newEntry.hours} onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                     placeholder={tp("agency.field_hours")}
                     className="w-16 text-xs border border-slate-200 rounded-lg px-2 py-1" />
            </div>
            <div className="flex gap-1">
              <input value={newEntry.description} onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                     placeholder={tp("agency.field_description")}
                     className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1" />
              <button type="submit" className="text-xs bg-secondary rounded-lg px-2">+</button>
            </div>
          </form>
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
            {documents.length === 0 && <p className="text-xs text-ink/30">{tp("agency.no_documents")}</p>}
          </div>
          <label className="text-xs text-primary cursor-pointer hover:underline">
            {uploading ? `⏳ ${uploading === true ? "…" : uploading}` : `+ ${tp("agency.upload_document")}`}
            <input type="file" multiple onChange={handleDocChange} disabled={!!uploading} className="hidden" />
          </label>
          <p className="text-[10px] text-ink/30 mt-1">{tp("agency.multi_upload_hint")}</p>
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
