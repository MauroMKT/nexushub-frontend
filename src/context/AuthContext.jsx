import { createContext, useContext, useEffect, useState } from "react";

import { api, clearToken, hasToken, saveToken } from "../api";
import { changeLanguage } from "../i18n";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasToken()) {
      api.me()
        .then((u) => {
          setUser(u);
          changeLanguage(u.language || "it");
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
  }

  async function register(payload) {
    const { access_token } = await api.register(payload);
    saveToken(access_token);
    const me = await api.me();
    setUser(me);
    changeLanguage(me.language || "it");
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
