// ============================================================
// Copilot Agent ROI Tracker — Shared Types
// ============================================================

// ---- Agent Definitions ----

/** The Microsoft platform where the agent lives */
export type AgentPlatform =
  | "copilot-studio"   // Microsoft Copilot Studio (Power Platform)
  | "m365-copilot"     // Microsoft 365 Copilot
  | "azure-foundry";   // Azure AI Foundry

/** The type of agent within its platform */
export type AgentType =
  | "declarative"      // Declarative agent (Copilot Studio / M365)
  | "custom"           // Custom agent (Copilot Studio / Foundry)
  | "built-in"         // Built-in M365 Copilot capabilities
  | "orchestrated";    // Multi-agent / orchestrated (Foundry)

// Keep backward compat alias for DB column
export type AgentSource = AgentPlatform;

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  /** The Microsoft platform (Copilot Studio, M365, Azure Foundry) */
  source: AgentPlatform;
  /** Sub-type within the platform */
  agentType: AgentType;
  /** Microsoft Bot ID, App ID, or Foundry deployment ID */
  externalId?: string;
  /** Power Platform Environment ID or Azure Resource Group */
  environmentId?: string;
  /** Icon URL */
  icon?: string;
  /** Whether the agent was auto-discovered via API scan */
  autoDiscovered: boolean;
  /** Last time the agent was synced from the API */
  lastSyncedAt?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Environment Scanning ----

export interface EnvironmentConfig {
  id: string;
  platform: AgentPlatform;
  /** Display name for this environment */
  name: string;
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  /** Power Platform environment ID or Azure subscription+resource group */
  environmentId: string;
  /** Last time a scan was performed */
  lastScanAt?: string;
  /** Number of agents found on last scan */
  agentsFound?: number;
  status: "connected" | "disconnected" | "error";
  error?: string;
}

export interface ScanResult {
  environmentId: string;
  platform: AgentPlatform;
  agentsFound: number;
  agentsCreated: number;
  agentsUpdated: number;
  errors: string[];
}

// ---- Action Benchmarks ----

export interface ActionBenchmark {
  id: string;
  agentId: string;
  /** Human-readable action name, e.g. "Read job description & write LinkedIn post" */
  actionName: string;
  /** Description of what the action does */
  description: string;
  /** Standard time in MINUTES a human would take WITHOUT the agent */
  manualTimeMinutes: number;
  /** Estimated time in MINUTES WITH the agent */
  agentTimeMinutes: number;
  /** Override hourly rate for this specific action (optional) */
  customHourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Usage Tracking ----

export interface UsageRecord {
  id: string;
  agentId: string;
  actionBenchmarkId: string;
  userId: string;
  userName: string;
  /** ISO timestamp */
  timestamp: string;
  /** Actual time spent with agent (minutes) — can override benchmark */
  actualAgentTimeMinutes?: number;
  /** Manual override of time saved (minutes) */
  overrideTimeSavedMinutes?: number;
  /** Notes */
  notes?: string;
}

// ---- Configuration ----

export interface GlobalSettings {
  /** Default hourly rate in USD */
  defaultHourlyRate: number;
  /** Currency code */
  currency: string;
  /** Currency symbol */
  currencySymbol: string;
  /** Working hours per day */
  workingHoursPerDay: number;
  /** Working days per month */
  workingDaysPerMonth: number;
  /** Organization name */
  organizationName: string;
  /** Fiscal year start month (1-12) */
  fiscalYearStartMonth: number;
}

// ---- Computed / Dashboard ----

export interface AgentROISummary {
  agentId: string;
  agentName: string;
  agentSource: AgentPlatform;
  agentType: AgentType;
  totalUsageCount: number;
  totalTimeSavedMinutes: number;
  totalTimeSavedHours: number;
  totalMoneySaved: number;
  avgTimeSavedPerUse: number;
  uniqueUsers: number;
  topAction: string;
  trend: number; // percentage change vs prior period
}

export interface DashboardKPIs {
  totalAgents: number;
  activeAgents: number;
  totalUsageCount: number;
  totalTimeSavedHours: number;
  totalMoneySaved: number;
  totalFTEsSaved: number; // Full-time equivalents
  avgROIPerAgent: number;
  topAgent: string;
  periodLabel: string;
}

export interface TimeSeriesPoint {
  date: string;
  timeSavedMinutes: number;
  moneySaved: number;
  usageCount: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  agentSummaries: AgentROISummary[];
  timeSeries: TimeSeriesPoint[];
  usageBySource: { source: AgentPlatform; count: number; timeSaved: number; moneySaved: number }[];
  topActions: { actionName: string; agentName: string; count: number; timeSaved: number; moneySaved: number }[];
}

// ---- API Payloads ----

export interface CreateAgentPayload {
  name: string;
  description: string;
  source: AgentPlatform;
  agentType: AgentType;
  externalId?: string;
  environmentId?: string;
  icon?: string;
}

export interface CreateBenchmarkPayload {
  agentId: string;
  actionName: string;
  description: string;
  manualTimeMinutes: number;
  agentTimeMinutes: number;
  customHourlyRate?: number;
}

export interface RecordUsagePayload {
  agentId: string;
  actionBenchmarkId: string;
  userId: string;
  userName: string;
  actualAgentTimeMinutes?: number;
  overrideTimeSavedMinutes?: number;
  notes?: string;
}

// ---- Microsoft Connector Types ----

export interface ConnectorStatus {
  connected: boolean;
  lastSync?: string;
  error?: string;
}
