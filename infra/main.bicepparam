// ============================================================
// Parameters file for Bicep deployment
// Copy this to main.bicepparam and fill in your values
// ============================================================

using './main.bicep'

param appName = 'copilotroi'
param location = 'eastus'
param appServiceSku = 'B1'
param defaultHourlyRate = 50
param organizationName = 'My Organization'
// param tenantId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'  // Defaults to current subscription tenant
