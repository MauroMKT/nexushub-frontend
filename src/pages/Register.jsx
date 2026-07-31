import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Card from "../components/Card";
import LanguageFlagSelect, { findLanguageOption } from "../components/LanguageFlagSelect";
import i18n, { changeLanguage } from "../i18n";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { getModuleName, getSectorGroupName } from "../utils/moduleI18n";

// Paesi supportati per la selezione esplicita in fase di registrazione azienda.
// L'esempio di formato è una stringa universale (cifre/lettere), non richiede
// traduzione: viene mostrato come suggerimento sotto il campo codice fiscale
// in base al paese selezionato, al posto del vecchio riconoscimento automatico
// dal testo digitato (che con forme libere multi-paese non è più affidabile).
const COMPANY_COUNTRIES = [
  { code: "IT", format: "IT 12345678901" },
  { code: "FR", format: "FR 12 345678901" },
  { code: "DE", format: "DE 123456789" },
  { code: "ES", format: "ES X1234567X" },
  { code: "PT", format: "PT 123456789" },
  { code: "GB", format: "GB 123456789" },
  { code: "IE", format: "IE 1234567X" },
  { code: "NL", format: "NL 123456789B01" },
  { code: "BE", format: "BE 0123456789" },
  { code: "AT", format: "ATU 12345678" },
  { code: "CH", format: "CHE-123.456.789" },
  { code: "LU", format: "LU 12345678" },
  { code: "PL", format: "PL 1234567890" },
  { code: "CZ", format: "CZ 12345678" },
  { code: "SK", format: "SK 1234567890" },
  { code: "HU", format: "HU 12345678" },
  { code: "RO", format: "RO 12345678" },
  { code: "GR", format: "EL 123456789" },
  { code: "SE", format: "SE 123456789012" },
  { code: "DK", format: "DK 12345678" },
  { code: "FI", format: "FI 12345678" },
  { code: "NO", format: "NO 123456789MVA" },
  { code: "EE", format: "EE 123456789" },
  { code: "LV", format: "LV 12345678901" },
  { code: "LT", format: "LT 123456789" },
  { code: "SI", format: "SI 12345678" },
  { code: "HR", format: "HR 12345678901" },
  { code: "BG", format: "BG 123456789" },
  { code: "MT", format: "MT 12345678" },
  { code: "CY", format: "CY 12345678X" },
  { code: "US", format: "12-3456789 (EIN)" },
  { code: "CA", format: "123456789 RT0001" },
  { code: "AU", format: "12 345 678 901 (ABN)" },
  { code: "CN", format: "91XXXXXXXXXXXXXXXX" },
  { code: "JP", format: "T1234567890123" },
  { code: "RU", format: "1234567890 (ИНН)" },
  { code: "BR", format: "12.345.678/0001-90 (CNPJ)" },
  { code: "MX", format: "AAA010101AAA (RFC)" },
  { code: "IN", format: "22AAAAA0000A1Z5 (GSTIN)" },
  { code: "AE", format: "100123456700003 (TRN)" },
  { code: "SA", format: "300123456700003" },
  { code: "TR", format: "1234567890 (VKN)" },
  { code: "KR", format: "123-45-67890" },
  { code: "ZA", format: "4123456789" },

  // --- Asia (resto del continente) ---
  { code: "AF", format: "1234567890 (TIN)" },
  { code: "AM", format: "12345678 (ՀՎՀՀ)" },
  { code: "AZ", format: "1234567891 (VÖEN)" },
  { code: "BH", format: "123456789012345 (VAT)" },
  { code: "BD", format: "123456789-0123 (BIN)" },
  { code: "BT", format: "PAN-1234567 (TPN)" },
  { code: "BN", format: "1234567890 (TIN)" },
  { code: "KH", format: "K001-1234567 (TIN)" },
  { code: "GE", format: "123456789 (ID/VAT)" },
  { code: "HK", format: "12345678 (BR Number)" },
  { code: "ID", format: "12.345.678.9-012.345 (NPWP)" },
  { code: "IR", format: "12345678901 (Codice economico)" },
  { code: "IQ", format: "1234567890 (TIN)" },
  { code: "IL", format: "123456789 (Mispar Osek)" },
  { code: "JO", format: "1234567 (TIN)" },
  { code: "KZ", format: "123456789012 (BIN)" },
  { code: "KW", format: "1234567890 (TIN)" },
  { code: "KG", format: "12345199012345 (TIN)" },
  { code: "LA", format: "1234567890 (TIN)" },
  { code: "LB", format: "1234567 (TIN)" },
  { code: "MO", format: "12345678 (BR Number)" },
  { code: "MY", format: "C 12345678901 (TIN)" },
  { code: "MV", format: "1234-GST-123 (TIN)" },
  { code: "MN", format: "1234567 (TIN)" },
  { code: "MM", format: "1234567890 (TIN)" },
  { code: "NP", format: "123456789 (PAN)" },
  { code: "KP", format: "1234567890 (TIN)" },
  { code: "OM", format: "OM1234567890123 (VAT)" },
  { code: "PK", format: "1234567-8 (NTN)" },
  { code: "PS", format: "123456789 (TIN)" },
  { code: "PH", format: "123-456-789-000 (TIN)" },
  { code: "QA", format: "12345678901 (TIN)" },
  { code: "SG", format: "201912345A (UEN)" },
  { code: "LK", format: "123456789-7000 (VAT)" },
  { code: "SY", format: "1234567 (TIN)" },
  { code: "TW", format: "12345678 (Codice unificato)" },
  { code: "TJ", format: "123456789 (TIN)" },
  { code: "TH", format: "1234567890123 (Tax ID)" },
  { code: "TL", format: "12345678901 (TIN)" },
  { code: "TM", format: "1234567890 (TIN)" },
  { code: "UZ", format: "123456789 (TIN/STIR)" },
  { code: "VN", format: "0123456789 (MST)" },
  { code: "YE", format: "1234567890 (TIN)" },

  // --- Oceania (resto del continente) ---
  { code: "NZ", format: "123-456-789 (IRD Number)" },
  { code: "FJ", format: "12-34567-0 (TIN)" },
  { code: "PG", format: "1234567 (TIN)" },
  { code: "WS", format: "1234567 (TIN)" },
  { code: "SB", format: "1234567 (TIN)" },
  { code: "TO", format: "1234567 (TIN)" },
  { code: "VU", format: "1234567 (TIN)" },
  { code: "KI", format: "1234567 (TIN)" },
  { code: "FM", format: "1234567 (TIN)" },
  { code: "NR", format: "1234567 (TIN)" },
  { code: "PW", format: "1234567 (TIN)" },
  { code: "MH", format: "1234567 (TIN)" },
  { code: "TV", format: "1234567 (TIN)" },
  { code: "CK", format: "1234567 (TIN)" },

  // --- Sud America (resto del continente) ---
  { code: "AR", format: "20-12345678-9 (CUIT)" },
  { code: "BO", format: "1234567890123 (NIT)" },
  { code: "CL", format: "12.345.678-9 (RUT)" },
  { code: "CO", format: "900.123.456-7 (NIT)" },
  { code: "EC", format: "1234567890001 (RUC)" },
  { code: "GY", format: "1234567 (TIN)" },
  { code: "PY", format: "12345678-9 (RUC)" },
  { code: "PE", format: "12345678901 (RUC)" },
  { code: "SR", format: "1234567 (TIN)" },
  { code: "UY", format: "123456789012 (RUT)" },
  { code: "VE", format: "J-123456789 (RIF)" },
];

