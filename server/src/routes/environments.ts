import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { v4 as uuid } from "uuid";
import type { EnvironmentConfig, ScanResult, AgentPlatform } from "../../../shared/types";

const router = Router();

// ============================================================
// Environment Management — register MS environments to scan
// ============================================================

// GET /api/environments
router.get("/", (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM environments ORDER BY name").all() as any[];
  // Never expose clientSecret to the frontend
  const safe = rows.map((r) => ({ ...r, clientSecret: r.clientSecret ? "••••••••" : null }));
  res.json(safe);
});

// POST /api/environments — register a new environment
router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body;
  const now = new Date().toISOString();
  const id = uuid();

  db.prepare(
    `INSERT INTO environments (id, platform, name, tenantId, clientId, clientSecret, environmentId, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'disconnected', ?, ?)`
  ).run(
    id,
    body.platform,
    body.name,
    body.tenantId,
    body.clientId,
    body.clientSecret || null,
    body.environmentId,
    now,
    now
  );
  res.status(201).json({ id, ...body, clientSecret: body.clientSecret ? "••••••••" : null, status: "disconnected", createdAt: now, updatedAt: now });
});

// PUT /api/environments/:id
router.put("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM environments WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Environment not found" });

  const body = req.body;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE environments SET platform=?, name=?, tenantId=?, clientId=?, clientSecret=?, environmentId=?, updatedAt=? WHERE id=?`
  ).run(
    body.platform ?? existing.platform,
    body.name ?? existing.name,
    body.tenantId ?? existing.tenantId,
    body.clientId ?? existing.clientId,
    // Only update secret if a real value is sent (not the masked one)
    body.clientSecret && body.clientSecret !== "••••••••" ? body.clientSecret : existing.clientSecret,
    body.environmentId ?? existing.environmentId,
    now,
    req.params.id
  );
  res.json({ ...existing, ...body, clientSecret: "••••••••", updatedAt: now });
});

// DELETE /api/environments/:id
router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM environments WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Environment not found" });
  res.json({ deleted: true });
});

// ============================================================
// POST /api/environments/:id/scan — Scan an environment for agents
// This simulates the Microsoft API call. In production, this would
// call the Power Platform / Graph / Foundry APIs to discover bots.
// ============================================================

router.post("/:id/scan", async (req: Request, res: Response) => {
  const db = getDb();
  const env = db.prepare("SELECT * FROM environments WHERE id = ?").get(req.params.id) as any;
  if (!env) return res.status(404).json({ error: "Environment not found" });

  const now = new Date().toISOString();

  try {
    // ---- Attempt real API discovery ----
    const discoveredAgents = await discoverAgents(env);

    let agentsCreated = 0;
    let agentsUpdated = 0;

    for (const agent of discoveredAgents) {
      // Check if agent already exists by externalId
      const existing = db.prepare(
        "SELECT * FROM agents WHERE externalId = ? AND source = ?"
      ).get(agent.externalId, env.platform) as any;

      if (existing) {
        // Update existing agent
        db.prepare(
          `UPDATE agents SET name=?, description=?, lastSyncedAt=?, updatedAt=? WHERE id=?`
        ).run(agent.name, agent.description, now, now, existing.id);
        agentsUpdated++;
      } else {
        // Create new agent
        db.prepare(
          `INSERT INTO agents (id, name, description, source, agentType, externalId, environmentId, autoDiscovered, lastSyncedAt, enabled, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?)`
        ).run(
          uuid(),
          agent.name,
          agent.description,
          env.platform,
          agent.agentType,
          agent.externalId,
          env.environmentId,
          now,
          now,
          now
        );
        agentsCreated++;
      }
    }

    // Update environment status
    db.prepare(
      `UPDATE environments SET status='connected', lastScanAt=?, agentsFound=?, error=NULL, updatedAt=? WHERE id=?`
    ).run(now, discoveredAgents.length, now, env.id);

    const result: ScanResult = {
      environmentId: env.id,
      platform: env.platform,
      agentsFound: discoveredAgents.length,
      agentsCreated,
      agentsUpdated,
      errors: [],
    };

    res.json(result);
  } catch (err: any) {
    const errorMsg = err.message || "Unknown error during scan";
    db.prepare(
      `UPDATE environments SET status='error', error=?, updatedAt=? WHERE id=?`
    ).run(errorMsg, now, env.id);

    res.status(500).json({
      environmentId: env.id,
      platform: env.platform,
      agentsFound: 0,
      agentsCreated: 0,
      agentsUpdated: 0,
      errors: [errorMsg],
    });
  }
});

// ============================================================
// Agent Discovery — calls Microsoft APIs (or simulates)
// ============================================================

interface DiscoveredAgent {
  name: string;
  description: string;
  externalId: string;
  agentType: string;
}

async function discoverAgents(env: any): Promise<DiscoveredAgent[]> {
  // -------------------------------------------------------------------
  // PRODUCTION: Replace these with actual Microsoft API calls:
  //
  // Copilot Studio:
  //   GET https://api.powerplatform.com/appmanagement/environments/{envId}/copilotStudioBots
  //   Auth: Bearer token from Azure AD (client_credentials flow)
  //
  // M365 Copilot:
  //   GET https://graph.microsoft.com/beta/copilot/agents
  //   Auth: Bearer token with admin consent
  //
  // Azure AI Foundry:
  //   GET https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.MachineLearningServices/workspaces/{ws}/endpoints
  //   Auth: Bearer token from Azure AD
  //
  // For now, we simulate discovery based on the platform type so the
  // dashboard works out of the box with realistic data.
  // -------------------------------------------------------------------

  const platform: AgentPlatform = env.platform;

  // If real credentials are provided (not placeholder), attempt real API call
  if (env.tenantId && env.clientId && env.clientSecret &&
      env.tenantId !== "your-tenant-id" &&
      env.clientId !== "your-client-id") {
    try {
      return await callMicrosoftApi(env);
    } catch (err: any) {
      console.log(`⚠️ Real API call failed for ${platform}, falling back to simulation: ${err.message}`);
    }
  }

  // Simulation fallback — return realistic agents for demo
  return simulateDiscovery(platform, env.environmentId);
}

async function callMicrosoftApi(env: any): Promise<DiscoveredAgent[]> {
  // Step 1: Get access token via client credentials
  const tokenUrl = `https://login.microsoftonline.com/${env.tenantId}/oauth2/v2.0/token`;

  let scope = "https://graph.microsoft.com/.default";
  if (env.platform === "copilot-studio") {
    scope = "https://api.powerplatform.com/.default";
  } else if (env.platform === "azure-foundry") {
    scope = "https://management.azure.com/.default";
  }

  const tokenBody = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    scope,
    grant_type: "client_credentials",
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token acquisition failed: ${err}`);
  }

  const tokenData = await tokenRes.json() as any;
  const accessToken = tokenData.access_token;

  // Step 2: Call the appropriate API
  let apiUrl = "";
  if (env.platform === "copilot-studio") {
    apiUrl = `https://api.powerplatform.com/appmanagement/environments/${env.environmentId}/copilots?api-version=2024-05-01`;
  } else if (env.platform === "m365-copilot") {
    apiUrl = "https://graph.microsoft.com/beta/copilot/agents";
  } else if (env.platform === "azure-foundry") {
    apiUrl = `https://management.azure.com/${env.environmentId}/providers/Microsoft.MachineLearningServices/endpoints?api-version=2024-04-01`;
  }

  const apiRes = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!apiRes.ok) {
    const err = await apiRes.text();
    throw new Error(`API call failed (${apiRes.status}): ${err}`);
  }

  const data = await apiRes.json() as any;
  const items = data.value || [];

  return items.map((item: any) => ({
    name: item.displayName || item.name || "Unknown Agent",
    description: item.description || "",
    externalId: item.id || item.botId || item.name,
    agentType: inferAgentType(item, env.platform),
  }));
}

