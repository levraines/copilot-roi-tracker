#!/usr/bin/env bash
# ============================================================
# One-click Azure Deployment Script
# Deploys the Copilot Agent ROI Tracker to any Azure tenant
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Docker installed (for building the container image)
#
# Usage:
#   bash infra/scripts/deploy.sh                    # Interactive
#   bash infra/scripts/deploy.sh -g myRG -l eastus  # Non-interactive
# ============================================================
set -euo pipefail

# ---- Parse Arguments ----
RESOURCE_GROUP=""
LOCATION=""
APP_NAME="copilotroi"
SKU="B1"
IMAGE_TAG="latest"

while [[ $# -gt 0 ]]; do
  case $1 in
    -g|--resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    -l|--location) LOCATION="$2"; shift 2 ;;
    -n|--name) APP_NAME="$2"; shift 2 ;;
    -s|--sku) SKU="$2"; shift 2 ;;
    -t|--tag) IMAGE_TAG="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ---- Interactive prompts if not provided ----
if [ -z "$RESOURCE_GROUP" ]; then
  read -rp "📦 Resource Group name [copilot-roi-tracker-rg]: " RESOURCE_GROUP
  RESOURCE_GROUP="${RESOURCE_GROUP:-copilot-roi-tracker-rg}"
fi

if [ -z "$LOCATION" ]; then
  echo ""
  echo "Available regions: eastus, westus2, westeurope, northeurope, centralus, southeastasia"
  read -rp "🌍 Azure region [eastus]: " LOCATION
  LOCATION="${LOCATION:-eastus}"
fi

echo ""
echo "============================================================"
echo "  Copilot Agent ROI Tracker — Azure Deployment"
echo "============================================================"
echo "  Resource Group  : $RESOURCE_GROUP"
echo "  Location        : $LOCATION"
echo "  App Name        : $APP_NAME"
echo "  SKU             : $SKU"
echo "  Image Tag       : $IMAGE_TAG"
echo "============================================================"
echo ""

# ---- Step 1: Create Resource Group ----
echo "1️⃣  Creating Resource Group..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none
echo "   ✅ Resource Group ready"

# ---- Step 2: Deploy Bicep template ----
echo ""
echo "2️⃣  Deploying Azure infrastructure (Bicep)..."
DEPLOY_OUTPUT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters appName="$APP_NAME" location="$LOCATION" appServiceSku="$SKU" imageTag="$IMAGE_TAG" \
  --output json)

# Extract outputs
ACR_NAME=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['properties']['outputs']['acrName']['value'])")
ACR_LOGIN=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['properties']['outputs']['acrLoginServer']['value'])")
WEB_APP_NAME=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['properties']['outputs']['webAppName']['value'])")
WEB_APP_URL=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['properties']['outputs']['webAppUrl']['value'])")
KV_NAME=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['properties']['outputs']['keyVaultName']['value'])")

echo "   ✅ Infrastructure deployed"
echo "   ACR         : $ACR_LOGIN"
echo "   Web App     : $WEB_APP_NAME"
echo "   Key Vault   : $KV_NAME"

# ---- Step 3: Build & push Docker image ----
echo ""
echo "3️⃣  Building Docker image..."
docker build -t "$ACR_LOGIN/$APP_NAME:$IMAGE_TAG" .
echo "   ✅ Image built"

echo ""
echo "4️⃣  Pushing to Azure Container Registry..."
az acr login --name "$ACR_NAME"
docker push "$ACR_LOGIN/$APP_NAME:$IMAGE_TAG"
echo "   ✅ Image pushed"

# ---- Step 4: Restart the App Service to pull new image ----
echo ""
echo "5️⃣  Restarting App Service..."
az webapp restart --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP"
echo "   ✅ App Service restarted"

# ---- Step 5: Wait for health check ----
echo ""
echo "6️⃣  Waiting for app to become healthy..."
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_APP_URL/api/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "   ✅ App is healthy!"
    break
  fi
  echo "   ⏳ Attempt $i/30 (status: $STATUS)..."
  sleep 10
done

# ---- Done ----
echo ""
echo "============================================================"
echo "  ✅  Deployment Complete!"
echo "============================================================"
echo ""
echo "  🌐 App URL      : $WEB_APP_URL"
echo "  📦 ACR           : $ACR_LOGIN"
echo "  🔐 Key Vault     : $KV_NAME"
echo "  🖥️  Web App       : $WEB_APP_NAME"
echo ""
echo "  Next steps:"
echo "  1. Register an Azure AD app (if you haven't):"
echo "     bash infra/scripts/register-app.sh"
echo ""
echo "  2. Store the app credentials in Key Vault:"
echo "     az keyvault secret set --vault-name $KV_NAME --name ms-client-id --value <CLIENT_ID>"
echo "     az keyvault secret set --vault-name $KV_NAME --name ms-client-secret --value <SECRET>"
echo ""
echo "  3. Open the dashboard:"
echo "     $WEB_APP_URL"
echo ""
echo "  4. Add your customer's redirect URI:"
echo "     az ad app update --id <APP_ID> --web-redirect-uris $WEB_APP_URL/auth/callback"
echo ""
echo "============================================================"
