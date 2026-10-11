const API_BASE = "/api";
const DIRECT_API = "http://localhost:8001/api";

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = `Request failed: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) errorDetail = errJson.detail;
      } catch (_) {}
      throw new Error(errorDetail);
    }

    return response.json();
  } catch (err) {
    // Fallback to direct backend URL if proxy fails or returns network error
    try {
      const directResponse = await fetch(`${DIRECT_API}${endpoint}`, {
        ...options,
        headers,
      });

      if (!directResponse.ok) {
        let errorDetail = `Request failed: ${directResponse.statusText}`;
        try {
          const errJson = await directResponse.json();
          if (errJson.detail) errorDetail = errJson.detail;
        } catch (_) {}
        throw new Error(errorDetail);
      }

      return directResponse.json();
    } catch (directErr) {
      throw new Error(err.message || directErr.message || "Failed to connect to backend server");
    }
  }
}

export const api = {
  getHealth: () => apiRequest("/health"),
  getScenarios: () => apiRequest("/scenarios"),
  traceAddress: (address, max_depth = 2, victim_report_id = null) =>
    apiRequest("/trace", {
      method: "POST",
      body: JSON.stringify({ address, max_depth, victim_report_id }),
    }),
  createVictimReport: (data) =>
    apiRequest("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getReports: () => apiRequest("/reports"),
  getReportById: (id) => apiRequest(`/reports/${id}`),
  createFreezeNotice: (data) =>
    apiRequest("/freeze-notice", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getFreezeNotices: () => apiRequest("/freeze-notices"),
  getVaspDirectory: (query = "") =>
    apiRequest(`/vasp/directory${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  getStats: () => apiRequest("/stats"),
};
