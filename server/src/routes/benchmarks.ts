import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { v4 as uuid } from "uuid";
import type {
  ActionBenchmark,
  CreateBenchmarkPayload,
} from "../../../shared/types";

const router = Router();

// GET /api/benchmarks?agentId=...
router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const { agentId } = req.query;
  if (agentId) {
    const rows = db
      .prepare("SELECT * FROM action_benchmarks WHERE agentId = ? ORDER BY actionName")
      .all(agentId as string);
    return res.json(rows);
  }
  const rows = db
    .prepare("SELECT * FROM action_benchmarks ORDER BY actionName")
    .all();
  res.json(rows);
});

// GET /api/benchmarks/:id
router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM action_benchmarks WHERE id = ?")
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "Benchmark not found" });
  res.json(row);
});

// POST /api/benchmarks
router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const body: CreateBenchmarkPayload = req.body;
  const now = new Date().toISOString();
  const benchmark: ActionBenchmark = {
    id: uuid(),
    agentId: body.agentId,
    actionName: body.actionName,
    description: body.description,
    manualTimeMinutes: body.manualTimeMinutes,
    agentTimeMinutes: body.agentTimeMinutes,
    customHourlyRate: body.customHourlyRate,
    createdAt: now,
    updatedAt: now,
  };
  db.prepare(
    `INSERT INTO action_benchmarks (id, agentId, actionName, description, manualTimeMinutes, agentTimeMinutes, customHourlyRate, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    benchmark.id,
    benchmark.agentId,
    benchmark.actionName,
    benchmark.description,
    benchmark.manualTimeMinutes,
    benchmark.agentTimeMinutes,
    benchmark.customHourlyRate ?? null,
    benchmark.createdAt,
    benchmark.updatedAt
  );
  res.status(201).json(benchmark);
});

// PUT /api/benchmarks/:id
router.put("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM action_benchmarks WHERE id = ?")
    .get(req.params.id) as ActionBenchmark | undefined;
  if (!existing) return res.status(404).json({ error: "Benchmark not found" });

  const body = req.body;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE action_benchmarks SET actionName=?, description=?, manualTimeMinutes=?, agentTimeMinutes=?, customHourlyRate=?, updatedAt=? WHERE id=?`
  ).run(
    body.actionName ?? existing.actionName,
    body.description ?? existing.description,
    body.manualTimeMinutes ?? existing.manualTimeMinutes,
    body.agentTimeMinutes ?? existing.agentTimeMinutes,
    body.customHourlyRate ?? existing.customHourlyRate ?? null,
    now,
    req.params.id
  );
  res.json({ ...existing, ...body, updatedAt: now });
});

// DELETE /api/benchmarks/:id
router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM action_benchmarks WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Benchmark not found" });
  res.json({ deleted: true });
});

export default router;
