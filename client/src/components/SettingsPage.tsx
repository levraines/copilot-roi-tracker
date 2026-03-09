import { useEffect, useState } from "react";
import { api } from "../api";
import { Save, RefreshCw } from "lucide-react";

export function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const s = await api.getSettings();
    setSettings(s);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await api.updateSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Configure global defaults for ROI calculations</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? "Saved ✓" : "Save Settings"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Organization */}
        <div className="card">
          <h3 className="font-semibold mb-4">Organization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                className="input-field"
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start Month</label>
              <select
                className="input-field"
                value={settings.fiscalYearStartMonth}
                onChange={(e) => setSettings({ ...settings, fiscalYearStartMonth: Number(e.target.value) })}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="card">
          <h3 className="font-semibold mb-4">Financial Defaults</h3>
          <p className="text-sm text-gray-500 mb-4">
            These values are used as defaults when calculating ROI. Individual benchmarks can override the hourly rate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Hourly Rate ({settings.currencySymbol})
              </label>
              <input
                type="number"
                className="input-field"
                value={settings.defaultHourlyRate}
                onChange={(e) => setSettings({ ...settings, defaultHourlyRate: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-400 mt-1">Average cost per hour of employee time</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
              <input
                className="input-field"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
              <input
                className="input-field"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                placeholder="$"
              />
            </div>
          </div>
        </div>

        {/* Work Schedule */}
        <div className="card">
          <h3 className="font-semibold mb-4">Work Schedule</h3>
          <p className="text-sm text-gray-500 mb-4">
            Used to calculate FTEs (full-time equivalents) saved.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours per Day</label>
              <input
                type="number"
                className="input-field"
                value={settings.workingHoursPerDay}
                onChange={(e) => setSettings({ ...settings, workingHoursPerDay: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Working Days per Month</label>
              <input
                type="number"
                className="input-field"
                value={settings.workingDaysPerMonth}
                onChange={(e) => setSettings({ ...settings, workingDaysPerMonth: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            📊 Monthly capacity: <strong>{settings.workingHoursPerDay * settings.workingDaysPerMonth} hours</strong> per FTE
            ({settings.workingHoursPerDay}h × {settings.workingDaysPerMonth} days)
          </div>
        </div>

        {/* Connector Info */}
        <div className="card">
          <h3 className="font-semibold mb-4">Microsoft Platform Connections</h3>
          <p className="text-sm text-gray-500 mb-4">
            Environment connections are managed from the <strong>Agents</strong> page. Below are the three supported Microsoft platforms.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Copilot Studio</p>
                <p className="text-xs text-gray-500">Power Platform API — auto-discovers bots from your environments</p>
              </div>
              <span className="badge-blue">Supported</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Microsoft 365 Copilot</p>
                <p className="text-xs text-gray-500">Graph API — discovers M365 Copilot agents and built-in capabilities</p>
              </div>
              <span className="badge-green">Supported</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Azure AI Foundry</p>
                <p className="text-xs text-gray-500">Azure Management API — discovers deployed AI endpoints and orchestrated agents</p>
              </div>
              <span className="badge-purple">Supported</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Go to the Agents page → "Add Environment" to connect your Azure AD app registration and start auto-discovering agents.
          </p>
        </div>
      </div>
    </div>
  );
}
