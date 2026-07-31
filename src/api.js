// In produzione (Netlify) usa l'URL del backend su Railway definito in VITE_API_URL.
// In sviluppo locale resta "/api" e passa dal proxy di vite.config.js.
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("nexushub_token");
}

function getPortalToken() {
  return localStorage.getItem("nexushub_portal_token");
}

// Modalità "Entra come" del super admin (Fase 7 rivista): il super admin resta
// SEMPRE autenticato con il proprio token; questo id serve solo a chiedere al
// backend di far vedere i dati di un tenant specifico (header X-View-Tenant-Id),
// senza mai generare un token separato o fare login con le credenziali del
// cliente. Vedi PlatformAdmin.jsx e AuthContext.jsx.
function getViewTenantId() {
  return localStorage.getItem("nexushub_view_tenant_id");
}
export function setViewTenantId(tenantId) {
  localStorage.setItem("nexushub_view_tenant_id", tenantId);
}
export function clearViewTenantId() {
  localStorage.removeItem("nexushub_view_tenant_id");
}

async function request(path, { method = "GET", body, auth = true, portalAuth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (portalAuth) {
    const token = getPortalToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } else if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const viewTenantId = getViewTenantId();
    if (viewTenantId) headers["X-View-Tenant-Id"] = viewTenantId;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = "Errore di rete";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (e) {
      /* risposta non JSON */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  updateMe: (payload) => request("/auth/me", { method: "PATCH", body: payload }),
  vatLookup: (vatNumber) => request(`/auth/vat-lookup?vat_number=${encodeURIComponent(vatNumber)}`, { auth: false }),

  listClients: () => request("/clients"),
  previewClientImport: (payload) => request("/clients/import/preview", { method: "POST", body: payload }),
  commitClientImport: (payload) => request("/clients/import/commit", { method: "POST", body: payload }),
  createClient: (payload) => request("/clients", { method: "POST", body: payload }),
  updateClient: (id, payload) => request(`/clients/${id}`, { method: "PUT", body: payload }),
  deleteClient: (id) => request(`/clients/${id}`, { method: "DELETE" }),

  listStages: () => request("/pipeline/stages"),
  listDeals: () => request("/pipeline/deals"),
  createDeal: (payload) => request("/pipeline/deals", { method: "POST", body: payload }),
  moveDeal: (id, stageId) => request(`/pipeline/deals/${id}/move`, { method: "PATCH", body: { stage_id: stageId } }),

  listAppointments: () => request("/appointments"),
  createAppointment: (payload) => request("/appointments", { method: "POST", body: payload }),
  updateAppointment: (id, payload) => request(`/appointments/${id}`, { method: "PUT", body: payload }),
  confirmAppointment: (id) => request(`/appointments/${id}/confirm`, { method: "POST" }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: "DELETE" }),

  listTasks: () => request("/tasks"),
  createTask: (payload) => request("/tasks", { method: "POST", body: payload }),
  updateTask: (id, payload) => request(`/tasks/${id}`, { method: "PUT", body: payload }),

  dashboardSummary: () => request("/dashboard/summary"),

  listTeam: () => request("/team"),
  inviteTeamMember: (payload) => request("/team", { method: "POST", body: payload }),
  getTenantSettings: () => request("/settings/tenant"),
  updateTenantSettings: (payload) => request("/settings/tenant", { method: "PUT", body: payload }),

  // --- Automations & Blueprints (M5) ---
  listRules: () => request("/automations/rules"),
  createRule: (payload) => request("/automations/rules", { method: "POST", body: payload }),
  updateRule: (id, payload) => request(`/automations/rules/${id}`, { method: "PUT", body: payload }),
  deleteRule: (id) => request(`/automations/rules/${id}`, { method: "DELETE" }),
  listBlueprints: () => request("/automations/blueprints"),
  createBlueprint: (payload) => request("/automations/blueprints", { method: "POST", body: payload }),
  updateBlueprint: (id, payload) => request(`/automations/blueprints/${id}`, { method: "PUT", body: payload }),
  deleteBlueprint: (id) => request(`/automations/blueprints/${id}`, { method: "DELETE" }),
  triggerEvent: (eventType, entityId) => request(`/automations/trigger?event_type=${eventType}&entity_id=${entityId}`, { method: "POST" }),

  // --- WhatsApp Hub (M6) ---
  listWhatsAppMessages: (clientId = "") => request(`/whatsapp/messages?client_id=${clientId}`),
  sendWhatsAppMessage: (payload) => request("/whatsapp/messages", { method: "POST", body: payload }),
  listWhatsAppTemplates: () => request("/whatsapp/templates"),
  createWhatsAppTemplate: (payload) => request("/whatsapp/templates", { method: "POST", body: payload }),
  deleteWhatsAppTemplate: (id) => request(`/whatsapp/templates/${id}`, { method: "DELETE" }),
  simulateWhatsAppInbound: (clientId, text) => request(`/whatsapp/webhook-simulate?client_id=${clientId}&text=${text}`, { method: "POST" }),

  // --- Email Marketing (M8) ---
  listEmailCampaigns: () => request("/email/campaigns"),
  createEmailCampaign: (payload) => request("/email/campaigns", { method: "POST", body: payload }),
  sendEmailCampaign: (id) => request(`/email/campaigns/${id}/send`, { method: "POST" }),
  listEmailSequences: () => request("/email/sequences"),
  createEmailSequence: (payload) => request("/email/sequences", { method: "POST", body: payload }),
  updateEmailSequence: (id, payload) => request(`/email/sequences/${id}`, { method: "PUT", body: payload }),
  deleteEmailSequence: (id) => request(`/email/sequences/${id}`, { method: "DELETE" }),

  // --- Rubrica telefonica ---
  listContacts: (q = "", category = "") => request(`/contacts?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),
  createContact: (payload) => request("/contacts", { method: "POST", body: payload }),
  updateContact: (id, payload) => request(`/contacts/${id}`, { method: "PUT", body: payload }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: "DELETE" }),
  importContactsFromClients: () => request("/contacts/import-from-clients", { method: "POST" }),

  // --- Notifiche ---
  listNotifications: (unreadOnly = false) => request(`/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),
  updateNotificationPreferences: (payload) => request("/notifications/preferences", { method: "PUT", body: payload }),

  // --- Portale clienti: invito lato team ---
  invitePortalClient: (clientId, payload) => request(`/clients/${clientId}/portal-invite`, { method: "POST", body: payload }),
  revokePortalClient: (clientId) => request(`/clients/${clientId}/portal-invite`, { method: "DELETE" }),

  // --- Portale clienti: sessione del cliente finale (nessun token team) ---
  portalLogin: (payload) => request("/portal/login", { method: "POST", body: payload, auth: false }),
  portalMe: () => request("/portal/me", { auth: false, portalAuth: true }),
  portalTheme: () => request("/portal/theme", { auth: false, portalAuth: true }),
  portalAppointments: () => request("/portal/appointments", { auth: false, portalAuth: true }),
  portalCreateAppointment: (payload) => request("/portal/appointments", { method: "POST", body: payload, auth: false, portalAuth: true }),
  portalTasks: () => request("/portal/tasks", { auth: false, portalAuth: true }),

  // --- Integrazione Google Calendar ---
  googleCalendarStatus: () => request("/integrations/google-calendar/status"),
  googleCalendarAuthUrl: () => request("/integrations/google-calendar/auth-url"),
  googleCalendarDisconnect: () => request("/integrations/google-calendar", { method: "DELETE" }),
  googleCalendarSync: () => request("/integrations/google-calendar/sync", { method: "POST" }),

  // --- Abbonamenti (Fase 7) ---
  billingPlans: () => request("/billing/plans", { auth: false }),
  billingStatus: () => request("/billing/status"),
  billingCheckout: (plan, billingCycle) => request("/billing/checkout", { method: "POST", body: { plan, billing_cycle: billingCycle } }),
  billingPortal: () => request("/billing/portal", { method: "POST" }),

  // --- Chat interna team (stile Slack) ---
  listChatChannels: () => request("/chat/channels"),
  createChatChannel: (name) => request("/chat/channels", { method: "POST", body: { name } }),
  listChatMessages: (channelId, after = null) => request(`/chat/channels/${channelId}/messages${after ? `?after=${after}` : ""}`),
  sendChatMessage: (channelId, body) => request(`/chat/channels/${channelId}/messages`, { method: "POST", body: { body } }),

  // --- Chat agenzia-clienti (lato team) ---
  listClientChat: (clientId, after = null) => request(`/clients/${clientId}/chat${after ? `?after=${after}` : ""}`),
  sendClientChat: (clientId, body) => request(`/clients/${clientId}/chat`, { method: "POST", body: { body } }),

  // --- Chat agenzia-clienti (lato portale clienti) ---
  portalListChat: (after = null) => request(`/portal/chat${after ? `?after=${after}` : ""}`, { auth: false, portalAuth: true }),
  portalSendChat: (body) => request("/portal/chat", { method: "POST", body: { body }, auth: false, portalAuth: true }),

  // --- Documenti nella scheda cliente (lato team) ---
  listClientDocuments: (clientId) => request(`/clients/${clientId}/documents`),
  uploadClientDocument: (clientId, payload) => request(`/clients/${clientId}/documents`, { method: "POST", body: payload }),
  downloadClientDocument: (clientId, docId) => request(`/clients/${clientId}/documents/${docId}`),
  deleteClientDocument: (clientId, docId) => request(`/clients/${clientId}/documents/${docId}`, { method: "DELETE" }),

  // --- Documenti nella scheda cliente (lato portale clienti, sola lettura) ---
  portalListDocuments: () => request("/portal/documents", { auth: false, portalAuth: true }),
  portalDownloadDocument: (docId) => request(`/portal/documents/${docId}`, { auth: false, portalAuth: true }),

  // --- Gestionale contabilità (Fase 8) ---
  listAccounts: () => request("/accounting/accounts"),
  createAccount: (payload) => request("/accounting/accounts", { method: "POST", body: payload }),
  listJournalEntries: () => request("/accounting/journal-entries"),
  createJournalEntry: (payload) => request("/accounting/journal-entries", { method: "POST", body: payload }),
  listInvoices: () => request("/accounting/invoices"),
  createInvoice: (payload) => request("/accounting/invoices", { method: "POST", body: payload }),
  getInvoice: (id) => request(`/accounting/invoices/${id}`),
  issueInvoice: (id) => request(`/accounting/invoices/${id}/issue`, { method: "POST" }),
  markInvoicePaid: (id) => request(`/accounting/invoices/${id}/mark-paid`, { method: "POST" }),
  deleteInvoice: (id) => request(`/accounting/invoices/${id}`, { method: "DELETE" }),
  getBalanceSheet: (asOf) => request(`/accounting/reports/balance-sheet${asOf ? `?as_of=${asOf}` : ""}`),
  getIncomeStatement: (start, end) => request(`/accounting/reports/income-statement?start=${start}&end=${end}`),

  // --- Super Admin (platform_admin) ---
  platformAdminStats: () => request("/platform-admin/stats"),
  platformAdminListTenants: () => request("/platform-admin/tenants"),
  platformAdminTenantDetail: (id) => request(`/platform-admin/tenants/${id}`),
  platformAdminUpdateTenant: (id, payload) => request(`/platform-admin/tenants/${id}`, { method: "PUT", body: payload }),
  platformAdminSuspendTenant: (id) => request(`/platform-admin/tenants/${id}`, { method: "DELETE" }),
  platformAdminTenantUsers: (id) => request(`/platform-admin/tenants/${id}/users`),
  platformAdminCreateAdmin: (payload) => request("/platform-admin/admins", { method: "POST", body: payload }),
};

// --- Token separato per la sessione del portale clienti (non va mai mischiato
// con il token del team, altrimenti un cliente potrebbe vedere dati di altri clienti). ---
export function savePortalToken(token) {
  localStorage.setItem("nexushub_portal_token", token);
}
export function clearPortalToken() {
  localStorage.removeItem("nexushub_portal_token");
}
export function hasPortalToken() {
  return !!localStorage.getItem("nexushub_portal_token");
}

export function saveToken(token) {
  localStorage.setItem("nexushub_token", token);
}

export function clearToken() {
  localStorage.removeItem("nexushub_token");
}

export function hasToken() {
  return !!getToken();
}
