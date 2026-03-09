import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { v4 as uuid } from "uuid";
import type {
  AgentDefinition,
  CreateAgentPayload,
} from "../../../shared/types";

const router = Router();

// GET /api/agents
router.get("/", (_req: Request, res: Response) => {
  const db = getDb();
  const agents = db.prepare("SELECT * FROM agents ORDER BY name").all();
  res.json(agents);
});

// GET /api/agents/:id
router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const agent = db
    .prepare("SELECT * FROM agents WHERE id = ?")
    .get(req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  res.json(agent);
});

// POST /api/agents
router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const body: CreateAgentPayload = req.body;
  const now = new Date().toISOString();
  const agent: AgentDefinition = {
    id: uuid(),
    name: body.name,
    description: body.description,
    source: body.source,
    agentType: body.agentType || "custom",
    externalId: body.externalId,
    environmentId: body.environmentId,
    icon: body.icon,
    autoDiscovered: false,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
  db.prepare(
    `INSERT INTO agents (id, name, description, source, agentType, externalId, environmentId, icon, autoDiscovered, enabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    agent.id,
    agent.name,
    agent.description,
    agent.source,
    agent.agentType,
    agent.externalId || null,
    agent.environmentId || null,
    agent.icon || null,
    agent.autoDiscovered ? 1 : 0,
    agent.enabled ? 1 : 0,
    agent.createdAt,
    agent.updatedAt
  );
  res.status(201).json(agent);
});

// PUT /api/agents/:id
router.put("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM agents WHERE id = ?")
    .get(req.params.id) as AgentDefinition | undefined;
  if (!existing) return res.status(404).json({ error: "Agent not found" });

  const body = req.body;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE agents SET name=?, description=?, source=?, agentType=?, externalId=?, environmentId=?, icon=?, enabled=?, updatedAt=? WHERE id=?`
  ).run(
    body.name ?? existing.name,
    body.description ?? existing.description,
    body.source ?? existing.source,
    body.agentType ?? existing.agentType,
    body.externalId ?? existing.externalId,
    body.environmentId ?? existing.environmentId,
    body.icon ?? existing.icon,
    body.enabled !== undefined ? (body.enabled ? 1 : 0) : (existing.enabled ? 1 : 0),
    now,
    req.params.id
  );
  res.json({ ...existing, ...body, updatedAt: now });
});

// DELETE /api/agents/:id
router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM agents WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Agent not found" });
  res.json({ deleted: true });
});

export default router;
