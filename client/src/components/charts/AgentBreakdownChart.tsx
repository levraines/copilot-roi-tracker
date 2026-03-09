import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AgentROISummary } from "../../../../shared/types";

interface Props {
  data: AgentROISummary[];
}

export function AgentBreakdownChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">No data</div>;
  }

  const formatted = data
    .filter((d) => d.totalUsageCount > 0)
    .map((d) => ({
      name: d.agentName.length > 20 ? d.agentName.slice(0, 18) + "…" : d.agentName,
      hoursSaved: d.totalTimeSavedHours,
      moneySaved: d.totalMoneySaved,
      uses: d.totalUsageCount,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" angle={-15} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
          formatter={(value: number, name: string) => {
            if (name === "Hours Saved") return [`${value}h`, name];
            if (name === "Cost Savings") return [`$${value.toLocaleString()}`, name];
            return [value, name];
          }}
        />
        <Legend />
        <Bar dataKey="hoursSaved" name="Hours Saved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="moneySaved" name="Cost Savings" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
