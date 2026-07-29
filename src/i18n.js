import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import it from "./locales/it.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ru from "./locales/ru.json";
import ar from "./locales/ar.json";

// Fase 3: 9 lingue attive (Sezione 6) - Italiano, Inglese, Francese, Spagnolo,
// Tedesco, Cinese, Giapponese, Russo, Arabo (RTL).
const RTL_LANGUAGES = ["ar"];

i18n.use(initReactI18next).init({
  resources: {
    it: { translation: it },
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    de: { translation: de },
    zh: { translation: zh },
    ja: { translation: ja },
    ru: { translation: ru },
    ar: { translation: ar },
  },
  lng: localStorage.getItem("nexushub_lang") || "it",
  fallbackLng: "it",
  interpolation: { escapeValue: false },
});

function applyDirection(lang) {
  const dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lang);
}

applyDirection(i18n.language);

export function changeLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem("nexushub_lang", lang);
  applyDirection(lang);
}

export default i18n;
