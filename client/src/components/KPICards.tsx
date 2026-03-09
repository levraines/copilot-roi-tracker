import type { DashboardKPIs } from "../../../shared/types";
import {
  Clock,
  DollarSign,
  Users,
  Bot,
  TrendingUp,
  Zap,
  Award,
  BarChart3,
} from "lucide-react";

interface Props {
  kpis: DashboardKPIs;
}

export function KPICards({ kpis }: Props) {
  const cards = [
    {
      label: "Total Time Saved",
      value: `${kpis.totalTimeSavedHours.toLocaleString()}h`,
      sub: `${Math.round(kpis.totalTimeSavedHours / 8)} working days`,
      icon: <Clock className="text-blue-600" size={24} />,
      color: "bg-blue-50",
    },
    {
      label: "Total Cost Savings",
      value: `$${kpis.totalMoneySaved.toLocaleString()}`,
      sub: `$${kpis.avgROIPerAgent.toLocaleString()} avg/agent`,
      icon: <DollarSign className="text-green-600" size={24} />,
      color: "bg-green-50",
    },
    {
      label: "FTEs Saved",
      value: kpis.totalFTEsSaved.toLocaleString(),
      sub: "Full-time equivalents",
      icon: <Users className="text-purple-600" size={24} />,
      color: "bg-purple-50",
    },
    {
      label: "Total Agent Uses",
      value: kpis.totalUsageCount.toLocaleString(),
      sub: `${kpis.activeAgents} of ${kpis.totalAgents} agents active`,
      icon: <Zap className="text-amber-600" size={24} />,
      color: "bg-amber-50",
    },
    {
      label: "Top Performing Agent",
      value: kpis.topAgent,
      sub: "Highest total savings",
      icon: <Award className="text-rose-600" size={24} />,
      color: "bg-rose-50",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{c.label}</span>
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center`}>
              {c.icon}
            </div>
          </div>
          <p className={`font-bold ${c.isText ? "text-lg" : "text-2xl"} text-gray-900 mt-1`}>
            {c.value}
          </p>
          <p className="text-xs text-gray-400">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
