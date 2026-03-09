// ============================================================
// Copilot Agent ROI Tracker — Azure Bicep Main Template
// Deploys: App Service (Linux Container), Container Registry,
//          Key Vault, App Registration, Managed Identity
// ============================================================

targetScope = 'resourceGroup'

@description('Base name for all resources (lowercase, no spaces)')
@minLength(3)
@maxLength(20)
param appName string = 'copilotroi'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Container image tag')
param imageTag string = 'latest'

@description('App Service Plan SKU')
@allowed(['B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1v3', 'P2v3'])
param appServiceSku string = 'B1'

@description('Microsoft Entra ID Tenant ID for authentication')
param tenantId string = subscription().tenantId

@description('Default hourly rate for ROI calculations')
param defaultHourlyRate int = 50

@description('Organization name')
param organizationName string = 'My Organization'

// ---- Naming Convention ----
var uniqueSuffix = uniqueString(resourceGroup().id, appName)
var acrName = '${appName}acr${uniqueSuffix}'
var appServicePlanName = '${appName}-plan'
var webAppName = '${appName}-app-${uniqueSuffix}'
var keyVaultName = '${appName}-kv-${take(uniqueSuffix, 8)}'
var managedIdentityName = '${appName}-identity'

// ============================================================
// Managed Identity — used by App Service to pull from ACR & read Key Vault
// ============================================================
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
}

// ============================================================
// Azure Container Registry
// ============================================================
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// ACR Pull role for Managed Identity
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, managedIdentity.id, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================================
// Key Vault — stores secrets (client secrets, connection strings)
// ============================================================
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// Key Vault Secrets User role for Managed Identity
resource kvSecretsRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, managedIdentity.id, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================================
// App Service Plan (Linux)
// ============================================================
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: appServiceSku
  }
  properties: {
    reserved: true // Linux
  }
}

// ============================================================
// App Service (Web App for Containers)
// ============================================================
resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app,linux,container'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/${appName}:${imageTag}'
      acrUseManagedIdentityCreds: true
      acrUserManagedIdentityID: managedIdentity.properties.clientId
      alwaysOn: appServiceSku != 'B1'
      healthCheckPath: '/api/health'
      appSettings: [
        { name: 'NODE_ENV', value: 'production' }
        { name: 'PORT', value: '8080' }
        { name: 'WEBSITES_PORT', value: '8080' }
        { name: 'DB_DIR', value: '/home/data' }
        { name: 'STATIC_DIR', value: '/app/public' }
        { name: 'MS_TENANT_ID', value: tenantId }
        { name: 'DEFAULT_HOURLY_RATE', value: string(defaultHourlyRate) }
        { name: 'ORGANIZATION_NAME', value: organizationName }
        // Key Vault references (secrets stored in KV, referenced here)
        { name: 'MS_CLIENT_ID', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=ms-client-id)' }
        { name: 'MS_CLIENT_SECRET', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=ms-client-secret)' }
      ]
    }
  }
  dependsOn: [acrPullRole]
}

// Persistent storage mount for SQLite
resource webAppStorage 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: webApp
  name: 'azurestorageaccounts'
  properties: {}
}

// ============================================================
// Outputs
// ============================================================
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppName string = webApp.name
output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output managedIdentityClientId string = managedIdentity.properties.clientId
output managedIdentityPrincipalId string = managedIdentity.properties.principalId
