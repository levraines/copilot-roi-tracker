import { getDb } from "./db";
import type { GlobalSettings } from "../../shared/types";

const DEFAULTS: GlobalSettings = {
  defaultHourlyRate: Number(process.env.DEFAULT_HOURLY_RATE) || 50,
  currency: process.env.DEFAULT_CURRENCY || "USD",
  currencySymbol: process.env.DEFAULT_CURRENCY_SYMBOL || "$",
  workingHoursPerDay: Number(process.env.WORKING_HOURS_PER_DAY) || 8,
  workingDaysPerMonth: Number(process.env.WORKING_DAYS_PER_MONTH) || 22,
  organizationName: process.env.ORGANIZATION_NAME || "My Organization",
  fiscalYearStartMonth: Number(process.env.FISCAL_YEAR_START_MONTH) || 1,
};

export function getSettings(): GlobalSettings {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const saved: Record<string, string> = {};
  for (const r of rows) saved[r.key] = r.value;

  return {
    defaultHourlyRate: saved.defaultHourlyRate
      ? Number(saved.defaultHourlyRate)
      : DEFAULTS.defaultHourlyRate,
    currency: saved.currency || DEFAULTS.currency,
    currencySymbol: saved.currencySymbol || DEFAULTS.currencySymbol,
    workingHoursPerDay: saved.workingHoursPerDay
      ? Number(saved.workingHoursPerDay)
      : DEFAULTS.workingHoursPerDay,
    workingDaysPerMonth: saved.workingDaysPerMonth
      ? Number(saved.workingDaysPerMonth)
      : DEFAULTS.workingDaysPerMonth,
    organizationName: saved.organizationName || DEFAULTS.organizationName,
    fiscalYearStartMonth: saved.fiscalYearStartMonth
      ? Number(saved.fiscalYearStartMonth)
      : DEFAULTS.fiscalYearStartMonth,
  };
}

export function updateSettings(partial: Partial<GlobalSettings>): GlobalSettings {
  const db = getDb();
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) upsert.run(k, String(v));
    }
  });
  tx();
  return getSettings();
}
