import { useEffect, useState } from "react";
import { api } from "../api";
import type { DashboardData } from "../../../shared/types";
import { KPICards } from "./KPICards";
import { TimeSavingsChart } from "./charts/TimeSavingsChart";
import { AgentBreakdownChart } from "./charts/AgentBreakdownChart";
import { SourcePieChart } from "./charts/SourcePieChart";
import { TopActionsTable } from "./TopActionsTable";
import { Calendar, Download } from "lucide-react";

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "ytd" | "all">("30d");

  useEffect(() => {
    load();
  }, [dateRange]);

  async function load() {
    setLoading(true);
    try {
      const now = new Date();
      let from: string | undefined;
      if (dateRange === "7d") from = new Date(now.getTime() - 7 * 86400000).toISOString();
      else if (dateRange === "30d") from = new Date(now.getTime() - 30 * 86400000).toISOString();
      else if (dateRange === "90d") from = new Date(now.getTime() - 90 * 86400000).toISOString();
      else if (dateRange === "ytd") from = new Date(now.getFullYear(), 0, 1).toISOString();
      // "all" = no from

      const d = await api.getDashboard(from, now.toISOString());
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-red-500">Failed to load dashboard data.</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-500 mt-1">Agent ROI & Time Savings Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {(["7d", "30d", "90d", "ytd", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dateRange === r ? "bg-brand-600 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {r === "ytd" ? "YTD" : r === "all" ? "All" : r.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="btn-secondary flex items-center gap-2" title="Export Report">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards kpis={data.kpis} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-900 mb-4">Time & Cost Savings Trend</h3>
          <TimeSavingsChart data={data.timeSeries} />
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Savings by Platform</h3>
          <SourcePieChart data={data.usageBySource} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Agent Performance Breakdown</h3>
          <AgentBreakdownChart data={data.agentSummaries} />
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Top Time-Saving Actions</h3>
          <TopActionsTable actions={data.topActions} />
        </div>
      </div>

      {/* Agent Summary Table */}
      <div className="card mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Agent Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Agent</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Source</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Uses</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Users</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Hours Saved</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">$ Saved</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Avg Min/Use</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Top Action</th>
              </tr>
            </thead>
            <tbody>
              {data.agentSummaries.map((a) => (
                <tr key={a.agentId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{a.agentName}</td>
                  <td className="py-3 px-4">
                    <SourceBadge source={a.agentSource} />
                  </td>
                  <td className="py-3 px-4 text-right">{a.totalUsageCount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{a.uniqueUsers}</td>
                  <td className="py-3 px-4 text-right font-medium text-green-700">
                    {a.totalTimeSavedHours.toLocaleString()}h
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-green-700">
                    ${a.totalMoneySaved.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">{a.avgTimeSavedPerUse} min</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-[200px]">{a.topAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    "copilot-studio": { label: "Copilot Studio", cls: "badge-blue" },
    "m365-copilot": { label: "M365 Copilot", cls: "badge-green" },
    "azure-foundry": { label: "Azure AI Foundry", cls: "badge-purple" },
  };
  const info = map[source] || { label: source, cls: "badge" };
  return <span className={info.cls}>{info.label}</span>;
}
