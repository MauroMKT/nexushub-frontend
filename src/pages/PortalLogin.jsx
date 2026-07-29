import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api, savePortalToken } from "../api";

// Login del Portale Clienti (M19): sessione completamente separata dal login del team,
// pensata per essere condivisa dall'azienda cliente ai propri clienti finali.
export default function PortalLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { access_token } = await api.portalLogin({ email, password });
      savePortalToken(access_token);
      navigate("/portal");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-xl2 shadow-sm border border-slate-100 p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1 text-primary">{t("portal.title")}</h1>
        <p className="text-sm text-ink/60 mb-6">{t("portal.subtitle")}</p>
        {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 px-3 py-2 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">{t("portal.email")}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("portal.password")}</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                   className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
            {t("portal.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
