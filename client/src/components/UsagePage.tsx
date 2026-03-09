import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, Activity } from "lucide-react";

export function UsagePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    agentId: "",
    actionBenchmarkId: "",
    userId: "",
    userName: "",
    actualAgentTimeMinutes: "",
    overrideTimeSavedMinutes: "",
    notes: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [a, b, u] = await Promise.all([
      api.getAgents(),
      api.getBenchmarks(),
      api.getUsage({ limit: 100 }),
    ]);
    setAgents(a);
    setBenchmarks(b);
    setUsage(u);
    setLoading(false);
  }

  async function handleRecord() {
    await api.recordUsage({
      agentId: form.agentId,
      actionBenchmarkId: form.actionBenchmarkId,
      userId: form.userId || "manual-entry",
      userName: form.userName || "Manual Entry",
      actualAgentTimeMinutes: form.actualAgentTimeMinutes ? Number(form.actualAgentTimeMinutes) : undefined,
      overrideTimeSavedMinutes: form.overrideTimeSavedMinutes ? Number(form.overrideTimeSavedMinutes) : undefined,
      notes: form.notes || undefined,
    });
    setShowForm(false);
    setForm({ agentId: "", actionBenchmarkId: "", userId: "", userName: "", actualAgentTimeMinutes: "", overrideTimeSavedMinutes: "", notes: "" });
    const u = await api.getUsage({ limit: 100 });
    setUsage(u);
  }

  const filteredBenchmarks = form.agentId
    ? benchmarks.filter((b: any) => b.agentId === form.agentId)
    : benchmarks;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usage Log</h1>
          <p className="text-gray-500 mt-1">Record and view agent usage events</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={16} /> Record Usage
        </button>
      </div>

      {/* Record Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Record Agent Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
              <select
                className="input-field"
                value={form.agentId}
                onChange={(e) => setForm({ ...form, agentId: e.target.value, actionBenchmarkId: "" })}
              >
                <option value="">Select agent...</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                className="input-field"
                value={form.actionBenchmarkId}
                onChange={(e) => setForm({ ...form, actionBenchmarkId: e.target.value })}
              >
                <option value="">Select action...</option>
                {filteredBenchmarks.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.actionName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
              <input
                className="input-field"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                placeholder="Who used the agent?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Agent Time (min) <span className="text-gray-400">(optional override)</span>
              </label>
              <input
                type="number"
                className="input-field"
                value={form.actualAgentTimeMinutes}
                onChange={(e) => setForm({ ...form, actualAgentTimeMinutes: e.target.value })}
                placeholder="Leave empty to use benchmark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Override Time Saved (min) <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                className="input-field"
                value={form.overrideTimeSavedMinutes}
                onChange={(e) => setForm({ ...form, overrideTimeSavedMinutes: e.target.value })}
                placeholder="Override calculated savings"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                className="input-field"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary" onClick={handleRecord} disabled={!form.agentId || !form.actionBenchmarkId}>
              Record
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Usage Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Timestamp</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Agent</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Manual (min)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Agent (min)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Saved (min)</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u: any) => {
                const saved = u.overrideTimeSavedMinutes ??
                  (u.manualTimeMinutes - (u.actualAgentTimeMinutes ?? u.agentTimeMinutes));
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(u.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium flex items-center gap-1.5">
                      <Activity size={14} className="text-brand-500" />
                      {u.agentName}
                    </td>
                    <td className="py-3 px-4">{u.actionName}</td>
                    <td className="py-3 px-4 text-gray-600">{u.userName}</td>
                    <td className="py-3 px-4 text-right text-amber-700">{u.manualTimeMinutes}</td>
                    <td className="py-3 px-4 text-right">{u.actualAgentTimeMinutes ?? u.agentTimeMinutes}</td>
                    <td className="py-3 px-4 text-right font-medium text-green-700">{saved}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {usage.length === 0 && (
            <div className="py-12 text-center text-gray-400">No usage records yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
