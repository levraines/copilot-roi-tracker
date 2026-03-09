import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { AgentPlatform } from "../../../../shared/types";

interface SourceData {
  source: AgentPlatform;
  count: number;
  timeSaved: number;
  moneySaved: number;
}

interface Props {
  data: SourceData[];
}

const COLORS: Record<string, string> = {
  "copilot-studio": "#3b82f6",
  "m365-copilot": "#10b981",
  "azure-foundry": "#8b5cf6",
};

const LABELS: Record<string, string> = {
  "copilot-studio": "Copilot Studio",
  "m365-copilot": "M365 Copilot",
  "azure-foundry": "Azure AI Foundry",
};

export function SourcePieChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">No data</div>;
  }

  const formatted = data.map((d) => ({
    name: LABELS[d.source] || d.source,
    value: d.moneySaved,
    count: d.count,
    color: COLORS[d.source] || "#6b7280",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {formatted.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Savings"]}
        />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}
