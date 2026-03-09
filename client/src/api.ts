const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return request<any>(`/dashboard${qs ? `?${qs}` : ""}`);
  },

  // Agents
  getAgents: () => request<any[]>("/agents"),
  getAgent: (id: string) => request<any>(`/agents/${id}`),
  createAgent: (data: any) =>
    request<any>("/agents", { method: "POST", body: JSON.stringify(data) }),
  updateAgent: (id: string, data: any) =>
    request<any>(`/agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAgent: (id: string) =>
    request<any>(`/agents/${id}`, { method: "DELETE" }),

  // Benchmarks
  getBenchmarks: (agentId?: string) => {
    const qs = agentId ? `?agentId=${agentId}` : "";
    return request<any[]>(`/benchmarks${qs}`);
  },
  createBenchmark: (data: any) =>
    request<any>("/benchmarks", { method: "POST", body: JSON.stringify(data) }),
  updateBenchmark: (id: string, data: any) =>
    request<any>(`/benchmarks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBenchmark: (id: string) =>
    request<any>(`/benchmarks/${id}`, { method: "DELETE" }),

  // Usage
  getUsage: (params?: { agentId?: string; from?: string; to?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.agentId) qs.set("agentId", params.agentId);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<any[]>(`/usage${q ? `?${q}` : ""}`);
  },
  recordUsage: (data: any) =>
    request<any>("/usage", { method: "POST", body: JSON.stringify(data) }),
  bulkRecordUsage: (data: any[]) =>
    request<any>("/usage/bulk", { method: "POST", body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request<any>("/settings"),
  updateSettings: (data: any) =>
    request<any>("/settings", { method: "PUT", body: JSON.stringify(data) }),

  // Environments
  getEnvironments: () => request<any[]>("/environments"),
  createEnvironment: (data: any) =>
    request<any>("/environments", { method: "POST", body: JSON.stringify(data) }),
  updateEnvironment: (id: string, data: any) =>
    request<any>(`/environments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEnvironment: (id: string) =>
    request<any>(`/environments/${id}`, { method: "DELETE" }),
  scanEnvironment: (id: string) =>
    request<any>(`/environments/${id}/scan`, { method: "POST" }),
};
