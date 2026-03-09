import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { v4 as uuid } from "uuid";
import type { RecordUsagePayload } from "../../../shared/types";

const router = Router();

// GET /api/usage?agentId=...&from=...&to=...
router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const { agentId, from, to, limit } = req.query;

  let sql = `
    SELECT u.*, ab.actionName, ab.manualTimeMinutes, ab.agentTimeMinutes, ab.customHourlyRate, a.name as agentName
    FROM usage_records u
    JOIN action_benchmarks ab ON u.actionBenchmarkId = ab.id
    JOIN agents a ON u.agentId = a.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (agentId) {
    sql += " AND u.agentId = ?";
    params.push(agentId);
  }
  if (from) {
    sql += " AND u.timestamp >= ?";
    params.push(from);
  }
  if (to) {
    sql += " AND u.timestamp <= ?";
    params.push(to);
  }

  sql += " ORDER BY u.timestamp DESC";

  if (limit) {
    sql += " LIMIT ?";
    params.push(Number(limit));
  }

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// POST /api/usage
router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const body: RecordUsagePayload = req.body;
  const now = new Date().toISOString();
  const id = uuid();

  db.prepare(
    `INSERT INTO usage_records (id, agentId, actionBenchmarkId, userId, userName, timestamp, actualAgentTimeMinutes, overrideTimeSavedMinutes, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.agentId,
    body.actionBenchmarkId,
    body.userId,
    body.userName,
    now,
    body.actualAgentTimeMinutes ?? null,
    body.overrideTimeSavedMinutes ?? null,
    body.notes ?? null
  );
  res.status(201).json({ id, ...body, timestamp: now });
});

// POST /api/usage/bulk — bulk import
router.post("/bulk", (req: Request, res: Response) => {
  const db = getDb();
  const records: RecordUsagePayload[] = req.body;
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO usage_records (id, agentId, actionBenchmarkId, userId, userName, timestamp, actualAgentTimeMinutes, overrideTimeSavedMinutes, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const results: string[] = [];
  const tx = db.transaction(() => {
    for (const r of records) {
      const id = uuid();
      insert.run(
        id,
        r.agentId,
        r.actionBenchmarkId,
        r.userId,
        r.userName,
        now,
        r.actualAgentTimeMinutes ?? null,
        r.overrideTimeSavedMinutes ?? null,
        r.notes ?? null
      );
      results.push(id);
    }
  });
  tx();
  res.status(201).json({ inserted: results.length, ids: results });
});

// DELETE /api/usage/:id
router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM usage_records WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Record not found" });
  res.json({ deleted: true });
});

export default router;
