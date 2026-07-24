import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  company_name: "", sector: "", admin_full_name: "",
  admin_email: "", admin_password: "", language: "it",
};

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary mb-1">NexusHub CRM</h1>
        <h2 className="text-lg font-semibold mb-4">{t("register.title")}</h2>
        {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label={t("register.company_name")} value={form.company_name}
                 onChange={(v) => update("company_name", v)} required />
          <Field label={t("register.sector")} value={form.sector}
                 onChange={(v) => update("sector", v)} />
          <Field label={t("register.admin_full_name")} value={form.admin_full_name}
                 onChange={(v) => update("admin_full_name", v)} required />
          <Field label={t("register.admin_email")} type="email" value={form.admin_email}
                 onChange={(v) => update("admin_email", v)} required />
          <Field label={t("register.admin_password")} type="password" value={form.admin_password}
                 onChange={(v) => update("admin_password", v)} required />
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

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input
        type={type} required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl2 px-3 py-2"
      />
    </div>
  );
}
