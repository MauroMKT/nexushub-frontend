import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Card from "../components/Card";
import LanguageFlagSelect, { findLanguageOption } from "../components/LanguageFlagSelect";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const COMPANY_TYPES = ["spa", "srl", "srls", "ditta_individuale", "libero_professionista"];

const initialForm = {
  account_type: "azienda",
  language: "it",
  // azienda
  company_type: "srl",
  legal_name: "",
  sector: "",
  vat_number: "",
  pec: "",
  address: "",
  phone: "",
  email: "",
  contact_full_name: "",
  contact_phone: "",
  contact_email: "",
  // persona fisica
  full_name: "",
  // account di accesso
  admin_full_name: "",
  admin_email: "",
  admin_password: "",
};

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [langVariant, setLangVariant] = useState("it");
  const [vatInfo, setVatInfo] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Riconoscimento paese dalla Partita IVA (debounced), per mostrare/nascondere la PEC.
  useEffect(() => {
    if (form.account_type !== "azienda" || !form.vat_number || form.vat_number.trim().length < 4) {
      setVatInfo(null);
      return;
    }
    const handle = setTimeout(() => {
      api.vatLookup(form.vat_number).then(setVatInfo).catch(() => setVatInfo(null));
    }, 400);
    return () => clearTimeout(handle);
  }, [form.vat_number, form.account_type]);

  function handleLanguageChange(opt) {
    setLangVariant(opt.variant);
    update("language", opt.i18nCode);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = { ...form };
      if (form.account_type === "persona_fisica") {
        // Per una persona fisica il titolare coincide col contatto di accesso.
        payload.admin_full_name = payload.admin_full_name || form.full_name;
        payload.admin_email = payload.admin_email || form.email;
      }
      await register(payload);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isAzienda = form.account_type === "azienda";
  const showPec = isAzienda && vatInfo?.is_italian;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      <Card className="w-full max-w-xl">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-bold text-primary">NexusHub CRM</h1>
          <LanguageFlagSelect value={langVariant} onChange={handleLanguageChange} />
        </div>
        <h2 className="text-lg font-semibold mb-4">{t("register.title")}</h2>
        {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo di registrazione */}
          <div>
            <label className="text-sm font-medium block mb-1">{t("register.account_type_label")}</label>
            <div className="flex gap-2">
              <ToggleButton
                active={isAzienda}
                onClick={() => update("account_type", "azienda")}
                label={t("register.account_type_azienda")}
              />
              <ToggleButton
                active={!isAzienda}
                onClick={() => update("account_type", "persona_fisica")}
                label={t("register.account_type_persona_fisica")}
              />
            </div>
          </div>

          {isAzienda ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("register.legal_name")} value={form.legal_name}
                       onChange={(v) => update("legal_name", v)} required />
                <div>
                  <label className="text-sm font-medium block mb-1">{t("register.company_type")}</label>
                  <select
                    value={form.company_type}
                    onChange={(e) => update("company_type", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2"
                  >
                    {COMPANY_TYPES.map((ct) => (
                      <option key={ct} value={ct}>{t(`register.company_type_${ct}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Field label={t("register.sector")} value={form.sector}
                     onChange={(v) => update("sector", v)} />

              <div>
                <Field label={t("register.vat_number")} value={form.vat_number}
                       onChange={(v) => update("vat_number", v)} />
                <p className="text-xs text-ink/50 mt-1">
                  {vatInfo?.country_name
                    ? t("register.vat_country_detected", { country: vatInfo.country_name })
                    : t("register.vat_number_hint")}
                </p>
              </div>

              {showPec && (
                <Field label={t("register.pec")} type="email" value={form.pec}
                       onChange={(v) => update("pec", v)} hint={t("register.pec_hint")} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("register.address")} value={form.address}
                       onChange={(v) => update("address", v)} />
                <Field label={t("register.company_phone")} value={form.phone}
                       onChange={(v) => update("phone", v)} />
              </div>
              <Field label={t("register.company_email")} type="email" value={form.email}
                     onChange={(v) => update("email", v)} />

              <fieldset className="border border-slate-200 rounded-xl2 p-3">
                <legend className="text-sm font-semibold px-1">{t("register.contact_section_title")}</legend>
                <div className="space-y-3">
                  <Field label={t("register.contact_full_name")} value={form.contact_full_name}
                         onChange={(v) => update("contact_full_name", v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t("register.contact_phone")} value={form.contact_phone}
                           onChange={(v) => update("contact_phone", v)} />
                    <Field label={t("register.contact_email")} type="email" value={form.contact_email}
                           onChange={(v) => update("contact_email", v)} />
                  </div>
                </div>
              </fieldset>
            </>
          ) : (
            <fieldset className="border border-slate-200 rounded-xl2 p-3">
              <legend className="text-sm font-semibold px-1">{t("register.individual_section_title")}</legend>
              <div className="space-y-3">
                <Field label={t("register.individual_full_name")} value={form.full_name}
                       onChange={(v) => update("full_name", v)} required />
                <Field label={t("register.individual_address")} value={form.address}
                       onChange={(v) => update("address", v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("register.individual_phone")} value={form.phone}
                         onChange={(v) => update("phone", v)} />
                  <Field label={t("register.individual_email")} type="email" value={form.email}
                         onChange={(v) => update("email", v)} required />
                </div>
              </div>
            </fieldset>
          )}

          <fieldset className="border border-slate-200 rounded-xl2 p-3">
            <legend className="text-sm font-semibold px-1">{t("register.account_section_title")}</legend>
            <div className="space-y-3">
              <Field label={t("register.admin_full_name")} value={form.admin_full_name}
                     onChange={(v) => update("admin_full_name", v)}
                     required={isAzienda} />
              <Field label={t("register.admin_email")} type="email" value={form.admin_email}
                     onChange={(v) => update("admin_email", v)}
                     required={isAzienda} />
              <Field label={t("register.admin_password")} type="password" value={form.admin_password}
                     onChange={(v) => update("admin_password", v)} required />
            </div>
          </fieldset>

          <button
            type="submit" disabled={busy}
            className="w-full bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 py-2 transition-colors"
          >
            {t("register.submit")}
          </button>
        </form>
        <p className="text-sm text-ink/60 mt-4">
          {t("register.have_account")}{" "}
          <Link to="/login" className="text-primary font-medium underline">
            {t("register.login_link")}
          </Link>
        </p>
      </Card>
    </div>
  );
}

function ToggleButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl2 py-2 text-sm font-semibold border transition-colors ${
        active ? "bg-primary border-primary text-ink" : "border-slate-200 text-ink/60 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, value, onChange, type = "text", required = false, hint = null }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input
        type={type} required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl2 px-3 py-2"
      />
      {hint && <p className="text-xs text-ink/50 mt-1">{hint}</p>}
    </div>
  );
}
