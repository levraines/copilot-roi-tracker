import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { getSettings } from "../settings";
import type { DashboardData, DashboardKPIs, AgentROISummary, TimeSeriesPoint } from "../../../shared/types";

const router = Router();

// GET /api/dashboard?from=...&to=...&period=day|week|month
router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const settings = getSettings();
  const { from, to } = req.query;

  // Default: last 30 days
  const toDate = to ? String(to) : new Date().toISOString();
  const fromDate = from
    ? String(from)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const hourlyRate = settings.defaultHourlyRate;
  const minuteRate = hourlyRate / 60;
  const monthlyMinutes = settings.workingHoursPerDay * settings.workingDaysPerMonth * 60;

  // ---- Agent Summaries ----
  const agentRows = db.prepare(`
    SELECT 
      a.id as agentId,
      a.name as agentName,
      a.source as agentSource,
      a.agentType as agentType,
      COUNT(u.id) as totalUsageCount,
      COUNT(DISTINCT u.userId) as uniqueUsers,
      SUM(
        CASE WHEN u.overrideTimeSavedMinutes IS NOT NULL
          THEN u.overrideTimeSavedMinutes
          ELSE ab.manualTimeMinutes - COALESCE(u.actualAgentTimeMinutes, ab.agentTimeMinutes)
        END
      ) as totalTimeSavedMinutes
    FROM agents a
    LEFT JOIN usage_records u ON u.agentId = a.id AND u.timestamp >= ? AND u.timestamp <= ?
    LEFT JOIN action_benchmarks ab ON u.actionBenchmarkId = ab.id
    WHERE a.enabled = 1
    GROUP BY a.id
    ORDER BY totalTimeSavedMinutes DESC
  `).all(fromDate, toDate) as any[];

  const agentSummaries: AgentROISummary[] = agentRows.map((r) => {
    const savedMin = r.totalTimeSavedMinutes || 0;
    return {
      agentId: r.agentId,
      agentName: r.agentName,
      agentSource: r.agentSource,
      agentType: r.agentType || "custom",
      totalUsageCount: r.totalUsageCount || 0,
      totalTimeSavedMinutes: savedMin,
      totalTimeSavedHours: Math.round((savedMin / 60) * 100) / 100,
      totalMoneySaved: Math.round(savedMin * minuteRate * 100) / 100,
      avgTimeSavedPerUse: r.totalUsageCount ? Math.round((savedMin / r.totalUsageCount) * 10) / 10 : 0,
      uniqueUsers: r.uniqueUsers || 0,
      topAction: "",
      trend: 0,
    };
  });

  // Populate topAction for each agent
  for (const summary of agentSummaries) {
    const topAction = db.prepare(`
      SELECT ab.actionName, COUNT(*) as cnt
      FROM usage_records u
      JOIN action_benchmarks ab ON u.actionBenchmarkId = ab.id
      WHERE u.agentId = ? AND u.timestamp >= ? AND u.timestamp <= ?
      GROUP BY ab.actionName
      ORDER BY cnt DESC
      LIMIT 1
    `).get(summary.agentId, fromDate, toDate) as any;
    if (topAction) summary.topAction = topAction.actionName;
  }

  // ---- KPIs ----
  const totalAgents = db.prepare("SELECT COUNT(*) as c FROM agents").get() as any;
  const activeAgents = db.prepare("SELECT COUNT(DISTINCT agentId) as c FROM usage_records WHERE timestamp >= ? AND timestamp <= ?").get(fromDate, toDate) as any;

  const totalTimeSavedMinutes = agentSummaries.reduce((s, a) => s + a.totalTimeSavedMinutes, 0);
  const totalTimeSavedHours = Math.round((totalTimeSavedMinutes / 60) * 100) / 100;
  const totalMoneySaved = Math.round(totalTimeSavedMinutes * minuteRate * 100) / 100;
  const totalUsageCount = agentSummaries.reduce((s, a) => s + a.totalUsageCount, 0);
  const totalFTEsSaved = Math.round((totalTimeSavedMinutes / monthlyMinutes) * 100) / 100;

  const kpis: DashboardKPIs = {
    totalAgents: totalAgents.c,
    activeAgents: activeAgents.c,
    totalUsageCount,
    totalTimeSavedHours,
    totalMoneySaved,
    totalFTEsSaved,
    avgROIPerAgent: activeAgents.c ? Math.round((totalMoneySaved / activeAgents.c) * 100) / 100 : 0,
    topAgent: agentSummaries[0]?.agentName || "N/A",
    periodLabel: `${fromDate.slice(0, 10)} — ${toDate.slice(0, 10)}`,
  };

  // ---- Time Series ----
  const tsRows = db.prepare(`
    SELECT 
      DATE(u.timestamp) as date,
      SUM(
        CASE WHEN u.overrideTimeSavedMinutes IS NOT NULL
          THEN u.overrideTimeSavedMinutes
          ELSE ab.manualTimeMinutes - COALESCE(u.actualAgentTimeMinutes, ab.agentTimeMinutes)
        END
      ) as timeSavedMinutes,
      COUNT(u.id) as usageCount
    FROM usage_records u
    JOIN action_benchmarks ab ON u.actionBenchmarkId = ab.id
    WHERE u.timestamp >= ? AND u.timestamp <= ?
    GROUP BY DATE(u.timestamp)
    ORDER BY date
  `).all(fromDate, toDate) as any[];

  const timeSeries: TimeSeriesPoint[] = tsRows.map((r) => ({
    date: r.date,
    timeSavedMinutes: r.timeSavedMinutes || 0,
    moneySaved: Math.round((r.timeSavedMinutes || 0) * minuteRate * 100) / 100,
    usageCount: r.usageCount,
  }));

  // ---- Usage by Source ----
  const sourceRows = db.prepare(`
    SELECT 
      a.source,
      COUNT(u.id) as count,
      SUM(
        CASE WHEN u.overrideTimeSavedMinutes IS NOT NULL
          THEN u.overrideTimeSavedMinutes
          ELSE ab.manualTimeMinutes - COALESCE(u.actualAgentTimeMinutes, ab.agentTimeMinutes)
        END
      ) as timeSaved
    FROM usage_records u
    JOIN agents a ON u.agentId = a.id
    JOIN action_benchmarks ab ON u.actionBenchmarkId = ab.id
    WHERE u.timestamp >= ? AND u.timestamp <= ?
    GROUP BY a.source
  `).all(fromDate, toDate) as any[];

  const usageBySource = sourceRows.map((r) => ({
    source: r.source,
    count: r.count,
    timeSaved: r.timeSaved || 0,
    moneySaved: Math.round((r.timeSaved || 0) * minuteRate * 100) / 100,
  }));

  // ---- Top Actions ----
  const topActionRows = db.prepare(`
    SELECT 
      ab.actionName,
      a.name as agentName,
      COUNT(u.id) as count,
      SUM(
        CASE WHEN u.overrideTimeSavedMinutes IS NOT NULL
          THEN u.overrideTimeSavedMinutes
          ELSE ab.manualTimeMinutes - COALESCE(u.actualAgentTimeMinutes, ab.agentTimeMinutes)
        END
      ) as timeSaved
    FROM usage_records u
    JOIN action_benchmarks ab ON u.actionBenchmarkId = ab.id
    JOIN agents a ON u.agentId = a.id
    WHERE u.timestamp >= ? AND u.timestamp <= ?
    GROUP BY ab.actionName, a.name
    ORDER BY timeSaved DESC
    LIMIT 10
  `).all(fromDate, toDate) as any[];

  const topActions = topActionRows.map((r) => ({
    actionName: r.actionName,
    agentName: r.agentName,
    count: r.count,
    timeSaved: r.timeSaved || 0,
    moneySaved: Math.round((r.timeSaved || 0) * minuteRate * 100) / 100,
  }));

  const data: DashboardData = {
    kpis,
    agentSummaries,
    timeSeries,
    usageBySource,
    topActions,
  };

  res.json(data);
});

export default router;
