/**
 * Palette pastello ufficiale NexusHub CRM (Sezione 5.1 del documento di specifica).
 * primary/secondary/accent usano il pattern "rgb(var(...) / <alpha-value>)": è il
 * formato che Tailwind richiede per poter generare anche le varianti con opacità
 * (bg-primary/40, hover:bg-primary/80 ecc.), che con un var() diretto sparirebbero
 * dal CSS generato (verificato in build prima di questa scelta).
 * Le variabili --nx-*-rgb (es. "169 214 229", componenti separate da spazio, non hex)
 * vengono impostate a runtime in src/theme.js in base ai colori white-label del tenant.
 * Il valore dopo la virgola è il fallback (palette di default) finché il tema non carica.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--nx-primary-rgb, 169 214 229) / <alpha-value>)",
        secondary: "rgb(var(--nx-secondary-rgb, 184 224 200) / <alpha-value>)",
        accent: "rgb(var(--nx-accent-rgb, 246 198 192) / <alpha-value>)",
        positive: "#FCE8B5",
        bg: "#FAFAF8",
        ink: "#2E3A46",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
