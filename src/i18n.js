import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import it from "./locales/it.json";

// Fase 1: solo Italiano e Inglese attivi (Sezione 6 del documento).
// Le altre 7 lingue si aggiungono in Fase 3 seguendo la stessa struttura file.
i18n.use(initReactI18next).init({
  resources: { it: { translation: it }, en: { translation: en } },
  lng: localStorage.getItem("nexushub_lang") || "it",
  fallbackLng: "it",
  interpolation: { escapeValue: false },
});

export function changeLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem("nexushub_lang", lang);
}

export default i18n;
