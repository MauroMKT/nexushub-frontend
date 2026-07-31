// Helper condiviso per leggere i campi multilingua del catalogo moduli
// (name_it/en/fr/de/es/zh/ja/ru/ar, sector_group_*, record_label_*) — Fase 9.4.
//
// Prima di questa fase, quattro punti diversi del frontend (Modules.jsx,
// Register.jsx, Sidebar.jsx, SectorWorkspace.jsx) ripetevano ognuno la stessa
// scelta "isItalian ? campo_it : campo_en", che per le altre 7 lingue dell'app
// (FR/DE/ES/ZH/JA/RU/AR) mostrava sempre l'inglese: la sidebar sembrava
// tradotta ma i nomi dei moduli, i gruppi di settore e le etichette dei
// record no. Il backend ora manda tutte e 9 le lingue per ogni modulo (vedi
// modules_catalog.py); queste funzioni scelgono quella giusta con un fallback
// prevedibile: lingua corrente -> inglese -> italiano -> lo slug/valore grezzo.

export const SUPPORTED_LANGS = ["it", "en", "fr", "de", "es", "zh", "ja", "ru", "ar"];

// i18n.language in questo progetto è sempre uno dei codici sopra (vedi i18n.js:
// nessuna variante regionale tipo "zh-CN"), ma per sicurezza normalizziamo
// comunque prendendo solo i primi 2 caratteri e verificando che sia supportato.
function normalizeLang(lang) {
  const short = (lang || "it").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(short) ? short : "it";
}

function pick(m, prefix, lang) {
  if (!m) return null;
  const key = `${prefix}_${normalizeLang(lang)}`;
  return m[key] || m[`${prefix}_en`] || m[`${prefix}_it`] || null;
}

// Nome del modulo (es. "Studi Legali" / "Law Firms" / "Cabinets d'Avocats"...).
export function getModuleName(m, lang) {
  return pick(m, "name", lang) || m?.slug || "";
}

// Etichetta del gruppo di settore (es. "Automotive" / "Automobile"...).
// Fallback finale sul valore grezzo di sector_group (italiano) se il backend
// non avesse ancora le traduzioni per qualche motivo.
export function getSectorGroupName(m, lang) {
  return pick(m, "sector_group", lang) || m?.sector_group || "";
}

// Etichetta dell'elemento di lavoro per i moduli "generici" di Fase 9.3 (es.
// "Pratica Legale" / "Legal Case"...). None per i 4 moduli pilota bespoke di
// Fase 9.1: in quel caso ricade sul nome del modulo stesso.
export function getRecordLabel(m, lang) {
  return pick(m, "record_label", lang) || getModuleName(m, lang);
}
