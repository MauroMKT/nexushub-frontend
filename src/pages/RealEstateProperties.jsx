import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";
import { downloadBase64File, fileToBase64 } from "../utils/downloadBase64";

// Pagina del modulo pilota "Agenzie Immobiliari" (Fase 9.1, estesa in Fase
// 9.13 con dettagli immobile — camere, bagni, piani, tipo contratto, prezzo
// di valutazione, città, stato immobile, riscatto, preferenza visite — più
// galleria foto, documenti e video dell'immobile.

// Devono restare coerenti con MAX_PHOTO_SIZE_BYTES / MAX_DOCUMENT_SIZE_BYTES /
// MAX_VIDEO_SIZE_BYTES in realestate_router.py.
const MAX_PHOTO_MB = 12;
const MAX_DOCUMENT_MB = 20;
const MAX_VIDEO_MB = 30;

const TYPES = ["residenziale", "commerciale", "terreno", "garage", "altro"];
const STATUSES = ["disponibile", "in_trattativa", "venduto", "affittato"];
const CONTRACT_TYPES = ["vendita", "locazione"];
const CONDITIONS = ["nuovo", "ottimo", "buono", "da_ristrutturare", "ristrutturato"];

const emptyForm = {
  title: "", client_id: "", property_type: "residenziale", address: "", city: "",
  size_sqm: "", rooms: "", bathrooms: "", building_floor: "", unit_floor: "",
  contract_type: "vendita", price: "", valuation_price: "", status: "disponibile",
  condition_state: "", visit_availability: "", rent_to_own: false, video_url: "", notes: "",
};

