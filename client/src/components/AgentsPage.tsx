import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, Trash2, Edit2, Bot, Check, X, Search, RefreshCw, Plug, Wifi, WifiOff, AlertCircle } from "lucide-react";

const PLATFORM_OPTIONS = [
  { value: "copilot-studio", label: "Copilot Studio" },
  { value: "m365-copilot", label: "M365 Copilot" },
  { value: "azure-foundry", label: "Azure AI Foundry" },
];

const AGENT_TYPE_OPTIONS = [
  { value: "declarative", label: "Declarative" },
  { value: "custom", label: "Custom" },
  { value: "built-in", label: "Built-in" },
  { value: "orchestrated", label: "Orchestrated" },
];

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    "copilot-studio": { label: "Copilot Studio", cls: "badge-blue" },
    "m365-copilot": { label: "M365 Copilot", cls: "badge-green" },
    "azure-foundry": { label: "Azure AI Foundry", cls: "badge-purple" },
  };
  const info = map[platform] || { label: platform, cls: "badge" };
  return <span className={info.cls}>{info.label}</span>;
}

function AgentTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    declarative: "bg-sky-100 text-sky-700",
    custom: "bg-amber-100 text-amber-700",
    "built-in": "bg-gray-100 text-gray-700",
    orchestrated: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[type] || "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}

