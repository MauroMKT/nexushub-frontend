import { createContext, useContext, useEffect, useState } from "react";

import { api, clearToken, hasToken, saveToken } from "../api";
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
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
