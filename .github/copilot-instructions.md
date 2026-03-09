# Copilot Agent ROI Tracker

## Project Overview
A full-stack TypeScript application that tracks time and cost savings from Microsoft Copilot Studio, M365 agents, and custom declarative agents. Features an executive-ready dashboard.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (via better-sqlite3) for local development
- **Auth**: Microsoft MSAL for M365/Copilot Studio integration

## Architecture
- `/client` — React SPA dashboard
- `/server` — Express API server
- `/shared` — Shared TypeScript types

## Key Features
- Connect to Copilot Studio and M365 agents via Microsoft Graph API
- Track agent usage, time saved, and monetary value
- Customizable standard time benchmarks per action
- Customizable hourly rate for cost calculations
- Executive dashboard with KPIs, charts, and ROI metrics
- Support for declarative agents and custom agent connectors
