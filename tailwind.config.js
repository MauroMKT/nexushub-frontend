/**
 * Palette pastello ufficiale NexusHub CRM (Sezione 5.1 del documento di specifica).
 * Non modificare questi codici colore senza aggiornare anche il documento.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#A9D6E5",
        secondary: "#B8E0C8",
        accent: "#F6C6C0",
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
