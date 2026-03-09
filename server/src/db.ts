import Database from "better-sqlite3";
import path from "path";

// In Azure App Service, use /home/data for persistent storage
// In Docker, use the DB_DIR env variable
// In dev (tsx), __dirname = server/src → go up one level to server/data
// In prod build, __dirname = dist/server/src → go up 3 levels + server/data
const isCompiledBuild = __dirname.includes("dist");
const DB_DIR =
  process.env.DB_DIR ||
  (isCompiledBuild
    ? path.join(__dirname, "..", "..", "..", "server", "data")
    : path.join(__dirname, "..", "data"));
const DB_PATH = path.join(DB_DIR, "roi-tracker.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL CHECK(source IN ('copilot-studio','m365-copilot','azure-foundry')),
      agentType TEXT NOT NULL DEFAULT 'custom' CHECK(agentType IN ('declarative','custom','built-in','orchestrated')),
      externalId TEXT,
      environmentId TEXT,
      icon TEXT,
      autoDiscovered INTEGER NOT NULL DEFAULT 0,
      lastSyncedAt TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS action_benchmarks (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      actionName TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      manualTimeMinutes REAL NOT NULL,
      agentTimeMinutes REAL NOT NULL,
      customHourlyRate REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      actionBenchmarkId TEXT NOT NULL REFERENCES action_benchmarks(id) ON DELETE CASCADE,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      actualAgentTimeMinutes REAL,
      overrideTimeSavedMinutes REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connectors (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'disconnected',
      lastSync TEXT,
      error TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL CHECK(platform IN ('copilot-studio','m365-copilot','azure-foundry')),
      name TEXT NOT NULL,
      tenantId TEXT NOT NULL,
      clientId TEXT NOT NULL,
      clientSecret TEXT,
      environmentId TEXT NOT NULL,
      lastScanAt TEXT,
      agentsFound INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'disconnected',
      error TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_usage_agent ON usage_records(agentId);
    CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_records(timestamp);
    CREATE INDEX IF NOT EXISTS idx_benchmarks_agent ON action_benchmarks(agentId);
  `);
}