export default function RealEstateProperties() {
  const { t } = useTranslation();
  const tp = (k) => t(`pilotModules.${k}`);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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
        rooms: form.rooms === "" ? null : Number(form.rooms),
        bathrooms: form.bathrooms === "" ? null : Number(form.bathrooms),
        price: form.price === "" ? null : Number(form.price),
        valuation_price: form.valuation_price === "" ? null : Number(form.valuation_price),
        condition_state: form.condition_state || null,
        building_floor: form.building_floor || null,
        unit_floor: form.unit_floor || null,
        visit_availability: form.visit_availability || null,
        video_url: form.video_url || null,
      };
      const created = await api.createRealEstateProperty(payload);
      setForm(emptyForm);
      setShowForm(false);
      refresh();
      // Apre subito il dettaglio dell'immobile appena creato: è lì che si
      // caricano foto, documenti e video, quindi evitiamo che l'utente debba
      // cercarlo cliccando "Mostra dettagli" a parte (stesso fix applicato
      // al modulo Palestre dopo lo stesso identico problema).
      setExpandedId(created.id);
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
    if (expandedId === id) setExpandedId(null);
    refresh();
  }

  const isCommercial = form.property_type === "commerciale";
  const rentToOwnLabel = isCommercial ? tp("realEstate.rent_to_own_commercial") : tp("realEstate.rent_to_own_residential");

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
            <Select label={tp("realEstate.field_contract_type")} value={form.contract_type}
                    onChange={(v) => setForm({ ...form, contract_type: v })}
                    options={CONTRACT_TYPES.map((ct) => ({ value: ct, label: tp(`realEstate.contract_${ct}`) }))} />
            <Input label={tp("realEstate.field_city")} value={form.city}
                   onChange={(v) => setForm({ ...form, city: v })} />
            <Input label={tp("realEstate.field_address")} value={form.address}
                   onChange={(v) => setForm({ ...form, address: v })} />
            <Input label={tp("realEstate.field_size")} type="number" value={form.size_sqm}
                   onChange={(v) => setForm({ ...form, size_sqm: v })} />
            <Input label={tp("realEstate.field_rooms")} type="number" value={form.rooms}
                   onChange={(v) => setForm({ ...form, rooms: v })} />
            <Input label={tp("realEstate.field_bathrooms")} type="number" value={form.bathrooms}
                   onChange={(v) => setForm({ ...form, bathrooms: v })} />
            <Input label={tp("realEstate.field_building_floor")} value={form.building_floor}
                   onChange={(v) => setForm({ ...form, building_floor: v })} />
            <Input label={tp("realEstate.field_unit_floor")} value={form.unit_floor}
                   onChange={(v) => setForm({ ...form, unit_floor: v })} />
            <Select label={tp("realEstate.field_status")} value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                    options={STATUSES.map((s) => ({ value: s, label: tp(`realEstate.status_${s}`) }))} />
            <Select label={tp("realEstate.field_condition")} value={form.condition_state}
                    onChange={(v) => setForm({ ...form, condition_state: v })}
                    options={[{ value: "", label: `— ${tp("realEstate.condition_unset")}` },
                              ...CONDITIONS.map((c) => ({ value: c, label: tp(`realEstate.condition_${c}`) }))]} />
            <Input label={tp("realEstate.field_price")} type="number" value={form.price}
                   onChange={(v) => setForm({ ...form, price: v })} />
            <Input label={tp("realEstate.field_valuation_price")} type="number" value={form.valuation_price}
                   onChange={(v) => setForm({ ...form, valuation_price: v })} />
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={form.rent_to_own}
                     onChange={(e) => setForm({ ...form, rent_to_own: e.target.checked })} />
              {rentToOwnLabel}
            </label>
            <Input label={tp("realEstate.field_video_url")} value={form.video_url}
                   onChange={(v) => setForm({ ...form, video_url: v })} />
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">{tp("realEstate.field_visit_availability")}</label>
              <textarea value={form.visit_availability} onChange={(e) => setForm({ ...form, visit_availability: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl2 px-3 py-2" rows={2}
                        placeholder={tp("realEstate.visit_availability_placeholder")} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((p) => (
          <PropertyCard
            key={p.id}
            property={p}
            tp={tp}
            t={t}
            expanded={expandedId === p.id}
            onToggle={() => setExpandedId((prev) => (prev === p.id ? null : p.id))}
            onDelete={() => handleDelete(p.id)}
            onStatusChange={(status) => handleStatusChange(p, status)}
            onChanged={refresh}
          />
        ))}
        {properties.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
      </div>
    </div>
  );
}

function PropertyCard({ property, tp, t, expanded, onToggle, onDelete, onStatusChange, onChanged }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (expanded && cardRef.current) {
      // Porta la scheda in vista quando si apre (in particolare subito dopo
      // aver creato un nuovo immobile): foto, documenti e video si caricano
      // da qui, quindi l'utente deve vederli senza doverli cercare.
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [expanded]);

  return (
    <div ref={cardRef}>
    <Card>
      <div className="flex items-start justify-between">
        <div className="font-semibold">{property.title}</div>
        <button onClick={onDelete} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
      </div>
      {property.client_name && <div className="text-sm text-ink/60">{property.client_name}</div>}
      <div className="flex flex-wrap gap-1 mt-1">
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/40">
          {tp(`realEstate.type_${property.property_type}`)}
        </span>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/40">
          {tp(`realEstate.contract_${property.contract_type || "vendita"}`)}
        </span>
        {property.condition_state && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/40">
            {tp(`realEstate.condition_${property.condition_state}`)}
          </span>
        )}
        {property.photo_count > 0 && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/40">
            📷 {property.photo_count}
          </span>
        )}
      </div>
      <select
        value={property.status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="mt-2 ml-1 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{tp(`realEstate.status_${s}`)}</option>
        ))}
      </select>
      <div className="text-sm text-ink/70 mt-2 space-y-0.5">
        {property.city && <div>🏙️ {property.city}</div>}
        {property.address && <div>📍 {property.address}</div>}
        {property.size_sqm != null && <div>📐 {property.size_sqm} m²</div>}
        {property.price != null && <div>💰 {property.price}</div>}
      </div>
      <button onClick={onToggle} className="text-xs text-primary hover:underline mt-3 block">
        {expanded ? tp("realEstate.hide_details") : tp("realEstate.show_details")}
      </button>
      {expanded && <PropertyDetail property={property} tp={tp} t={t} onChanged={onChanged} />}
    </Card>
    </div>
  );
}

