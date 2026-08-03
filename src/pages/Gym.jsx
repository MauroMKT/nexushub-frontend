import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";
import { downloadBase64File, fileToBase64 } from "../utils/downloadBase64";

// Pagina dedicata del modulo pilota "Palestre e Centri Sportivi" (Fase 9.9).
// Anagrafica soci completa (contatti obbligatori, tessere, CF/P.IVA opzionali),
// corsi con catalogo estendibile al volo, grado/cintura + anno per i corsi di
// arti marziali, certificato medico (check + upload PDF/foto), altri
// documenti, foto socio e trofei per la classifica sociale del club.

const emptyMember = {
  full_name: "", phone: "", email: "", address: "", birth_date: "",
  fiscal_code: "", vat_number: "", card_number: "", federation_card_number: "",
  medical_certificate_ok: false, notes: "",
};

export default function Gym() {
  const { t } = useTranslation();
  const tp = (k) => t(`pilotModules.gym.${k}`);
  const [tab, setTab] = useState("members");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tp("title")}</h1>
        <p className="text-sm text-ink/60">{tp("subtitle")}</p>
      </div>
      <div className="flex gap-2 mb-6">
        <TabButton active={tab === "members"} onClick={() => setTab("members")} label={tp("tab_members")} />
        <TabButton active={tab === "birthdays"} onClick={() => setTab("birthdays")} label={tp("tab_birthdays")} />
        <TabButton active={tab === "leaderboard"} onClick={() => setTab("leaderboard")} label={tp("tab_leaderboard")} />
      </div>
      {tab === "members" && <MembersTab tp={tp} t={t} />}
      {tab === "birthdays" && <BirthdaysTab tp={tp} />}
      {tab === "leaderboard" && <LeaderboardTab tp={tp} />}
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

function MemberPhoto({ memberId, hasPhoto, size = 48 }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!hasPhoto) {
      setSrc(null);
      return;
    }
    api.getGymMemberPhoto(memberId)
      .then((p) => setSrc(`data:${p.content_type};base64,${p.content_base64}`))
      .catch(() => setSrc(null));
  }, [memberId, hasPhoto]);

  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-secondary/40 flex items-center justify-center text-ink/50 shrink-0"
      >
        🧑
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className="rounded-full object-cover shrink-0"
    />
  );
}

function MembersTab({ tp, t }) {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyMember);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  function refresh() {
    api.listGymMembers().then(setMembers).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createGymMember({ ...form, birth_date: form.birth_date || null });
      setForm(emptyMember);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(tp("confirm_delete_member"))) return;
    await api.deleteGymMember(id);
    if (expandedId === id) setExpandedId(null);
    refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm((s) => !s)} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
          {t("pilotModules.common.new")}
        </button>
      </div>
      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-4">{error}</div>}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={tp("field_full_name")} value={form.full_name}
                   onChange={(v) => setForm({ ...form, full_name: v })} required />
            <Input label={tp("field_phone")} value={form.phone}
                   onChange={(v) => setForm({ ...form, phone: v })} required />
            <Input label={tp("field_email")} type="email" value={form.email}
                   onChange={(v) => setForm({ ...form, email: v })} required />
            <Input label={tp("field_address")} value={form.address}
                   onChange={(v) => setForm({ ...form, address: v })} required />
            <Input label={tp("field_birth_date")} type="date" value={form.birth_date}
                   onChange={(v) => setForm({ ...form, birth_date: v })} />
            <Input label={tp("field_fiscal_code")} value={form.fiscal_code}
                   onChange={(v) => setForm({ ...form, fiscal_code: v })} />
            <Input label={tp("field_vat_number")} value={form.vat_number}
                   onChange={(v) => setForm({ ...form, vat_number: v })} />
            <Input label={tp("field_card_number")} value={form.card_number}
                   onChange={(v) => setForm({ ...form, card_number: v })} />
            <Input label={tp("field_federation_card")} value={form.federation_card_number}
                   onChange={(v) => setForm({ ...form, federation_card_number: v })} />
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={form.medical_certificate_ok}
                     onChange={(e) => setForm({ ...form, medical_certificate_ok: e.target.checked })} />
              {tp("medical_cert_ok")}
            </label>
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">{t("pilotModules.common.notes_label")}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl2 px-3 py-2" rows={2} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
                {t("pilotModules.common.save")}
              </button>
            </div>
          </form>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            tp={tp}
            t={t}
            expanded={expandedId === m.id}
            onToggle={() => setExpandedId((prev) => (prev === m.id ? null : m.id))}
            onDelete={() => handleDelete(m.id)}
            onChanged={refresh}
          />
        ))}
        {members.length === 0 && <p className="text-ink/50 text-sm">{t("pilotModules.common.empty")}</p>}
      </div>
    </div>
  );
}

