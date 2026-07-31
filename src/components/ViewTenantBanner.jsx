import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api";
import { useAuth } from "../context/AuthContext";

// Barra sempre visibile mentre il super admin sta "visualizzando" i dati di
// un'agenzia cliente (Fase 7 rivista). Solo testo italiano: la vede solo il
// super admin (Mauro), mai gli iscritti del tenant. Ricorda che l'identità
// autenticata resta sempre quella del super admin, non del cliente.
export default function ViewTenantBanner() {
  const { viewTenantId, exitTenantView } = useAuth();
  const [tenantName, setTenantName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!viewTenantId) {
      setTenantName("");
      return;
    }
    api.platformAdminTenantDetail(viewTenantId)
      .then((t) => setTenantName(t.name))
      .catch(() => setTenantName(""));
  }, [viewTenantId]);

  if (!viewTenantId) return null;

  function handleExit() {
    exitTenantView();
    navigate("/platform-admin");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-primary text-ink text-sm font-medium px-4 py-2 border-b border-primary">
      <span>
        🛡️ Stai visualizzando i dati di <strong>{tenantName || "questa agenzia"}</strong> — sei sempre autenticato
        come Super Admin, non come questo iscritto.
      </span>
      <button
        onClick={handleExit}
        className="bg-white/90 hover:bg-white text-ink text-xs font-semibold px-3 py-1.5 rounded-xl2 whitespace-nowrap"
      >
        Esci e torna al pannello Super Admin
      </button>
    </div>
  );
}