function PropertyDetail({ property, tp, t, onChanged }) {
  const [photos, setPhotos] = useState([]);
  const [docs, setDocs] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);

  function refreshPhotos() {
    api.listRealEstatePhotos(property.id).then(setPhotos).catch(() => {});
  }
  function refreshDocs() {
    api.listRealEstateDocuments(property.id).then(setDocs).catch(() => {});
  }

  useEffect(() => {
    refreshPhotos();
    refreshDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePhotoChange(e) {
    // Caricamento massivo: si possono selezionare più foto insieme (dalla
    // galleria del telefono o con Ctrl/Cmd+click sul PC), caricate una alla
    // volta in sequenza. Un file non valido viene segnalato ma non blocca
    // il caricamento degli altri già in coda.
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    let uploaded = 0;
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadingPhoto(files.length > 1 ? `${i + 1}/${files.length}` : true);
      if (!file.type.startsWith("image/")) {
        setError(`${file.name}: ${tp("realEstate.error_photo_not_image")}`);
        failed += 1;
        continue;
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        setError(`${file.name}: ${tp("realEstate.error_file_too_large").replace("{{maxMb}}", MAX_PHOTO_MB)}`);
        failed += 1;
        continue;
      }
      try {
        const content_base64 = await fileToBase64(file);
        await api.uploadRealEstatePhoto(property.id, { content_type: file.type, content_base64 });
        uploaded += 1;
      } catch (err) {
        setError(`${file.name}: ${err.message}`);
        failed += 1;
      }
    }
    setUploadingPhoto(false);
    if (uploaded > 0) {
      refreshPhotos();
      onChanged();
    }
  }

  async function handlePhotoDelete(photoId) {
    await api.deleteRealEstatePhoto(property.id, photoId);
    refreshPhotos();
    onChanged();
  }

  async function handleDocUpload(e, docType) {
    // I documenti (planimetrie, atti, APE...) si possono selezionare in blocco;
    // il video resta a singolo file (accade raramente di caricarne più di uno
    // alla volta e i limiti di dimensione sono più stringenti).
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const maxMb = docType === "video" ? MAX_VIDEO_MB : MAX_DOCUMENT_MB;
    setError(null);
    let uploaded = 0;
    for (const file of files) {
      if (docType === "video" && !file.type.startsWith("video/")) {
        setError(`${file.name}: ${tp("realEstate.error_not_video")}`);
        continue;
      }
      if (file.size > maxMb * 1024 * 1024) {
        setError(`${file.name}: ${tp("realEstate.error_file_too_large").replace("{{maxMb}}", maxMb)}`);
        continue;
      }
      try {
        const content_base64 = await fileToBase64(file);
        await api.uploadRealEstateDocument(property.id, { doc_type: docType, filename: file.name, content_type: file.type, content_base64 });
        uploaded += 1;
      } catch (err) {
        setError(`${file.name}: ${err.message}`);
      }
    }
    if (uploaded > 0) refreshDocs();
  }

  async function handleDocDownload(doc) {
    const full = await api.downloadRealEstateDocument(property.id, doc.id);
    downloadBase64File(full.filename, full.content_type, full.content_base64);
  }

  async function handleDocDelete(doc) {
    await api.deleteRealEstateDocument(property.id, doc.id);
    refreshDocs();
  }

  const documents = docs.filter((d) => d.doc_type !== "video");
  const videos = docs.filter((d) => d.doc_type === "video");

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl2 px-3 py-2">
          <span>⚠️</span>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      <div className="text-xs text-ink/70 space-y-0.5">
        {(property.rooms != null || property.bathrooms != null) && (
          <div>
            🛏️ {property.rooms != null ? `${property.rooms} ${tp("realEstate.rooms_short")}` : ""}
            {property.bathrooms != null ? ` · 🛁 ${property.bathrooms} ${tp("realEstate.bathrooms_short")}` : ""}
          </div>
        )}
        {(property.building_floor || property.unit_floor) && (
          <div>
            🏢 {tp("realEstate.field_building_floor")}: {property.building_floor || "—"}
            {" · "}{tp("realEstate.field_unit_floor")}: {property.unit_floor || "—"}
          </div>
        )}
        {property.valuation_price != null && <div>📊 {tp("realEstate.field_valuation_price")}: {property.valuation_price}</div>}
        {property.rent_to_own && (
          <div>🔑 {property.property_type === "commerciale" ? tp("realEstate.rent_to_own_commercial") : tp("realEstate.rent_to_own_residential")}</div>
        )}
        {property.visit_availability && <div>🗓️ {property.visit_availability}</div>}
        {property.video_url && (
          <div>
            🔗 <a href={property.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{property.video_url}</a>
          </div>
        )}
        {property.notes && <div>📝 {property.notes}</div>}
      </div>

      <div>
        <div className="text-xs font-semibold mb-1">{tp("realEstate.field_photos")}</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {photos.map((ph) => (
            <PhotoThumb key={ph.id} propertyId={property.id} photo={ph} onDelete={() => handlePhotoDelete(ph.id)} />
          ))}
          {photos.length === 0 && <p className="text-xs text-ink/40">{tp("realEstate.no_photos")}</p>}
        </div>
        <label className="text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-3 py-1.5 cursor-pointer inline-block">
          {uploadingPhoto ? `⏳ ${typeof uploadingPhoto === "string" ? uploadingPhoto : "…"}` : `📷 ${tp("realEstate.upload_photo")}`}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} disabled={!!uploadingPhoto} />
        </label>
        <div className="text-[10px] text-ink/40 mt-1">
          {tp("realEstate.max_size_hint").replace("{{maxMb}}", MAX_PHOTO_MB)} · {tp("realEstate.multi_upload_hint")}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold mb-1">{tp("realEstate.field_documents")}</div>
        {documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1 mb-1">
            <span className="truncate">📄 {d.filename}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleDocDownload(d)} className="text-primary hover:underline">{t("documents.download")}</button>
              <button onClick={() => handleDocDelete(d)} className="text-red-500 hover:underline">{t("documents.delete")}</button>
            </div>
          </div>
        ))}
        {documents.length === 0 && <p className="text-xs text-ink/40 mb-1">{t("documents.empty")}</p>}
        <label className="inline-block text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-3 py-1.5 cursor-pointer">
          📎 {tp("realEstate.upload_document")}
          <input type="file" multiple className="hidden" onChange={(e) => handleDocUpload(e, "documento")} />
        </label>
        <div className="text-[10px] text-ink/40 mt-1">
          {tp("realEstate.max_size_hint").replace("{{maxMb}}", MAX_DOCUMENT_MB)} · {tp("realEstate.multi_upload_hint")}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold mb-1">{tp("realEstate.field_video_upload")}</div>
        {videos.map((d) => (
          <div key={d.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1 mb-1">
            <span className="truncate">🎬 {d.filename}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleDocDownload(d)} className="text-primary hover:underline">{t("documents.download")}</button>
              <button onClick={() => handleDocDelete(d)} className="text-red-500 hover:underline">{t("documents.delete")}</button>
            </div>
          </div>
        ))}
        {videos.length === 0 && <p className="text-xs text-ink/40 mb-1">{tp("realEstate.no_videos")}</p>}
        <label className="inline-block text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-3 py-1.5 cursor-pointer">
          🎬 {tp("realEstate.upload_video")}
          <input type="file" accept="video/*" className="hidden" onChange={(e) => handleDocUpload(e, "video")} />
        </label>
        <div className="text-[10px] text-ink/40 mt-1">{tp("realEstate.max_size_hint").replace("{{maxMb}}", MAX_VIDEO_MB)} · {tp("realEstate.video_hint")}</div>
      </div>
    </div>
  );
}

function PhotoThumb({ propertyId, photo, onDelete }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    api.getRealEstatePhoto(propertyId, photo.id)
      .then((p) => setSrc(`data:${p.content_type};base64,${p.content_base64}`))
      .catch(() => {});
  }, [propertyId, photo.id]);

  return (
    <div className="relative w-16 h-16">
      {src ? (
        <img src={src} alt="" className="w-16 h-16 rounded-lg object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-secondary/40 flex items-center justify-center text-xl">🏠</div>
      )}
      <button
        onClick={onDelete}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-ink/50 hover:text-red-500 text-[10px] flex items-center justify-center shadow"
      >
        ✕
      </button>
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