function MemberCard({ member, tp, t, expanded, onToggle, onDelete, onChanged }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <MemberPhoto memberId={member.id} hasPhoto={member.has_photo} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold truncate">{member.full_name}</div>
            <button onClick={onDelete} className="text-ink/30 hover:text-ink/70 text-xs shrink-0">✕</button>
          </div>
          {member.card_number && <div className="text-xs text-ink/50">🎫 {member.card_number}</div>}
          <div className="text-xs mt-1">
            {member.medical_certificate_ok ? (
              <span className="text-green-600">✅ {tp("medical_cert_ok")}</span>
            ) : (
              <span className="text-amber-600">⚠️ {tp("medical_cert_missing")}</span>
            )}
          </div>
        </div>
      </div>
      {member.enrollments?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {member.enrollments.map((e) => (
            <span key={e.id} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/40">
              {e.course_name}
              {e.is_martial_arts && (e.grade_name || e.grade_year) ? ` · ${[e.grade_name, e.grade_year].filter(Boolean).join(" ")}` : ""}
            </span>
          ))}
        </div>
      )}
      <button onClick={onToggle} className="text-xs text-primary hover:underline mt-3 block">
        {expanded ? tp("hide_details") : tp("show_details")}
      </button>
      {expanded && <MemberDetail member={member} tp={tp} t={t} onChanged={onChanged} />}
    </Card>
  );
}