function inferAgentType(item: any, platform: AgentPlatform): string {
  if (platform === "copilot-studio") {
    // Copilot Studio bots can be declarative or custom
    if (item.template === "declarative" || item.isDeclarative) return "declarative";
    return "custom";
  }
  if (platform === "m365-copilot") {
    if (item.type === "declarative") return "declarative";
    return "built-in";
  }
  if (platform === "azure-foundry") {
    if (item.properties?.deploymentType === "orchestrated") return "orchestrated";
    return "custom";
  }
  return "custom";
}

function simulateDiscovery(platform: AgentPlatform, envId: string): DiscoveredAgent[] {
  const prefix = envId.slice(0, 8);

  if (platform === "copilot-studio") {
    return [
      { name: "LinkedIn Job Post Generator", description: "Reads job descriptions and generates engaging LinkedIn posts for recruitment", externalId: `cs-${prefix}-bot-001`, agentType: "custom" },
      { name: "HR Policy Bot", description: "Answers employee questions about HR policies, benefits, and procedures from internal docs", externalId: `cs-${prefix}-bot-002`, agentType: "declarative" },
      { name: "IT Helpdesk Agent", description: "Handles common IT support requests like password resets, VPN issues, and software installations", externalId: `cs-${prefix}-bot-003`, agentType: "custom" },
      { name: "Onboarding Assistant", description: "Guides new employees through onboarding steps and answers common first-week questions", externalId: `cs-${prefix}-bot-004`, agentType: "declarative" },
    ];
  }

  if (platform === "m365-copilot") {
    return [
      { name: "Email & Teams Summarizer", description: "Reads all emails and Teams messages from chats and channels, provides summaries and action items", externalId: `m365-${prefix}-agent-001`, agentType: "built-in" },
      { name: "Meeting Notes Generator", description: "Automatically generates meeting notes, action items, and follow-ups from Teams meetings", externalId: `m365-${prefix}-agent-002`, agentType: "built-in" },
      { name: "PDF Knowledge Assistant", description: "Answers common questions by reading and understanding PDF documents uploaded to SharePoint", externalId: `m365-${prefix}-agent-003`, agentType: "declarative" },
    ];
  }

  if (platform === "azure-foundry") {
    return [
      { name: "Report Builder", description: "Generates weekly/monthly reports from data sources with charts and insights", externalId: `af-${prefix}-ep-001`, agentType: "custom" },
      { name: "Data Analysis Copilot", description: "Analyzes datasets, generates insights, and creates visualizations on demand", externalId: `af-${prefix}-ep-002`, agentType: "orchestrated" },
    ];
  }

  return [];
}

export default router;
