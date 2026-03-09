import { getDb } from "./db";
import { v4 as uuid } from "uuid";

/**
 * Seeds the database with realistic demo data for the dashboard.
 */
export function seedDemoData() {
  const db = getDb();
  const existing = db.prepare("SELECT COUNT(*) as c FROM agents").get() as any;
  if (existing.c > 0) return; // already seeded

  console.log("🌱 Seeding demo data...");

  const now = new Date();

  // ---- Agents ----
  const agents = [
    {
      id: uuid(),
      name: "LinkedIn Job Post Generator",
      description: "Reads job descriptions and generates engaging LinkedIn posts for recruitment",
      source: "copilot-studio",
      agentType: "custom",
    },
    {
      id: uuid(),
      name: "Email & Teams Summarizer",
      description: "Reads all emails and Teams messages from chats and channels, provides summaries and action items",
      source: "m365-copilot",
      agentType: "built-in",
    },
    {
      id: uuid(),
      name: "PDF Knowledge Assistant",
      description: "Answers common questions by reading and understanding PDF documents",
      source: "m365-copilot",
      agentType: "declarative",
    },
    {
      id: uuid(),
      name: "Meeting Notes Generator",
      description: "Automatically generates meeting notes, action items, and follow-ups from Teams meetings",
      source: "m365-copilot",
      agentType: "built-in",
    },
    {
      id: uuid(),
      name: "HR Policy Bot",
      description: "Answers employee questions about HR policies, benefits, and procedures from internal docs",
      source: "copilot-studio",
      agentType: "declarative",
    },
    {
      id: uuid(),
      name: "Report Builder",
      description: "Generates weekly/monthly reports from data sources with charts and insights",
      source: "azure-foundry",
      agentType: "custom",
    },
  ];

  const insertAgent = db.prepare(
    `INSERT INTO agents (id, name, description, source, agentType, autoDiscovered, enabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?)`
  );

  for (const a of agents) {
    const date = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString();
    insertAgent.run(a.id, a.name, a.description, a.source, a.agentType, date, date);
  }

  // ---- Benchmarks ----
  const benchmarks = [
    // LinkedIn Job Post Generator
    { agentId: agents[0].id, actionName: "Read JD & Write LinkedIn Post", description: "Parse job description, write compelling LinkedIn recruitment post", manualTimeMinutes: 45, agentTimeMinutes: 5 },
    { agentId: agents[0].id, actionName: "Customize Post for Platform", description: "Adapt post tone and format for LinkedIn best practices", manualTimeMinutes: 20, agentTimeMinutes: 2 },

    // Email & Teams Summarizer
    { agentId: agents[1].id, actionName: "Daily Email Summary", description: "Summarize all unread emails with priority and action items", manualTimeMinutes: 30, agentTimeMinutes: 2 },
    { agentId: agents[1].id, actionName: "Teams Channel Digest", description: "Summarize Teams channel conversations from the day", manualTimeMinutes: 25, agentTimeMinutes: 3 },
    { agentId: agents[1].id, actionName: "Chat Thread Summary", description: "Summarize specific Teams chat threads", manualTimeMinutes: 15, agentTimeMinutes: 1 },

    // PDF Knowledge Assistant
    { agentId: agents[2].id, actionName: "Answer Policy Question", description: "Find and answer questions from PDF policy documents", manualTimeMinutes: 20, agentTimeMinutes: 1 },
    { agentId: agents[2].id, actionName: "Extract Key Info from PDF", description: "Extract specific data points from lengthy PDF reports", manualTimeMinutes: 35, agentTimeMinutes: 3 },

    // Meeting Notes Generator
    { agentId: agents[3].id, actionName: "Generate Meeting Summary", description: "Create structured meeting notes with decisions and action items", manualTimeMinutes: 30, agentTimeMinutes: 2 },
    { agentId: agents[3].id, actionName: "Create Follow-up Tasks", description: "Extract and create tasks from meeting discussions", manualTimeMinutes: 15, agentTimeMinutes: 1 },

    // HR Policy Bot
    { agentId: agents[4].id, actionName: "Answer Benefits Question", description: "Answer employee questions about health/dental/vision benefits", manualTimeMinutes: 15, agentTimeMinutes: 1 },
    { agentId: agents[4].id, actionName: "PTO Policy Lookup", description: "Look up and explain PTO policies and balances", manualTimeMinutes: 10, agentTimeMinutes: 1 },

    // Report Builder
    { agentId: agents[5].id, actionName: "Generate Weekly Report", description: "Compile data and create formatted weekly status report", manualTimeMinutes: 60, agentTimeMinutes: 5 },
    { agentId: agents[5].id, actionName: "Create Executive Summary", description: "Generate executive-level summary with key metrics", manualTimeMinutes: 45, agentTimeMinutes: 4 },
  ];

  const insertBenchmark = db.prepare(
    `INSERT INTO action_benchmarks (id, agentId, actionName, description, manualTimeMinutes, agentTimeMinutes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const benchmarkIds: { id: string; agentId: string }[] = [];
  for (const b of benchmarks) {
    const id = uuid();
    const date = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString();
    insertBenchmark.run(id, b.agentId, b.actionName, b.description, b.manualTimeMinutes, b.agentTimeMinutes, date, date);
    benchmarkIds.push({ id, agentId: b.agentId });
  }

  // ---- Usage Records (last 90 days) ----
  const users = [
    { id: "user-1", name: "Sarah Johnson" },
    { id: "user-2", name: "Michael Chen" },
    { id: "user-3", name: "Emily Rodriguez" },
    { id: "user-4", name: "David Kim" },
    { id: "user-5", name: "Lisa Thompson" },
    { id: "user-6", name: "James Wilson" },
    { id: "user-7", name: "Ana Martinez" },
    { id: "user-8", name: "Robert Taylor" },
  ];

  const insertUsage = db.prepare(
    `INSERT INTO usage_records (id, agentId, actionBenchmarkId, userId, userName, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
      const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Each agent gets 2-8 uses per day
      for (const agent of agents) {
        const agentBenchmarks = benchmarkIds.filter((b) => b.agentId === agent.id);
        const usesPerDay = Math.floor(Math.random() * 7) + 2;

        for (let i = 0; i < usesPerDay; i++) {
          const benchmark = agentBenchmarks[Math.floor(Math.random() * agentBenchmarks.length)];
          const user = users[Math.floor(Math.random() * users.length)];
          const hour = 8 + Math.floor(Math.random() * 9); // 8am-5pm
          const minute = Math.floor(Math.random() * 60);
          const ts = new Date(date);
          ts.setHours(hour, minute, 0, 0);

          insertUsage.run(uuid(), agent.id, benchmark.id, user.id, user.name, ts.toISOString());
        }
      }
    }
  });
  tx();

  const totalUsage = db.prepare("SELECT COUNT(*) as c FROM usage_records").get() as any;
  console.log(`✅ Seeded ${agents.length} agents, ${benchmarks.length} benchmarks, ${totalUsage.c} usage records`);
}
