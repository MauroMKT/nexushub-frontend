import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-primary mb-1">NexusHub CRM</h1>
        <h2 className="text-lg font-semibold mb-4">{t("login.title")}</h2>
        {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">{t("login.email")}</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl2 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("login.password")}</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl2 px-3 py-2"
            />
          </div>
          <button
            type="submit" disabled={busy}
            className="w-full bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 py-2 transition-colors"
          >
            {t("login.submit")}
          </button>
        </form>
        <p className="text-sm text-ink/60 mt-4">
          {t("login.no_account")}{" "}
          <Link to="/register" className="text-primary font-medium underline">
            {t("login.register_link")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