function MemberDetail({ member: initialMember, tp, t, onChanged }) {
  const [member, setMember] = useState(initialMember);
  const [docs, setDocs] = useState([]);
  const [trophies, setTrophies] = useState([]);
  const [courses, setCourses] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSrc, setPhotoSrc] = useState(null);
  const [error, setError] = useState(null);

  const [courseChoice, setCourseChoice] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseMartial, setNewCourseMartial] = useState(false);
  const [gradeName, setGradeName] = useState("");
  const [gradeYear, setGradeYear] = useState("");

  const [trophyForm, setTrophyForm] = useState({ title: "", placement: "", points: 0, date_won: "" });

  function refreshDocs() {
    api.listGymMemberDocuments(member.id).then(setDocs).catch(() => {});
  }
  function refreshTrophies() {
    api.listGymMemberTrophies(member.id).then(setTrophies).catch(() => {});
  }
  function refreshCourses() {
    api.listGymCourses().then(setCourses).catch(() => {});
  }

  useEffect(() => {
    refreshDocs();
    refreshTrophies();
    refreshCourses();
    if (member.has_photo) {
      api.getGymMemberPhoto(member.id)
        .then((p) => setPhotoSrc(`data:${p.content_type};base64,${p.content_base64}`))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCourse = courses.find((c) => c.id === courseChoice);
  const isMartialSelection = courseChoice ? !!selectedCourse?.is_martial_arts : newCourseMartial;

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const content_base64 = await fileToBase64(file);
      const updated = await api.uploadGymMemberPhoto(member.id, { content_type: file.type, content_base64 });
      setMember(updated);
      setPhotoSrc(`data:${file.type};base64,${content_base64}`);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleAddEnrollment(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = courseChoice
        ? { course_id: courseChoice, grade_name: gradeName || null, grade_year: gradeYear ? Number(gradeYear) : null }
        : { course_name: newCourseName, is_martial_arts: newCourseMartial, grade_name: gradeName || null, grade_year: gradeYear ? Number(gradeYear) : null };
      const updated = await api.createGymEnrollment(member.id, payload);
      setMember(updated);
      setCourseChoice("");
      setNewCourseName("");
      setNewCourseMartial(false);
      setGradeName("");
      setGradeYear("");
      refreshCourses();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveEnrollment(enrollmentId) {
    const updated = await api.deleteGymEnrollment(member.id, enrollmentId);
    setMember(updated);
    onChanged();
  }

  async function handleDocUpload(e, docType) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const content_base64 = await fileToBase64(file);
      await api.uploadGymMemberDocument(member.id, { doc_type: docType, filename: file.name, content_type: file.type, content_base64 });
      refreshDocs();
      const updated = await api.getGymMember(member.id); // aggiorna medical_certificate_ok se era il certificato
      setMember(updated);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDocDownload(doc) {
    const full = await api.downloadGymMemberDocument(member.id, doc.id);
    downloadBase64File(full.filename, full.content_type, full.content_base64);
  }

  async function handleDocDelete(doc) {
    await api.deleteGymMemberDocument(member.id, doc.id);
    refreshDocs();
  }

  async function handleAddTrophy(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createGymMemberTrophy(member.id, {
        ...trophyForm,
        points: Number(trophyForm.points) || 0,
        date_won: trophyForm.date_won ? new Date(trophyForm.date_won).toISOString() : null,
      });
      setTrophyForm({ title: "", placement: "", points: 0, date_won: "" });
      refreshTrophies();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTrophyDelete(id) {
    await api.deleteGymMemberTrophy(member.id, id);
    refreshTrophies();
  }

  const medicalDocs = docs.filter((d) => d.doc_type === "medical_certificate");
  const otherDocs = docs.filter((d) => d.doc_type !== "medical_certificate");

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="text-xs text-ink/70 space-y-0.5">
        <div>📞 {member.phone}</div>
        <div>✉️ {member.email}</div>
        <div>🏠 {member.address}</div>
        {member.birth_date && <div>🎂 {tp("field_birth_date")}: {member.birth_date}</div>}
        {member.fiscal_code && <div>🪪 {tp("field_fiscal_code")}: {member.fiscal_code}</div>}
        {member.vat_number && <div>🧾 {tp("field_vat_number")}: {member.vat_number}</div>}
        {member.federation_card_number && <div>🏅 {tp("field_federation_card")}: {member.federation_card_number}</div>}
      </div>

      <div>
        <div className="text-xs font-semibold mb-1">{tp("field_photo")}</div>
        <div className="flex items-center gap-3">
          {photoSrc ? (
            <img src={photoSrc} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-secondary/40 flex items-center justify-center text-2xl">🧑</div>
          )}
          <label className="text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-3 py-1.5 cursor-pointer">
            {uploadingPhoto ? "…" : `📷 ${tp("upload_photo")}`}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploadingPhoto} />
          </label>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold mb-1">{tp("field_courses")}</div>
        <div className="space-y-1 mb-2">
          {member.enrollments.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1">
              <span>
                {e.course_name}
                {e.is_martial_arts && (e.grade_name || e.grade_year) && (
                  <span className="text-ink/50"> · {[e.grade_name, e.grade_year].filter(Boolean).join(" ")}</span>
                )}
              </span>
              <button onClick={() => handleRemoveEnrollment(e.id)} className="text-ink/30 hover:text-red-500">✕</button>
            </div>
          ))}
          {member.enrollments.length === 0 && <p className="text-xs text-ink/40">{tp("no_courses")}</p>}
        </div>
        <form onSubmit={handleAddEnrollment} className="space-y-2 bg-bg rounded-xl2 p-2">
          <select value={courseChoice} onChange={(e) => setCourseChoice(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-white">
            <option value="">{tp("new_course_option")}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.is_martial_arts ? " 🥋" : ""}</option>
            ))}
          </select>
          {!courseChoice && (
            <div className="flex gap-2 items-center">
              <input value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)}
                     placeholder={tp("new_course_name_placeholder")}
                     className="flex-1 text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
              <label className="text-xs flex items-center gap-1 shrink-0">
                <input type="checkbox" checked={newCourseMartial} onChange={(e) => setNewCourseMartial(e.target.checked)} />
                {tp("martial_arts_label")}
              </label>
            </div>
          )}
          {isMartialSelection && (
            <div className="flex gap-2">
              <input value={gradeName} onChange={(e) => setGradeName(e.target.value)}
                     placeholder={tp("grade_name_placeholder")}
                     className="flex-1 text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
              <input value={gradeYear} onChange={(e) => setGradeYear(e.target.value)} type="number"
                     placeholder={tp("grade_year_placeholder")}
                     className="w-24 text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
            </div>
          )}
          <button type="submit" className="w-full bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-3 py-1.5 text-xs">
            {tp("add_course_button")}
          </button>
        </form>
      </div>

      <div>
        <div className="text-xs font-semibold mb-1">{tp("field_medical_certificate")}</div>
        {medicalDocs.map((d) => (
          <div key={d.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1 mb-1">
            <span className="truncate">📄 {d.filename}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleDocDownload(d)} className="text-primary hover:underline">{t("documents.download")}</button>
              <button onClick={() => handleDocDelete(d)} className="text-red-500 hover:underline">{t("documents.delete")}</button>
            </div>
          </div>
        ))}
        <label className="inline-block text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-3 py-1.5 cursor-pointer mt-1">
          📎 {tp("upload_medical_cert")}
          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleDocUpload(e, "medical_certificate")} />
        </label>
      </div>

      <div>
        <div className="text-xs font-semibold mb-1">{tp("field_other_documents")}</div>
        {otherDocs.map((d) => (
          <div key={d.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1 mb-1">
            <span className="truncate">📄 {d.filename}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleDocDownload(d)} className="text-primary hover:underline">{t("documents.download")}</button>
              <button onClick={() => handleDocDelete(d)} className="text-red-500 hover:underline">{t("documents.delete")}</button>
            </div>
          </div>
        ))}
        {otherDocs.length === 0 && <p className="text-xs text-ink/40 mb-1">{t("documents.empty")}</p>}
        <label className="inline-block text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-3 py-1.5 cursor-pointer">
          📎 {t("documents.upload")}
          <input type="file" className="hidden" onChange={(e) => handleDocUpload(e, "other")} />
        </label>
      </div>

      <div>
        <div className="text-xs font-semibold mb-1">{tp("field_trophies")}</div>
        <div className="space-y-1 mb-2">
          {trophies.map((tr) => (
            <div key={tr.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1">
              <span>🏆 {tr.title}{tr.placement ? ` · ${tr.placement}` : ""}{tr.points ? ` · ${tr.points} pt` : ""}</span>
              <button onClick={() => handleTrophyDelete(tr.id)} className="text-ink/30 hover:text-red-500">✕</button>
            </div>
          ))}
          {trophies.length === 0 && <p className="text-xs text-ink/40">{tp("no_trophies")}</p>}
        </div>
        <form onSubmit={handleAddTrophy} className="space-y-2 bg-bg rounded-xl2 p-2">
          <input value={trophyForm.title} onChange={(e) => setTrophyForm({ ...trophyForm, title: e.target.value })}
                 placeholder={tp("trophy_title_placeholder")} required
                 className="w-full text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
          <div className="flex gap-2">
            <input value={trophyForm.placement} onChange={(e) => setTrophyForm({ ...trophyForm, placement: e.target.value })}
                   placeholder={tp("trophy_placement_placeholder")}
                   className="flex-1 text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
            <input value={trophyForm.points} onChange={(e) => setTrophyForm({ ...trophyForm, points: e.target.value })}
                   type="number" placeholder={tp("trophy_points_placeholder")}
                   className="w-20 text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
            <input value={trophyForm.date_won} onChange={(e) => setTrophyForm({ ...trophyForm, date_won: e.target.value })}
                   type="date" className="text-xs border border-slate-200 rounded-xl2 px-2 py-1" />
          </div>
          <button type="submit" className="w-full bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-3 py-1.5 text-xs">
            {tp("add_trophy_button")}
          </button>
        </form>
      </div>
    </div>
  );
}

