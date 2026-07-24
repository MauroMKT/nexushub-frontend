const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("nexushub_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
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

  listClients: () => request("/clients"),
  createClient: (payload) => request("/clients", { method: "POST", body: payload }),
  updateClient: (id, payload) => request(`/clients/${id}`, { method: "PUT", body: payload }),
  deleteClient: (id) => request(`/clients/${id}`, { method: "DELETE" }),

  listStages: () => request("/pipeline/stages"),
  listDeals: () => request("/pipeline/deals"),
  createDeal: (payload) => request("/pipeline/deals", { method: "POST", body: payload }),
  moveDeal: (id, stageId) => request(`/pipeline/deals/${id}/move`, { method: "PATCH", body: { stage_id: stageId } }),

  listAppointments: () => request("/appointments"),
  createAppointment: (payload) => request("/appointments", { method: "POST", body: payload }),

  listTasks: () => request("/tasks"),
  createTask: (payload) => request("/tasks", { method: "POST", body: payload }),
  updateTask: (id, payload) => request(`/tasks/${id}`, { method: "PUT", body: payload }),

  dashboardSummary: () => request("/dashboard/summary"),

  listTeam: () => request("/team"),
  inviteTeamMember: (payload) => request("/team", { method: "POST", body: payload }),
  getTenantSettings: () => request("/settings/tenant"),
  updateTenantSettings: (payload) => request("/settings/tenant", { method: "PUT", body: payload }),
};

export function saveToken(token) {
  localStorage.setItem("nexushub_token", token);
}

export function clearToken() {
  localStorage.removeItem("nexushub_token");
}

export function hasToken() {
  return !!getToken();
}