export function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  // Environment form
  const [showEnvForm, setShowEnvForm] = useState(false);
  const [envForm, setEnvForm] = useState({
    platform: "copilot-studio",
    name: "",
    tenantId: "",
    clientId: "",
    clientSecret: "",
    environmentId: "",
  });

  // Manual agent form
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState({
    name: "",
    description: "",
    source: "copilot-studio",
    agentType: "custom",
    externalId: "",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [agentsData, envsData] = await Promise.all([
      api.getAgents(),
      api.getEnvironments(),
    ]);
    setAgents(agentsData);
    setEnvironments(envsData);
    setLoading(false);
  }

  // ---- Environment Actions ----

  async function handleSaveEnv() {
    await api.createEnvironment(envForm);
    setShowEnvForm(false);
    setEnvForm({ platform: "copilot-studio", name: "", tenantId: "", clientId: "", clientSecret: "", environmentId: "" });
    load();
  }

  async function handleDeleteEnv(id: string) {
    if (confirm("Remove this environment connection?")) {
      await api.deleteEnvironment(id);
      load();
    }
  }

  async function handleScan(envId: string) {
    setScanning(envId);
    setScanResult(null);
    try {
      const result = await api.scanEnvironment(envId);
      setScanResult(result);
      load();
    } catch (e: any) {
      setScanResult({ errors: [e.message] });
    } finally {
      setScanning(null);
    }
  }

  async function handleScanAll() {
    for (const env of environments) {
      await handleScan(env.id);
    }
  }

  // ---- Agent Actions ----

  async function handleSaveAgent() {
    if (editingId) {
      await api.updateAgent(editingId, agentForm);
    } else {
      await api.createAgent(agentForm);
    }
    setShowAgentForm(false);
    setEditingId(null);
    setAgentForm({ name: "", description: "", source: "copilot-studio", agentType: "custom", externalId: "" });
    load();
  }

  async function handleDeleteAgent(id: string) {
    if (confirm("Delete this agent and all related data?")) {
      await api.deleteAgent(id);
      load();
    }
  }

  function startEditAgent(agent: any) {
    setAgentForm({
      name: agent.name,
      description: agent.description,
      source: agent.source,
      agentType: agent.agentType || "custom",
      externalId: agent.externalId || "",
    });
    setEditingId(agent.id);
    setShowAgentForm(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-gray-500 mt-1">
            Connect Microsoft environments to auto-discover agents, or register them manually
          </p>
        </div>
        <div className="flex gap-2">
          {environments.length > 0 && (
            <button className="btn-primary flex items-center gap-2" onClick={handleScanAll}>
              <Search size={16} /> Scan All Environments
            </button>
          )}
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => {
              setAgentForm({ name: "", description: "", source: "copilot-studio", agentType: "custom", externalId: "" });
              setEditingId(null);
              setShowAgentForm(true);
            }}
          >
            <Plus size={16} /> Add Manually
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Connected Environments                                       */}
      {/* ============================================================ */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Plug size={18} className="text-brand-600" /> Connected Environments
          </h3>
          <button
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            onClick={() => setShowEnvForm(!showEnvForm)}
          >
            <Plus size={14} /> Add Environment
          </button>
        </div>

        {/* Add environment form */}
        {showEnvForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <h4 className="font-medium text-sm mb-3">Connect New Environment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
                <select
                  className="input-field text-sm"
                  value={envForm.platform}
                  onChange={(e) => setEnvForm({ ...envForm, platform: e.target.value })}
                >
                  {PLATFORM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
                <input
                  className="input-field text-sm"
                  value={envForm.name}
                  onChange={(e) => setEnvForm({ ...envForm, name: e.target.value })}
                  placeholder="e.g., Production - Copilot Studio"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tenant ID</label>
                <input
                  className="input-field text-sm font-mono"
                  value={envForm.tenantId}
                  onChange={(e) => setEnvForm({ ...envForm, tenantId: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client ID (App Registration)</label>
                <input
                  className="input-field text-sm font-mono"
                  value={envForm.clientId}
                  onChange={(e) => setEnvForm({ ...envForm, clientId: e.target.value })}
                  placeholder="App Registration Client ID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client Secret</label>
                <input
                  type="password"
                  className="input-field text-sm font-mono"
                  value={envForm.clientSecret}
                  onChange={(e) => setEnvForm({ ...envForm, clientSecret: e.target.value })}
                  placeholder="Client Secret"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {envForm.platform === "copilot-studio"
                    ? "Power Platform Environment ID"
                    : envForm.platform === "azure-foundry"
                    ? "Azure Resource Group Path"
                    : "Environment Identifier (optional)"}
                </label>
                <input
                  className="input-field text-sm font-mono"
                  value={envForm.environmentId}
                  onChange={(e) => setEnvForm({ ...envForm, environmentId: e.target.value })}
                  placeholder={
                    envForm.platform === "copilot-studio"
                      ? "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      : envForm.platform === "azure-foundry"
                      ? "/subscriptions/.../resourceGroups/..."
                      : "optional"
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn-primary text-sm" onClick={handleSaveEnv}>Connect</button>
              <button className="btn-secondary text-sm" onClick={() => setShowEnvForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Environment list */}
        {environments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Plug size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No environments connected yet.</p>
            <p className="text-xs mt-1">
              Click "Add Environment" to connect your Copilot Studio, M365 Copilot, or Azure AI Foundry tenants.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {environments.map((env) => (
              <div
                key={env.id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {env.status === "connected" ? (
                    <Wifi size={16} className="text-green-500" />
                  ) : env.status === "error" ? (
                    <AlertCircle size={16} className="text-red-500" />
                  ) : (
                    <WifiOff size={16} className="text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{env.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformBadge platform={env.platform} />
                      {env.agentsFound != null && (
                        <span className="text-xs text-gray-400">{env.agentsFound} agents found</span>
                      )}
                      {env.lastScanAt && (
                        <span className="text-xs text-gray-400">
                          Last scan: {new Date(env.lastScanAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {env.error && (
                      <p className="text-xs text-red-500 mt-1">{env.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3"
                    onClick={() => handleScan(env.id)}
                    disabled={scanning === env.id}
                  >
                    {scanning === env.id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Search size={12} />
                    )}
                    {scanning === env.id ? "Scanning..." : "Scan"}
                  </button>
                  <button
                    className="p-1.5 hover:bg-red-50 rounded"
                    onClick={() => handleDeleteEnv(env.id)}
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scan result toast */}
        {scanResult && (
          <div
            className={`mt-3 p-3 rounded-lg text-sm ${
              scanResult.errors?.length
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {scanResult.errors?.length ? (
              <p>Scan error: {scanResult.errors[0]}</p>
            ) : (
              <p>
                Scan complete - found <strong>{scanResult.agentsFound}</strong> agents
                ({scanResult.agentsCreated} new, {scanResult.agentsUpdated} updated)
              </p>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Manual Agent Form                                            */}
      {/* ============================================================ */}
      {showAgentForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">{editingId ? "Edit Agent" : "Register Agent Manually"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="input-field"
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                placeholder="e.g., LinkedIn Post Generator"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                className="input-field"
                value={agentForm.source}
                onChange={(e) => setAgentForm({ ...agentForm, source: e.target.value })}
              >
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Type</label>
              <select
                className="input-field"
                value={agentForm.agentType}
                onChange={(e) => setAgentForm({ ...agentForm, agentType: e.target.value })}
              >
                {AGENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External ID <span className="text-gray-400">(optional)</span>
              </label>
              <input
                className="input-field"
                value={agentForm.externalId}
                onChange={(e) => setAgentForm({ ...agentForm, externalId: e.target.value })}
                placeholder="Bot ID or App ID"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input-field"
                rows={2}
                value={agentForm.description}
                onChange={(e) => setAgentForm({ ...agentForm, description: e.target.value })}
                placeholder="What does this agent do?"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary" onClick={handleSaveAgent}>
              {editingId ? "Update" : "Create"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowAgentForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Agents Table                                                 */}
      {/* ============================================================ */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            All Agents <span className="text-gray-400 font-normal text-sm ml-1">({agents.length})</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Platform</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Source</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">External ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium flex items-center gap-2">
                    <Bot size={16} className="text-brand-600 shrink-0" />
                    <span className="truncate max-w-[180px]">{a.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <PlatformBadge platform={a.source} />
                  </td>
                  <td className="py-3 px-4">
                    <AgentTypeBadge type={a.agentType || "custom"} />
                  </td>
                  <td className="py-3 px-4">
                    {a.autoDiscovered ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Search size={12} /> Auto-discovered
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Manual</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 font-mono text-xs truncate max-w-[140px]">
                    {a.externalId || "\u2014"}
                  </td>
                  <td className="py-3 px-4">
                    {a.enabled ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check size={14} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <X size={14} /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-1 hover:bg-gray-100 rounded" onClick={() => startEditAgent(a)}>
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-red-50 rounded ml-1" onClick={() => handleDeleteAgent(a.id)}>
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {agents.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No agents yet.</p>
            <p className="text-xs mt-1">Connect an environment and scan, or add agents manually.</p>
          </div>
        )}
      </div>
    </div>
  );
}
