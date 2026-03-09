#!/usr/bin/env bash
# ============================================================
# Register Azure AD (Microsoft Entra ID) App for the ROI Tracker
# This creates a multi-tenant app registration with the
# permissions needed to scan Copilot Studio, M365, and Foundry.
#
# Prerequisites: az cli logged in with admin consent capability
# Usage: bash infra/scripts/register-app.sh [app-name]
# ============================================================
set -euo pipefail

APP_NAME="${1:-Copilot Agent ROI Tracker}"
echo "📝 Registering Azure AD App: $APP_NAME"

# ---- Create the App Registration (multi-tenant) ----
APP_JSON=$(az ad app create \
  --display-name "$APP_NAME" \
  --sign-in-audience AzureADMultipleOrgs \
  --web-redirect-uris "https://localhost:8080/auth/callback" \
  --enable-id-token-issuance true \
  --required-resource-accesses '[
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        { "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d", "type": "Scope" },
        { "id": "14dad69e-099b-42c9-810b-d002981feec1", "type": "Scope" },
        { "id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61", "type": "Role" }
      ]
    }
  ]' \
  --output json)

APP_ID=$(echo "$APP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['appId'])")
OBJECT_ID=$(echo "$APP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
TENANT_ID=$(az account show --query tenantId -o tsv)

echo "✅ App Registration created"
echo "   App (Client) ID : $APP_ID"
echo "   Object ID       : $OBJECT_ID"
echo "   Tenant ID       : $TENANT_ID"

# ---- Create a Client Secret ----
SECRET_JSON=$(az ad app credential reset \
  --id "$OBJECT_ID" \
  --display-name "ROI-Tracker-Secret" \
  --years 2 \
  --output json)

CLIENT_SECRET=$(echo "$SECRET_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")

echo ""
echo "🔑 Client Secret created (valid 2 years)"
echo "   ⚠️  Save this now — it won't be shown again!"
echo ""

# ---- Create a Service Principal ----
az ad sp create --id "$APP_ID" --output none 2>/dev/null || true
echo "✅ Service Principal created"

# ---- Output summary ----
echo ""
echo "============================================================"
echo "  Azure AD App Registration — Summary"
echo "============================================================"
echo ""
echo "  APP_NAME        = $APP_NAME"
echo "  TENANT_ID       = $TENANT_ID"
echo "  CLIENT_ID       = $APP_ID"
echo "  CLIENT_SECRET   = $CLIENT_SECRET"
echo "  OBJECT_ID       = $OBJECT_ID"
echo ""
echo "  Next steps:"
echo "  1. Store CLIENT_ID and CLIENT_SECRET in your Key Vault:"
echo ""
echo "     az keyvault secret set --vault-name <your-kv> --name ms-client-id --value $APP_ID"
echo "     az keyvault secret set --vault-name <your-kv> --name ms-client-secret --value \"$CLIENT_SECRET\""
echo ""
echo "  2. Grant admin consent for the API permissions:"
echo ""
echo "     az ad app permission admin-consent --id $APP_ID"
echo ""
echo "  3. For each customer tenant, they need to consent to:"
echo "     https://login.microsoftonline.com/common/adminconsent?client_id=$APP_ID"
echo ""
echo "============================================================"
echo ""
echo "  API Permissions requested:"
echo "  • Microsoft Graph — User.Read (delegated)"
echo "  • Microsoft Graph — Directory.Read.All (delegated)"
echo "  • Microsoft Graph — Directory.Read.All (application)"
echo ""
echo "  Additional permissions you may want to add manually:"
echo "  • Power Platform API — for Copilot Studio scanning"
echo "  • Azure Management API — for Azure AI Foundry scanning"
echo "============================================================"
