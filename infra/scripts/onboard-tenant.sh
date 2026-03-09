#!/usr/bin/env bash
# ============================================================
# Tenant Onboarding Script
# Run this in the CUSTOMER'S Azure tenant to grant the ROI Tracker
# access to scan their Copilot Studio, M365, and Foundry agents.
#
# This does NOT deploy the app — it just grants consent.
#
# Prerequisites:
#   - Azure CLI logged in as a Global Admin of the customer tenant
#   - The APP_CLIENT_ID of your ROI Tracker app registration
#
# Usage:
#   bash infra/scripts/onboard-tenant.sh <APP_CLIENT_ID>
# ============================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <APP_CLIENT_ID> [APP_URL]"
  echo ""
  echo "  APP_CLIENT_ID  = The Client ID of the ROI Tracker app registration"
  echo "  APP_URL        = (optional) The URL where the tracker is deployed"
  exit 1
fi

APP_CLIENT_ID="$1"
APP_URL="${2:-https://your-app.azurewebsites.net}"

TENANT_ID=$(az account show --query tenantId -o tsv)
TENANT_NAME=$(az account show --query tenantDisplayName -o tsv 2>/dev/null || echo "Unknown")

echo ""
echo "============================================================"
echo "  Copilot Agent ROI Tracker — Tenant Onboarding"
echo "============================================================"
echo "  Customer Tenant : $TENANT_NAME ($TENANT_ID)"
echo "  App Client ID   : $APP_CLIENT_ID"
echo "============================================================"
echo ""

# ---- Step 1: Admin consent ----
echo "1️⃣  Granting admin consent for the ROI Tracker app..."
echo ""
echo "  Opening the admin consent URL in your browser."
echo "  If it doesn't open, copy and paste this URL:"
echo ""
CONSENT_URL="https://login.microsoftonline.com/$TENANT_ID/adminconsent?client_id=$APP_CLIENT_ID&redirect_uri=$APP_URL/auth/callback"
echo "  $CONSENT_URL"
echo ""

# Try to open browser
if command -v open &> /dev/null; then
  open "$CONSENT_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$CONSENT_URL"
fi

read -rp "  Press Enter after granting consent in the browser..."

# ---- Step 2: Verify service principal exists ----
echo ""
echo "2️⃣  Verifying service principal in this tenant..."
SP_ID=$(az ad sp list --filter "appId eq '$APP_CLIENT_ID'" --query "[0].id" -o tsv 2>/dev/null || echo "")

if [ -z "$SP_ID" ]; then
  echo "  ⚠️  Service principal not found. Creating..."
  az ad sp create --id "$APP_CLIENT_ID" --output none
  SP_ID=$(az ad sp list --filter "appId eq '$APP_CLIENT_ID'" --query "[0].id" -o tsv)
fi
echo "  ✅ Service Principal: $SP_ID"

# ---- Step 3: Assign additional roles (optional) ----
echo ""
echo "3️⃣  Assigning roles..."

# Power Platform: To scan Copilot Studio, the app needs
# "Power Platform Administrator" or a custom role.
# This is typically done via Power Platform admin center.
echo "  ℹ️  For Copilot Studio scanning:"
echo "     Go to https://admin.powerplatform.microsoft.com"
echo "     → Settings → App registrations → Add '$APP_CLIENT_ID'"
echo ""

# Azure AI Foundry: Reader role on the resource group
echo "  ℹ️  For Azure AI Foundry scanning:"
echo "     Grant 'Reader' role on the relevant Azure resource groups."
echo ""

# ---- Step 4: Test connectivity ----
echo "4️⃣  Testing connectivity..."
echo ""
echo "  To verify the integration works:"
echo "  1. Open the ROI Tracker: $APP_URL"
echo "  2. Go to the Agents page"
echo "  3. Click 'Add Environment'"
echo "  4. Enter your tenant details:"
echo "     Tenant ID   : $TENANT_ID"
echo "     Client ID   : $APP_CLIENT_ID"
echo "     Client Secret: (from your Key Vault)"
echo "  5. Click 'Scan' to discover agents"
echo ""

# ---- Summary ----
echo "============================================================"
echo "  ✅  Tenant Onboarding Complete"
echo "============================================================"
echo ""
echo "  Tenant ID  : $TENANT_ID"
echo "  Tenant Name: $TENANT_NAME"
echo "  SP ID      : $SP_ID"
echo ""
echo "  The ROI Tracker can now scan this tenant for:"
echo "  • Copilot Studio agents (via Power Platform API)"
echo "  • M365 Copilot agents (via Microsoft Graph)"
echo "  • Azure AI Foundry endpoints (via Azure Management API)"
echo ""
echo "  Important: Grant these additional permissions as needed:"
echo "  • Power Platform Admin Center → App Registrations"
echo "  • Azure RBAC → Reader on Foundry resource groups"
echo "============================================================"
