const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Shared fetch wrapper with credentials (for cookies).
 */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  let res;

  try {
    res = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        ...options.headers,
      },
    });
  } catch (netErr) {
    console.error("Network / Fetch Exception:", netErr);
    throw new Error(
      "Unable to connect to KuralAI server. Please verify that the backend server is running."
    );
  }

  // 204 No Content handling
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Server error (${res.status}). Please try again.`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ---- Auth ----

export const authAPI = {
  signup: (body) =>
    apiFetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  login: (body) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(typeof body === "object" ? body : { email: arguments[0], password: arguments[1] }),
    }),

  getDepartments: () =>
    apiFetch("/api/auth/departments"),

  logout: () =>
    apiFetch("/api/auth/logout", { method: "POST" }),

  me: () =>
    apiFetch("/api/auth/me"),

  updateProfile: (body) =>
    apiFetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  selectDemoDepartment: (body) =>
    apiFetch("/api/auth/demo/select-department", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  health: () =>
    apiFetch("/api/health"),
};

// ---- Complaints ----

export const complaintsAPI = {
  submit: ({ text, language, photo, lat, lng }) => {
    const form = new FormData();
    form.append("text", text || "");
    form.append("language", language || "en");
    if (photo) form.append("photo", photo);
    if (lat) form.append("lat", lat);
    if (lng) form.append("lng", lng);

    return apiFetch("/api/complaints", {
      method: "POST",
      body: form,
    });
  },

  list: () =>
    apiFetch("/api/complaints"),

  getAll: () =>
    apiFetch("/api/complaints"),

  get: (id) =>
    apiFetch(`/api/complaints/${id}`),

  getById: (id) =>
    apiFetch(`/api/complaints/${id}`),

  stats: () =>
    apiFetch("/api/complaints/stats"),

  logs: (id) =>
    apiFetch(`/api/complaints/${id}/log`),

  getLogs: (id) =>
    apiFetch(`/api/complaints/${id}/log`),

  track: (id) =>
    apiFetch(`/api/complaints/track/${id}`),
};

export const complaintAPI = complaintsAPI;

// ---- Voice ----

export const voiceAPI = {
  transcribe: async ({ audio, language }) => {
    const form = new FormData();
    form.append("audio", audio, "voice.wav");
    form.append("language", language);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const data = await apiFetch("/api/voice/transcribe", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      return data.text;
    } finally {
      clearTimeout(timer);
    }
  },
};

// ---- Officer Portal ----

export const officerAPI = {
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/officer/complaints${query ? `?${query}` : ""}`);
  },

  getComplaint: (id) =>
    apiFetch(`/api/officer/complaints/${id}`),

  updateStatus: (id, { status, note }) =>
    apiFetch(`/api/officer/complaints/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    }),

  addNote: (id, text) =>
    apiFetch(`/api/officer/complaints/${id}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }),

  getStats: () =>
    apiFetch("/api/officer/stats"),
};

// ---- Admin Portal ----

export const adminAPI = {
  getStats: () =>
    apiFetch("/api/admin/stats"),

  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/complaints${query ? `?${query}` : ""}`);
  },

  updateComplaintStatus: (id, { status, note }) =>
    apiFetch(`/api/admin/complaints/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    }),

  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/users${query ? `?${query}` : ""}`);
  },

  updateUserRole: (id, { role, departmentId }) =>
    apiFetch(`/api/admin/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, departmentId }),
    }),

  updateUserStatus: (id, isActive) =>
    apiFetch(`/api/admin/users/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    }),

  getDepartments: () =>
    apiFetch("/api/admin/departments"),

  createDepartment: (body) =>
    apiFetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  updateDepartment: (id, body) =>
    apiFetch(`/api/admin/departments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/audit-logs${query ? `?${query}` : ""}`);
  },
};

// ---- Legacy exports for backward compatibility ----

export const submitComplaint = ({ text, language, photo }) =>
  complaintsAPI.submit({ text, language, photo });

export const transcribeVoice = ({ audio, language }) =>
  voiceAPI.transcribe({ audio, language });

