import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TimeSeriesPoint } from "../../../../shared/types";

interface Props {
  data: TimeSeriesPoint[];
}

export function TimeSavingsChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">No data for this period</div>;
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    hours: Math.round((d.timeSavedMinutes / 60) * 10) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#475569" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#475569" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorMoney" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#334155" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#334155" stopOpacity={0} />
          </linearGradient>
        </defs>
  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
  <YAxis yAxisId="hours" tick={{ fontSize: 12 }} stroke="#9ca3af" />
  <YAxis yAxisId="money" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #111827", background: '#0b1220', color: '#e6eef8' }}
          formatter={(value: number, name: string) => {
            if (name === "Hours Saved") return [`${value}h`, name];
            return [`$${value.toLocaleString()}`, name];
          }}
        />
        <Legend />
        <Area
          yAxisId="hours"
          type="monotone"
          dataKey="hours"
          name="Hours Saved"
          stroke="#94a3b8"
          fill="url(#colorHours)"
          strokeWidth={2}
        />
        <Area
          yAxisId="money"
          type="monotone"
          dataKey="moneySaved"
          name="Cost Savings ($)"
          stroke="#64748b"
          fill="url(#colorMoney)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