function BirthdaysTab({ tp }) {
  const [entries, setEntries] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState({});
  const [error, setError] = useState(null);

  function refresh() {
    api.gymBirthdays(60).then(setEntries).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleSend(memberId) {
    setSendingId(memberId);
    setError(null);
    try {
      await api.sendGymBirthdayNotification(memberId);
      setSentIds((prev) => ({ ...prev, [memberId]: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingId(null);
    }
  }

  function formatDaysUntil(days) {
    if (days === 0) return tp("birthday_today");
    if (days === 1) return tp("birthday_tomorrow");
    return tp("birthday_in_days").replace("{{days}}", days);
  }

  return (
    <Card>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {entries.length === 0 ? (
        <p className="text-ink/50 text-sm">{tp("leaderboard_empty_birthdays")}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.member_id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl2 px-3 py-2">
              <div className="flex items-center gap-3 min-w-0">
                <MemberPhoto memberId={e.member_id} hasPhoto={e.has_photo} size={36} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.full_name}</div>
                  <div className="text-xs text-ink/50">
                    {formatDaysUntil(e.days_until)} · {tp("turning_age").replace("{{age}}", e.turning_age)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSend(e.member_id)}
                disabled={sendingId === e.member_id}
                className="text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-3 py-1.5 shrink-0 disabled:opacity-50"
              >
                {sentIds[e.member_id] || e.notified_today ? `✅ ${tp("notification_sent")}` : `🎂 ${tp("send_notification")}`}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function LeaderboardTab({ tp }) {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    api.gymLeaderboard().then(setBoard).catch(() => {});
  }, []);

  return (
    <Card>
      {board.length === 0 ? (
        <p className="text-ink/50 text-sm">{tp("leaderboard_empty")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50 text-xs border-b border-slate-100">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">{tp("leaderboard_col_member")}</th>
              <th className="py-2 pr-2">{tp("leaderboard_col_trophies")}</th>
              <th className="py-2 pr-2">{tp("leaderboard_col_points")}</th>
            </tr>
          </thead>
          <tbody>
            {board.map((e, i) => (
              <tr key={e.member_id} className="border-b border-slate-50">
                <td className="py-2 pr-2 font-bold">{i + 1}</td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <MemberPhoto memberId={e.member_id} hasPhoto={e.has_photo} size={28} />
                    <span>
                      {e.full_name}
                      {e.card_number ? <span className="text-ink/40 text-xs"> · {e.card_number}</span> : null}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-2">{e.trophies_count}</td>
                <td className="py-2 pr-2 font-semibold">{e.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
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
