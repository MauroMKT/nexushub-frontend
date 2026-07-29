import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api, clearPortalToken, hasPortalToken } from "../api";
import Card from "../components/Card";
import ChatPanel from "../components/ChatPanel";
import ClientDocumentsPanel from "../components/ClientDocumentsPanel";
import { applyTenantTheme } from "../theme";

// Vista self-service del cliente finale (M19): solo i propri appuntamenti e task,
// niente accesso ad altri clienti dello stesso tenant.
export default function PortalDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ title: "", start_time: "", end_time: "", location: "" });
  const [bookingError, setBookingError] = useState("");
  const [bookingDone, setBookingDone] = useState(false);

  function refreshAppointments() {
    api.portalAppointments().then(setAppointments).catch(() => {});
  }

  useEffect(() => {
    if (!hasPortalToken()) {
      navigate("/portal/login");
      return;
    }
    Promise.all([api.portalMe(), api.portalAppointments(), api.portalTasks()])
      .then(([me, appts, tsk]) => {
        setClient(me);
        setAppointments(appts);
        setTasks(tsk);
      })
      .catch(() => setError(t("portal.session_expired")));

    // Applica i colori white-label del tenant anche nel portale clienti (Fase 8):
    // prima di questa chiamata il portale mostrava sempre i colori di default,
    // indipendentemente da quanto configurato dall'azienda in Impostazioni.
    api.portalTheme().then(applyTenantTheme).catch(() => {});
  }, []);

  async function handleBookingSubmit(e) {
    e.preventDefault();
    setBookingError("");
    try {
      await api.portalCreateAppointment({
        title: bookingForm.title,
        location: bookingForm.location || null,
        start_time: new Date(bookingForm.start_time).toISOString(),
        end_time: new Date(bookingForm.end_time).toISOString(),
      });
      setBookingForm({ title: "", start_time: "", end_time: "", location: "" });
      setBookingDone(true);
      setShowBooking(false);
      refreshAppointments();
    } catch (err) {
      setBookingError(err.message);
    }
  }

  function handleLogout() {
    clearPortalToken();
    navigate("/portal/login");
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <Card>
          <p className="text-ink/70 mb-3">{error}</p>
          <button onClick={handleLogout} className="bg-primary hover:bg-primary/80 rounded-xl2 px-4 py-2 text-sm">
            {t("portal.login_link")}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("portal.welcome", { name: client?.name || "" })}</h1>
          {client?.company && <p className="text-sm text-ink/60">{client.company}</p>}
        </div>
        <button onClick={handleLogout} className="text-sm text-ink/60 hover:text-ink">
          {t("common.logout")}
        </button>
      </div>

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{t("portal.appointments")}</h2>
          <button
            onClick={() => { setShowBooking((s) => !s); setBookingDone(false); setBookingError(""); }}
            className="text-xs bg-primary hover:bg-primary/80 rounded-xl2 px-3 py-1.5 font-medium"
          >
            + {t("portal.book_meeting")}
          </button>
        </div>

        {bookingDone && <p className="text-xs text-green-600 mb-3">{t("portal.meeting_submitted")}</p>}

        {showBooking && (
          <form onSubmit={handleBookingSubmit} className="space-y-2 bg-bg rounded-xl2 p-3 mb-3">
            {bookingError && <p className="text-xs text-red-500">{bookingError}</p>}
            <div>
              <label className="text-xs font-medium block mb-1">{t("portal.meeting_title_label")}</label>
              <input required value={bookingForm.title}
                     onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                     className="w-full text-sm border border-slate-200 rounded-xl2 px-2 py-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium block mb-1">{t("portal.meeting_start_label")}</label>
                <input type="datetime-local" required value={bookingForm.start_time}
                       onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                       className="w-full text-sm border border-slate-200 rounded-xl2 px-2 py-1.5" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">{t("portal.meeting_end_label")}</label>
                <input type="datetime-local" required value={bookingForm.end_time}
                       onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                       className="w-full text-sm border border-slate-200 rounded-xl2 px-2 py-1.5" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">{t("portal.meeting_location_label")}</label>
              <input value={bookingForm.location}
                     onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                     className="w-full text-sm border border-slate-200 rounded-xl2 px-2 py-1.5" />
            </div>
            <button type="submit" className="w-full bg-secondary hover:bg-secondary/80 font-semibold rounded-xl2 px-3 py-1.5 text-sm">
              {t("portal.meeting_submit")}
            </button>
          </form>
        )}

        {appointments.length === 0 && <p className="text-sm text-ink/50">{t("portal.no_appointments")}</p>}
        <ul className="divide-y divide-slate-100">
          {appointments.map((a) => (
            <li key={a.id} className="py-2 text-sm">
              <div className="font-medium flex items-center gap-2 flex-wrap">
                {a.title}
                {a.is_public_booking && a.status === "scheduled" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/50">{t("portal.meeting_pending_badge")}</span>
                )}
                {a.status === "confirmed" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50">{t("portal.meeting_confirmed_badge")}</span>
                )}
              </div>
              <div className="text-ink/60">{new Date(a.start_time).toLocaleString()}{a.location ? ` · ${a.location}` : ""}</div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold mb-3">{t("portal.tasks")}</h2>
        {tasks.length === 0 && <p className="text-sm text-ink/50">{t("portal.no_tasks")}</p>}
        <ul className="divide-y divide-slate-100">
          {tasks.map((tk) => (
            <li key={tk.id} className="py-2 text-sm flex items-center justify-between">
              <span className={tk.done ? "line-through text-ink/40" : ""}>{tk.title}</span>
              {tk.due_date && <span className="text-ink/50 text-xs">{new Date(tk.due_date).toLocaleDateString()}</span>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="!p-0 flex flex-col overflow-hidden mb-4">
        <h2 className="font-semibold p-4 pb-0">{t("chat.client_chat_title")}</h2>
        <div className="h-72">
          <ChatPanel
            resetKey="portal-chat"
            fetchMessages={(after) => api.portalListChat(after)}
            sendMessage={(body) => api.portalSendChat(body)}
            emptyLabel={t("chat.client_chat_empty")}
            placeholder={t("chat.client_chat_placeholder")}
            myLabelMatcher={(m) => m.sender_type === "client"}
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("documents.title")}</h2>
        <ClientDocumentsPanel
          listDocuments={() => api.portalListDocuments()}
          downloadDocument={(docId) => api.portalDownloadDocument(docId)}
          readOnly
        />
      </Card>
    </div>
  );
}
