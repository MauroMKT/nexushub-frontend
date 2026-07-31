import { createContext, useContext, useEffect, useState } from "react";

import { api, clearToken, clearViewTenantId, hasToken, saveToken, setViewTenantId } from "../api";
import { changeLanguage } from "../i18n";
import { applyTenantTheme } from "../theme";

const AuthContext = createContext(null);

// Applica anche il tema white-label del tenant (colori, Fase 4) subito dopo aver
// caricato l'utente, così l'interfaccia riflette il branding scelto in Impostazioni
// ovunque nell'app, non solo nella pagina Impostazioni.
function loadThemeSilently() {
  api.getTenantSettings().then(applyTenantTheme).catch(() => {});
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tenant che il super admin sta attualmente "visualizzando" (Fase 7 rivista):
  // resta SEMPRE autenticato con il proprio account (vedi api.js), questo id
  // serve solo a far scopare al backend le pagine normali del CRM sui dati di
  // quel tenant, invece di fare un vero login con le credenziali del cliente.
  const [viewTenantId, setViewTenantIdState] = useState(
    () => localStorage.getItem("nexushub_view_tenant_id") || null
  );

  useEffect(() => {
    if (hasToken()) {
      api.me()
        .then((u) => {
          setUser(u);
          changeLanguage(u.language || "it");
          loadThemeSilently();
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const { access_token } = await api.login({ email, password });
    saveToken(access_token);
    const me = await api.me();
    setUser(me);
    changeLanguage(me.language || "it");
    loadThemeSilently();
  }

  async function register(payload) {
    const { access_token } = await api.register(payload);
    saveToken(access_token);
    const me = await api.me();
    setUser(me);
    changeLanguage(me.language || "it");
    loadThemeSilently();
  }

  function logout() {
    clearToken();
    clearViewTenantId();
    setViewTenantIdState(null);
    setUser(null);
  }

  // Il super admin entra "come Super Admin" nei dati di un'agenzia: nessun nuovo
  // token, nessun logout/login con l'account dell'iscritto. Ricarica anche il
  // tema (colori white-label) del tenant selezionato, così le pagine del CRM
  // che si aprono di seguito appaiono visivamente come quelle del cliente.
  function enterTenantView(tenantId) {
    setViewTenantId(tenantId);
    setViewTenantIdState(tenantId);
    loadThemeSilently();
  }

  function exitTenantView() {
    clearViewTenantId();
    setViewTenantIdState(null);
    loadThemeSilently();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUser, viewTenantId, enterTenantView, exitTenantView }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
