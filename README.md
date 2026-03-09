# Copilot Agent ROI Tracker

> Track time and cost savings from **Copilot Studio**, **M365 Copilot**, and **Azure AI Foundry** agents with an executive-ready dashboard.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fyour-org%2Fcopilot-roi-tracker%2Fmain%2Finfra%2Fazuredeploy.json)

---

## Features

- 🔍 **Auto-discover agents** from Copilot Studio, M365 Copilot, and Azure AI Foundry environments
- 📊 **Executive dashboard** with KPIs, charts, and ROI metrics
- ⏱️ **Time savings tracking** with customizable benchmarks per action
- 💰 **Cost calculations** with configurable hourly rates and FTE equivalents
- 🔌 **Multi-tenant support** — install in any Microsoft customer tenant
- 🔄 **Power Platform integration** — Custom Connector + Power Automate flows for automated tracking
- 📦 **One-click Azure deployment** via ARM template or Bicep

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Azure Tenant                      │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ App      │  │ Container │  │ Key Vault        │  │
│  │ Service  │◄─│ Registry  │  │ (secrets)        │  │
│  │ (Linux)  │  │ (ACR)     │  │                  │  │
│  └─────┬────┘  └───────────┘  └──────────────────┘  │
│        │                                             │
│        ▼                                             │
│  ┌──────────┐                                        │
│  │ SQLite   │  (persistent via /home/data)           │
│  │ Database │                                        │
│  └──────────┘                                        │
└─────────────────────────────────────────────────────┘
        │
        ▼ Scans via Microsoft APIs
┌───────────────────────────────────────────┐
│  Copilot Studio  │  M365 Copilot  │  Azure │
│  (Power Platform │  (Graph API)   │  AI    │
│   API)           │                │  Foundry│
└───────────────────────────────────────────┘
```

## Quick Start (Local Development)

```bash
# 1. Clone & install
git clone https://github.com/your-org/copilot-roi-tracker.git
cd copilot-roi-tracker
npm run install:all

# 2. Configure (optional — demo data works without)
cp server/.env.example server/.env
# Edit .env with your Azure AD credentials

# 3. Run
npm run dev

# 4. Open
open http://localhost:5173
```

## Deploy to Azure

### Option A: One-Click Deploy

Click the **"Deploy to Azure"** button above.

### Option B: CLI Deployment

```bash
# Prerequisites: Azure CLI, Docker
az login
bash infra/scripts/deploy.sh
```

### Option C: Bicep (IaC)

```bash
az group create -n copilot-roi-rg -l eastus
az deployment group create \
  -g copilot-roi-rg \
  -f infra/main.bicep \
  -p appName=copilotroi appServiceSku=B1
```

### Option D: Docker

```bash
docker build -t copilot-roi-tracker .
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -v roi-data:/app/data \
  copilot-roi-tracker
```

## Multi-Tenant Setup

### 1. Register the Azure AD App

```bash
bash infra/scripts/register-app.sh "Copilot Agent ROI Tracker"
```

### 2. Store Credentials in Key Vault

```bash
az keyvault secret set --vault-name <kv> --name ms-client-id --value <CLIENT_ID>
az keyvault secret set --vault-name <kv> --name ms-client-secret --value <SECRET>
```

### 3. Onboard Customer Tenants

```bash
az login --tenant <customer-tenant-id>
bash infra/scripts/onboard-tenant.sh <APP_CLIENT_ID> <APP_URL>
```

## Power Platform Integration

### Custom Connector

1. Go to **Power Automate** → **Custom Connectors** → **Import from OpenAPI**
2. Upload `infra/power-platform/custom-connector/apiDefinition.swagger.json`
3. Configure with your App Registration credentials

### Pre-built Flows

| Flow | Purpose |
|------|---------|
| **Daily Agent Sync** | Scans all environments daily at 6 AM |
| **Track Usage Event** | HTTP trigger for Copilot Studio topics to record usage |

## Platforms Supported

| Platform | API Used | Agent Types |
|----------|----------|-------------|
| **Copilot Studio** | Power Platform API | Declarative, Custom |
| **M365 Copilot** | Microsoft Graph API | Built-in, Declarative |
| **Azure AI Foundry** | Azure Management API | Custom, Orchestrated |

## Project Structure

```
├── client/                  # React SPA
├── server/                  # Express API + SQLite
├── shared/                  # Shared TypeScript types
├── infra/
│   ├── main.bicep           # Azure Bicep IaC
│   ├── azuredeploy.json     # ARM template (one-click)
│   ├── scripts/
│   │   ├── deploy.sh        # Automated deployment
│   │   ├── register-app.sh  # Azure AD app registration
│   │   └── onboard-tenant.sh
│   └── power-platform/
│       ├── solution.xml
│       ├── custom-connector/
│       └── flows/
├── Dockerfile
├── .github/workflows/deploy.yml
└── package.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No |
| `NODE_ENV` | development / production | No |
| `DB_DIR` | SQLite directory | No |
| `MS_TENANT_ID` | Azure AD Tenant ID | For scanning |
| `MS_CLIENT_ID` | App Client ID | For scanning |
| `MS_CLIENT_SECRET` | App Client Secret | For scanning |

## License

MIT
