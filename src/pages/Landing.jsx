import { Link } from "react-router-dom";

import LanguageFlagSelect, { findLanguageOption } from "../components/LanguageFlagSelect";
import i18n, { changeLanguage } from "../i18n";
import { useState } from "react";

const FEATURES = [
  { icon: "👥", title: "CRM Core", desc: "Anagrafica clienti, tag, trattative e pipeline kanban in un unico posto." },
  { icon: "📅", title: "Agenda & Calendario", desc: "Appuntamenti sincronizzati con Google Calendar e promemoria automatici." },
  { icon: "⚡", title: "Automazioni", desc: "Regole e processi guidati che eliminano il lavoro ripetitivo del team." },
  { icon: "💬", title: "WhatsApp & Email", desc: "Notifiche, template e campagne di follow-up integrate nel CRM." },
  { icon: "🎨", title: "White-label", desc: "Colori e branding personalizzabili per ogni tenant/agenzia." },
  { icon: "🧾", title: "Contabilità", desc: "Fatture, prima nota e piano dei conti senza uscire dal CRM." },
  { icon: "🌐", title: "Portale clienti", desc: "Accesso self-service per i clienti finali: documenti, chat, prenotazioni." },
  { icon: "🛡️", title: "Multi-tenant sicuro", desc: "Isolamento totale dei dati tra aziende, con super admin dedicato." },
];

const PLANS = [
  { name: "Free", price: "0€", period: "/mese", desc: "Per iniziare da soli.", items: ["1 utente", "Clienti illimitati", "Pipeline & Agenda"], highlighted: false },
  { name: "Premium", price: "29€", period: "/mese", desc: "Per team in crescita.", items: ["Fino a 10 utenti", "Automazioni & WhatsApp", "White-label"], highlighted: true },
  { name: "Enterprise", price: "Su misura", period: "", desc: "Per agenzie strutturate.", items: ["Utenti illimitati", "Portale clienti", "Supporto dedicato"], highlighted: false },
];

export default function Landing() {
  const [pageLangVariant, setPageLangVariant] = useState(
    () => findLanguageOption(i18n.language).variant
  );

  function handleLanguageChange(opt) {
    setPageLangVariant(opt.variant);
    changeLanguage(opt.i18nCode);
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="text-2xl font-bold text-primary">NexusHub CRM</div>
        <div className="flex items-center gap-3">
          <LanguageFlagSelect value={pageLangVariant} onChange={handleLanguageChange} />
          <Link
            to="/login"
            className="text-sm font-semibold text-ink/70 hover:text-ink px-3 py-2"
          >
            Accedi
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-primary hover:bg-primary/80 text-ink rounded-xl2 px-4 py-2 transition-colors"
          >
            Prova gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-10 pb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-ink leading-tight mb-5">
          Il CRM modulare che fa crescere <span className="text-primary">la tua agenzia</span>
        </h1>
        <p className="text-lg text-ink/70 mb-8 max-w-2xl mx-auto">
          Clienti, pipeline, agenda, automazioni, WhatsApp, email marketing e contabilità:
          tutto in un&apos;unica piattaforma multi-tenant, pensata per team che vogliono
          smettere di rincorrere fogli Excel e strumenti sparsi.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-6 py-3 transition-colors"
          >
            Inizia ora, è gratis
          </Link>
          <Link
            to="/login"
            className="border border-slate-200 hover:bg-white text-ink font-semibold rounded-xl2 px-6 py-3 transition-colors"
          >
            Ho già un account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-10">Tutto quello che serve, in un solo CRM</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-xl2 shadow-sm border border-slate-100 p-5">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold mb-1">{f.title}</div>
              <div className="text-sm text-ink/60">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">Piani semplici, senza sorprese</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl2 p-6 border ${
                p.highlighted
                  ? "bg-primary/20 border-primary shadow-md"
                  : "bg-white border-slate-100 shadow-sm"
              }`}
            >
              <div className="font-semibold text-lg mb-1">{p.name}</div>
              <div className="text-sm text-ink/60 mb-4">{p.desc}</div>
              <div className="mb-4">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-ink/60">{p.period}</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-ink/70">
                {p.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-primary">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block text-center font-semibold rounded-xl2 py-2 transition-colors ${
                  p.highlighted
                    ? "bg-primary hover:bg-primary/80 text-ink"
                    : "border border-slate-200 hover:bg-bg text-ink"
                }`}
              >
                Scegli {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-ink/50">
        © {new Date().getFullYear()} NexusHub CRM. Tutti i diritti riservati.
      </footer>
    </div>
  );
}