function getCountryName(code, lang) {
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

const initialForm = {
  account_type: "azienda",
  language: "it",
  // azienda
  company_type: "",
  legal_name: "",
  trade_name: "",
  sector: "",
  vat_number: "",
  pec: "",
  address: "",
  zip_code: "",
  country: "",
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
  // Lingua di VISUALIZZAZIONE della pagina (icona bandiera in alto a destra):
  // cambia solo la traduzione dell'interfaccia mostrata in questo momento,
  // tramite i18n.changeLanguage(). Inizializzata sulla lingua i18n corrente.
  const [pageLangVariant, setPageLangVariant] = useState(
    () => findLanguageOption(i18n.language).variant
  );
  // Lingua scelta per l'ACCOUNT che si sta registrando (campo esplicito nel form):
  // stato indipendente dalla lingua di visualizzazione della pagina. Viene salvata
  // in form.language e inviata al backend come preferenza dell'account (non deve
  // toccare né essere toccata dalla traduzione della pagina corrente).
  const [accountLangVariant, setAccountLangVariant] = useState(
    () => findLanguageOption(initialForm.language).variant
  );
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Catalogo settori per il menu a tendina "Settore" (Fase 9.1): la stessa unica
  // fonte di verità usata per attivare/mostrare i moduli nel resto dell'app,
  // così il valore scelto qui corrisponde SEMPRE a uno slug di modulo reale e
  // può essere autoattivato subito dopo la registrazione (vedi auth_router.py).
  const [sectorCatalog, setSectorCatalog] = useState([]);
  useEffect(() => {
    api.listPublicModulesCatalog().then(setSectorCatalog).catch(() => setSectorCatalog([]));
  }, []);
  // Raggruppa per sector_group (chiave italiana stabile), etichetta del
  // gruppo mostrata sempre nella lingua di visualizzazione corrente (Fase 9.4).
  const sectorGroups = sectorCatalog.reduce((acc, m) => {
    (acc[m.sector_group] = acc[m.sector_group] || { label: getSectorGroupName(m, i18n.language), items: [] });
    acc[m.sector_group].items.push(m);
    return acc;
  }, {});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Elenco paesi con nome localizzato nella lingua di visualizzazione corrente
  // della pagina (Intl.DisplayNames, nessuna traduzione manuale necessaria).
  const sortedCountries = [...COMPANY_COUNTRIES]
    .map((c) => ({ ...c, name: getCountryName(c.code, i18n.language) }))
    .sort((a, b) => a.name.localeCompare(b.name, i18n.language));

  // Formato di esempio del codice fiscale in base al paese selezionato: il
  // riconoscimento ora si basa sulla scelta esplicita dell'utente, non più su
  // un tentativo di riconoscimento automatico dal testo digitato.
  const selectedCountryFormat = COMPANY_COUNTRIES.find((c) => c.code === form.country)?.format || null;

  // Bandiera in alto: cambia SOLO la lingua di visualizzazione della pagina di
  // registrazione (non tocca form.language, la preferenza dell'account).
  function handlePageLanguageChange(opt) {
    setPageLangVariant(opt.variant);
    changeLanguage(opt.i18nCode);
  }

  // Campo "Lingua" nel form: cambia SOLO la preferenza salvata per l'account che
  // si sta creando (non tocca la lingua con cui è mostrata la pagina in questo momento).
  function handleAccountLanguageChange(opt) {
    setAccountLangVariant(opt.variant);
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
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isAzienda = form.account_type === "azienda";
  const showPec = isAzienda && form.country === "IT";

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      <Card className="w-full max-w-xl">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-bold text-primary">NexusHub CRM</h1>
          <LanguageFlagSelect value={pageLangVariant} onChange={handlePageLanguageChange} />
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

          {/* Lingua dell'account: campo esplicito nel form, indipendente dall'icona
              bandiera in alto che serve solo a tradurre la pagina di registrazione. */}
          <div>
            <label className="text-sm font-medium block mb-1">{t("register.language_label")}</label>
            <LanguageFlagSelect value={accountLangVariant} onChange={handleAccountLanguageChange} className="w-full" />
          </div>

          {/* Settore: comune a entrambi i tipi di account, popolato dal catalogo
              moduli (stessa fonte usata per attivare i moduli dopo il login).
              Se il valore scelto corrisponde a un modulo di settore, viene
              autoattivato subito per il nuovo tenant (vedi auth_router.py). */}
          <GroupedSelect
            label={t("register.sector")}
            value={form.sector}
            onChange={(v) => update("sector", v)}
            groups={sectorGroups}
          />

          {isAzienda ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("register.legal_name")} value={form.legal_name}
                       onChange={(v) => update("legal_name", v)} required />
                <Select label={t("register.country")} value={form.country}
                        onChange={(v) => update("country", v)}
                        options={sortedCountries.map((c) => ({ value: c.code, label: c.name }))} />
              </div>

              <Field label={t("register.company_type")} value={form.company_type}
                     onChange={(v) => update("company_type", v)} hint={t("register.company_type_hint")} />

              <Field label={t("register.trade_name")} value={form.trade_name}
                     onChange={(v) => update("trade_name", v)} hint={t("register.trade_name_hint")} />

              <div>
                <Field label={t("register.vat_number")} value={form.vat_number}
                       onChange={(v) => update("vat_number", v)} />
                <p className="text-xs text-ink/50 mt-1">
                  {selectedCountryFormat
                    ? `${t("register.tax_id_example_prefix")} ${selectedCountryFormat}`
                    : t("register.vat_number_hint")}
                </p>
              </div>

              {showPec && (
                <Field label={t("register.pec")} type="email" value={form.pec}
                       onChange={(v) => update("pec", v)} hint={t("register.pec_hint")} />
              )}

              <Field label={t("register.address")} value={form.address}
                     onChange={(v) => update("address", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("register.zip_code")} value={form.zip_code}
                       onChange={(v) => update("zip_code", v)} />
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
                  <Field label={t("register.zip_code")} value={form.zip_code}
                         onChange={(v) => update("zip_code", v)} />
                  <Field label={t("register.country")} value={form.country}
                         onChange={(v) => update("country", v)} />
                </div>
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

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl2 px-3 py-2 bg-white"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// Menu a tendina "Settore" raggruppato per sector_group (Fase 9.1): il valore
// selezionato è lo slug stabile del modulo, così può essere autoattivato subito
// dopo la registrazione senza bisogno di alcun matching testuale lato backend.
// Fase 9.4: sia il nome del modulo che l'intestazione del gruppo sono ora
// tradotti in tutte le 9 lingue (prima ricadevano sull'inglese oltre it/en).
function GroupedSelect({ label, value, onChange, groups }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl2 px-3 py-2 bg-white"
      >
        <option value="">—</option>
        {Object.entries(groups).map(([groupName, { label: groupLabel, items }]) => (
          <optgroup key={groupName} label={groupLabel}>
            {items.map((m) => (
              <option key={m.slug} value={m.slug}>{getModuleName(m, i18n.language)}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
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
