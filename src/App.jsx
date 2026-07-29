import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedLayout from "./components/ProtectedLayout";
import CalendarPage from "./pages/CalendarPage";
import Clients from "./pages/Clients";
import Contacts from "./pages/Contacts";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Pipeline from "./pages/Pipeline";
import PortalDashboard from "./pages/PortalDashboard";
import PortalLogin from "./pages/PortalLogin";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import Automations from "./pages/Automations";
import WhatsAppHub from "./pages/WhatsAppHub";
import EmailMarketing from "./pages/EmailMarketing";
import PlatformAdmin from "./pages/PlatformAdmin";
import ImpersonateBridge from "./pages/ImpersonateBridge";
import TeamChat from "./pages/TeamChat";
import Accounting from "./pages/Accounting";
import Guide from "./pages/Guide";

// Routing Fase 1, 2 & estensioni (rubrica, notifiche, white-label, portale clienti, calendar).
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Portale clienti: sessione separata dal team, nessuna sidebar interna */}
      <Route path="/portal/login" element={<PortalLogin />} />
      <Route path="/portal" element={<PortalDashboard />} />

      {/* Ponte per il token di impersonate generato dal super admin (Fase 7) */}
      <Route path="/impersonate" element={<ImpersonateBridge />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/whatsapp" element={<WhatsAppHub />} />
        <Route path="/email" element={<EmailMarketing />} />
        <Route path="/chat" element={<TeamChat />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/platform-admin" element={<PlatformAdmin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
