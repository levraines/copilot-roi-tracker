import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import agentsRouter from "./routes/agents";
import benchmarksRouter from "./routes/benchmarks";
import usageRouter from "./routes/usage";
import dashboardRouter from "./routes/dashboard";
import settingsRouter from "./routes/settings";
import environmentsRouter from "./routes/environments";
import { seedDemoData } from "./seed";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

// CORS — in dev allow Vite proxy; in prod same-origin
app.use(cors({
  origin: IS_PROD ? undefined : ["http://localhost:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// API Routes
app.use("/api/agents", agentsRouter);
app.use("/api/benchmarks", benchmarksRouter);
app.use("/api/usage", usageRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/environments", environmentsRouter);

// Health check (used by Azure App Service & Docker HEALTHCHECK)
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ---- Production: serve the React SPA ----
if (IS_PROD) {
  const staticDir = process.env.STATIC_DIR || path.join(__dirname, "..", "public");
  app.use(express.static(staticDir));
  // SPA fallback — all non-API routes return index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

// Seed demo data on first run
seedDemoData();

app.listen(PORT, () => {
  console.log(`🚀 ROI Tracker API running on http://localhost:${PORT} [${IS_PROD ? "production" : "development"}]`);
});
