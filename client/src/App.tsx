import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { AgentsPage } from "./components/AgentsPage";
import { BenchmarksPage } from "./components/BenchmarksPage";
import { SettingsPage } from "./components/SettingsPage";
import { UsagePage } from "./components/UsagePage";
import {
  LayoutDashboard,
  Bot,
  Timer,
  Activity,
  Settings,
  TrendingUp,
} from "lucide-react";

type Page = "dashboard" | "agents" | "benchmarks" | "usage" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const nav: { key: Page; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { key: "agents", label: "Agents", icon: <Bot size={20} /> },
    { key: "benchmarks", label: "Benchmarks", icon: <Timer size={20} /> },
    { key: "usage", label: "Usage Log", icon: <Activity size={20} /> },
    { key: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <TrendingUp className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Agent ROI</h1>
              <p className="text-xs text-gray-500">Copilot Tracker</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === item.key
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            v1.0.0 • Copilot Agent ROI Tracker
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {page === "dashboard" && <Dashboard />}
        {page === "agents" && <AgentsPage />}
        {page === "benchmarks" && <BenchmarksPage />}
        {page === "usage" && <UsagePage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
