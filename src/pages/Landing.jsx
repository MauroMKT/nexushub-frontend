import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import LanguageFlagSelect, { findLanguageOption } from "../components/LanguageFlagSelect";
import i18n, { changeLanguage } from "../i18n";
import { useState } from "react";

const FEATURES = [
  { icon: "👥", titleKey: "feature_crm_title", descKey: "feature_crm_desc" },
  { icon: "📅", titleKey: "feature_calendar_title", descKey: "feature_calendar_desc" },
  { icon: "⚡", titleKey: "feature_automations_title", descKey: "feature_automations_desc" },
  { icon: "💬", titleKey: "feature_whatsapp_title", descKey: "feature_whatsapp_desc" },
  { icon: "🎨", titleKey: "feature_whitelabel_title", descKey: "feature_whitelabel_desc" },
  { icon: "🧾", titleKey: "feature_accounting_title", descKey: "feature_accounting_desc" },
  { icon: "🌐", titleKey: "feature_portal_title", descKey: "feature_portal_desc" },
  { icon: "🛡️", titleKey: "feature_multitenant_title", descKey: "feature_multitenant_desc" },
];

const PLANS = [
  {
    name: "Free",
    price: "0€",
    descKey: "plan_free_desc",
    itemKeys: ["plan_free_item_1", "plan_free_item_2", "plan_free_item_3"],
    highlighted: false,
  },
  {
    name: "Premium",
    price: "29€",
    descKey: "plan_premium_desc",
    itemKeys: ["plan_premium_item_1", "plan_premium_item_2", "plan_premium_item_3"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: null,
    descKey: "plan_enterprise_desc",
    itemKeys: ["plan_enterprise_item_1", "plan_enterprise_item_2", "plan_enterprise_item_3"],
    highlighted: false,
  },
];

export default function Landing() {
  const { t } = useTranslation();
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
            {t("landing.nav_login")}
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-primary hover:bg-primary/80 text-ink rounded-xl2 px-4 py-2 transition-colors"
          >
            {t("landing.nav_trial")}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-10 pb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-ink leading-tight mb-5">
          {t("landing.hero_title_line")} <span className="text-primary">{t("landing.hero_title_highlight")}</span>
        </h1>
        <p className="text-lg text-ink/70 mb-8 max-w-2xl mx-auto">
          {t("landing.hero_subtitle")}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-6 py-3 transition-colors"
          >
            {t("landing.hero_cta_start")}
          </Link>
          <Link
            to="/login"
            className="border border-slate-200 hover:bg-white text-ink font-semibold rounded-xl2 px-6 py-3 transition-colors"
          >
            {t("landing.hero_cta_login")}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-10">{t("landing.features_title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="bg-white rounded-xl2 shadow-sm border border-slate-100 p-5">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold mb-1">{t(`landing.${f.titleKey}`)}</div>
              <div className="text-sm text-ink/60">{t(`landing.${f.descKey}`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">{t("landing.pricing_title")}</h2>
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
              <div className="text-sm text-ink/60 mb-4">{t(`landing.${p.descKey}`)}</div>
              <div className="mb-4">
                <span className="text-3xl font-bold">{p.price || t("landing.plan_custom_price")}</span>
                {p.price && <span className="text-ink/60">{t("landing.plan_period_month")}</span>}
              </div>
              <ul className="space-y-2 mb-6 text-sm text-ink/70">
                {p.itemKeys.map((itemKey) => (
                  <li key={itemKey} className="flex items-center gap-2">
                    <span className="text-primary">✓</span> {t(`landing.${itemKey}`)}
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
                {t("landing.plan_cta_prefix")} {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-ink/50">
        © {new Date().getFullYear()} NexusHub CRM. {t("landing.footer_rights")}
      </footer>
    </div>
  );
}
