import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, Trash2, Edit2, Timer } from "lucide-react";

export function BenchmarksPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterAgent, setFilterAgent] = useState("");
  const [form, setForm] = useState({
    agentId: "",
    actionName: "",
    description: "",
    manualTimeMinutes: 30,
    agentTimeMinutes: 3,
    customHourlyRate: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadBenchmarks();
  }, [filterAgent]);

  async function loadAll() {
    const [a, b] = await Promise.all([api.getAgents(), api.getBenchmarks()]);
    setAgents(a);
    setBenchmarks(b);
    setLoading(false);
  }

  async function loadBenchmarks() {
    const b = await api.getBenchmarks(filterAgent || undefined);
    setBenchmarks(b);
  }

  async function handleSave() {
    const data = {
      ...form,
      manualTimeMinutes: Number(form.manualTimeMinutes),
      agentTimeMinutes: Number(form.agentTimeMinutes),
      customHourlyRate: form.customHourlyRate ? Number(form.customHourlyRate) : undefined,
    };
    if (editingId) {
      await api.updateBenchmark(editingId, data);
    } else {
      await api.createBenchmark(data);
    }
    setShowForm(false);
    setEditingId(null);
    resetForm();
    loadBenchmarks();
  }

  function resetForm() {
    setForm({ agentId: "", actionName: "", description: "", manualTimeMinutes: 30, agentTimeMinutes: 3, customHourlyRate: "" });
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this benchmark?")) {
      await api.deleteBenchmark(id);
      loadBenchmarks();
    }
  }

  function startEdit(b: any) {
    setForm({
      agentId: b.agentId,
      actionName: b.actionName,
      description: b.description,
      manualTimeMinutes: b.manualTimeMinutes,
      agentTimeMinutes: b.agentTimeMinutes,
      customHourlyRate: b.customHourlyRate || "",
    });
    setEditingId(b.id);
    setShowForm(true);
  }

  const agentName = (id: string) => agents.find((a) => a.id === id)?.name || "Unknown";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Action Benchmarks</h1>
          <p className="text-gray-500 mt-1">
            Define standard times for manual work vs. agent-assisted work
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}
        >
          <Plus size={16} /> Add Benchmark
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          className="input-field max-w-xs"
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
        >
          <option value="">All Agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">{editingId ? "Edit Benchmark" : "New Benchmark"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
              <select
                className="input-field"
                value={form.agentId}
                onChange={(e) => setForm({ ...form, agentId: e.target.value })}
              >
                <option value="">Select agent...</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Name</label>
              <input
                className="input-field"
                value={form.actionName}
                onChange={(e) => setForm({ ...form, actionName: e.target.value })}
                placeholder="e.g., Read JD & Write LinkedIn Post"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input-field"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manual Time (minutes) — <span className="text-amber-600">without agent</span>
              </label>
              <input
                type="number"
                className="input-field"
                value={form.manualTimeMinutes}
                onChange={(e) => setForm({ ...form, manualTimeMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent Time (minutes) — <span className="text-green-600">with agent</span>
              </label>
              <input
                type="number"
                className="input-field"
                value={form.agentTimeMinutes}
                onChange={(e) => setForm({ ...form, agentTimeMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Hourly Rate ($) <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                className="input-field"
                value={form.customHourlyRate}
                onChange={(e) => setForm({ ...form, customHourlyRate: e.target.value })}
                placeholder="Uses global rate if empty"
              />
            </div>
          </div>
          <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-800">
            ⏱️ Time saved per use: <strong>{Number(form.manualTimeMinutes) - Number(form.agentTimeMinutes)} minutes</strong>
            {" "}({Math.round(((Number(form.manualTimeMinutes) - Number(form.agentTimeMinutes)) / Number(form.manualTimeMinutes)) * 100)}% reduction)
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary" onClick={handleSave}>
              {editingId ? "Update" : "Create"}
            </button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Agent</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Manual (min)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">With Agent (min)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Saved (min)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Reduction</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Rate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b) => {
                const saved = b.manualTimeMinutes - b.agentTimeMinutes;
                const pct = Math.round((saved / b.manualTimeMinutes) * 100);
                return (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <Timer size={14} className="text-brand-500" />
                      {b.actionName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{agentName(b.agentId)}</td>
                    <td className="py-3 px-4 text-right text-amber-700">{b.manualTimeMinutes}</td>
                    <td className="py-3 px-4 text-right text-green-700">{b.agentTimeMinutes}</td>
                    <td className="py-3 px-4 text-right font-medium text-green-700">{saved}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`badge ${pct >= 80 ? "bg-green-100 text-green-800" : pct >= 50 ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {b.customHourlyRate ? `$${b.customHourlyRate}/h` : "Default"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => startEdit(b)}>
                        <Edit2 size={14} className="text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-red-50 rounded ml-1" onClick={() => handleDelete(b.id)}>
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {benchmarks.length === 0 && (
            <div className="py-12 text-center text-gray-400">No benchmarks. Add one to start tracking time savings.</div>
          )}
        </div>
      )}
    </div>
  );
}
