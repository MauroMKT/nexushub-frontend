import { useEffect } from "react";

import { saveToken } from "../api";

/**
 * Pagina "ponte" per il token generato da /platform-admin/tenants/{id}/impersonate.
 * Va aperta in una finestra a parte (idealmente in incognito) perché salva il
 * token nella sessione team standard: se aperta nella stessa finestra del super
 * admin, sovrascriverebbe la sua sessione.
 */
export default function ImpersonateBridge() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const token = params.get("token");
    if (token) {
      saveToken(token);
      window.location.replace("/");
    } else {
      window.location.replace("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <p className="text-ink/60 text-sm">Accesso in corso...</p>
    </div>
  );
}
