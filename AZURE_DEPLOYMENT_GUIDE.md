# 🚀 Microsoft Azure Deployment Guide (GitHub Student Pack)

## 🎯 Why Azure is Perfect for Students

With GitHub Student Pack, you get:
- ✅ **$100 FREE Azure credit**
- ✅ **Free Azure services** (App Service, Database, etc.)
- ✅ **Professional enterprise tools** (same as Fortune 500 companies)
- ✅ **Resume boost** (Microsoft Azure experience)
- ✅ **Automatic deployments** from GitHub
- ✅ **Global scale** with CDN and multiple regions

## 💰 What You Get FREE:

| Service | Regular Cost | Student Pack | Value |
|---------|--------------|--------------|-------|
| **Azure App Service** | $13-50/month | **FREE** | $600/year |
| **Azure Database** | $5-30/month | **FREE** | $360/year |
| **Azure Storage** | $2-10/month | **FREE** | $120/year |
| **Azure CDN** | $5-20/month | **FREE** | $240/year |
| **Total Value** | **$25-110/month** | **FREE** | **$1,320/year** |

---

## 🎓 Step 1: Claim Your Azure Student Benefits (5 minutes)

### Option A: Azure for Students (Ages 18+)
1. Go to [azure.microsoft.com/students](https://azure.microsoft.com/students)
2. Sign in with your student email or GitHub account
3. Verify student status
4. Get **$100 credit + free services**

### Option B: GitHub Student Pack
1. Go to [education.github.com/pack](https://education.github.com/pack)
2. Find **"Microsoft Azure"** in the offers
3. Click **"Free access to 25+ Microsoft Azure cloud services plus $100 in Azure credit"**
4. Activate your Azure account

---

## 🚀 Step 2: Deploy Frontend (Azure Static Web Apps - FREE)

### 2.1 Create Static Web App
```bash
# Install Azure CLI
winget install Microsoft.AzureCLI

# Login to Azure
az login

# Create resource group
az group create --name mental-wellness-rg --location "East US"

# Create static web app
az staticwebapp create \
  --name mental-wellness-frontend \
  --resource-group mental-wellness-rg \
  --source https://github.com/yourusername/your-repo-name \
  --location "East US2" \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist"
```

### 2.2 Automatic Frontend Deployment
Azure will automatically:
- ✅ Build your React app on every git push
- ✅ Deploy to global CDN
- ✅ Provide HTTPS certificate
- ✅ Give you a URL like: `https://mental-wellness-frontend.azurestaticapps.net`

---

## 🗄️ Step 3: Deploy Backend (Azure App Service - FREE)

### 3.1 Create App Service
```bash
# Create App Service plan (FREE tier)
az appservice plan create \
  --name mental-wellness-plan \
  --resource-group mental-wellness-rg \
  --sku FREE \
  --is-linux

# Create web app
az webapp create \
  --name mental-wellness-api \
  --resource-group mental-wellness-rg \
  --plan mental-wellness-plan \
  --runtime "NODE:18-lts"
```

### 3.2 Configure Continuous Deployment
```bash
# Enable GitHub deployment
az webapp deployment source config \
  --name mental-wellness-api \
  --resource-group mental-wellness-rg \
  --repo-url https://github.com/yourusername/your-repo-name \
  --branch main \
  --manual-integration
```

---

## 🗃️ Step 4: Setup Database (Azure Database for PostgreSQL - FREE)

### 4.1 Create PostgreSQL Database
```bash
# Create PostgreSQL server (Flexible Server - has free tier)
az postgres flexible-server create \
  --resource-group mental-wellness-rg \
  --name mental-wellness-db \
  --location "East US" \
  --admin-user dbadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32
```

### 4.2 Create Database
```bash
# Create the actual database
az postgres flexible-server db create \
  --resource-group mental-wellness-rg \
  --server-name mental-wellness-db \
  --database-name mental_wellbeing_db
```

---

## ⚙️ Step 5: Configure Environment Variables

### 5.1 Set App Service Environment Variables
```bash
# Configure backend environment variables
az webapp config appsettings set \
  --name mental-wellness-api \
  --resource-group mental-wellness-rg \
  --settings \
    NODE_ENV=production \
    JWT_SECRET="your_super_secret_jwt_key_here" \
    DATABASE_URL="postgresql://dbadmin:YourSecurePassword123!@mental-wellness-db.postgres.database.azure.com:5432/mental_wellbeing_db?sslmode=require" \
    FRONTEND_URL="https://mental-wellness-frontend.azurestaticapps.net" \
    GEMINI_API_KEY_1="your_gemini_api_key" \
    OPENAI_API_KEY_1="your_openai_api_key" \
    AI_PROVIDER_PRIORITY="gemini,openai,anthropic" \
    AI_MAX_TOKENS="150" \
    AI_TEMPERATURE="0.7"
```

### 5.2 Configure Frontend Environment
```bash
# Set Static Web App environment variables
az staticwebapp appsettings set \
  --name mental-wellness-frontend \
  --setting-names VITE_API_URL="https://mental-wellness-api.azurewebsites.net/api"
```

---

## 🔧 Step 6: Automated Deployment Setup

### 6.1 Create GitHub Actions Workflow
Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install and build frontend
      run: |
        cd frontend
        npm ci
        npm run build
    
    - name: Deploy to Azure Static Web Apps
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "/frontend"
        output_location: "dist"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install and build backend
      run: |
        cd backend
        npm ci
        npm run build
    
    - name: Deploy to Azure App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'mental-wellness-api'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './backend'
```

---

## 🌍 Step 7: Custom Domain & SSL (Optional but FREE)

### 7.1 Add Custom Domain
```bash
# Add custom domain to Static Web App
az staticwebapp hostname set \
  --name mental-wellness-frontend \
  --hostname your-domain.com

# Add custom domain to App Service
az webapp config hostname add \
  --name mental-wellness-api \
  --resource-group mental-wellness-rg \
  --hostname api.your-domain.com
```

### 7.2 Enable SSL (Automatic)
Azure automatically provides FREE SSL certificates for all domains!

---

## 📊 Step 8: Monitoring & Analytics (FREE)

### 8.1 Enable Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app mental-wellness-insights \
  --location "East US" \
  --resource-group mental-wellness-rg \
  --application-type web

# Link to App Service
az webapp config appsettings set \
  --name mental-wellness-api \
  --resource-group mental-wellness-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-instrumentation-key"
```

---

## 🎯 Final Result

After setup, you'll have:

### **🌐 Live URLs:**
- **Frontend**: `https://mental-wellness-frontend.azurestaticapps.net`
- **Backend API**: `https://mental-wellness-api.azurewebsites.net`
- **Database**: Managed PostgreSQL in Azure

### **🔄 Automatic Deployments:**
- Every `git push` → Automatic deployment
- Separate staging/production environments
- Rollback capabilities

### **📈 Professional Features:**
- Global CDN (super fast worldwide)
- Auto-scaling based on traffic
- 99.9% uptime SLA
- Professional monitoring and logs
- Security scanning and SSL

### **💰 Cost Breakdown:**
- **First year**: FREE ($100 credit covers everything)
- **After credit**: ~$5-15/month (still very affordable)
- **Enterprise features**: Included for FREE

---

## 🆘 Troubleshooting

### Common Issues:
1. **Build fails**: Check Node.js version (should be 18+)
2. **Database connection**: Verify connection string and firewall rules
3. **CORS errors**: Make sure FRONTEND_URL is set correctly
4. **Environment variables**: Double-check all required variables are set

### Useful Commands:
```bash
# Check App Service logs
az webapp log tail --name mental-wellness-api --resource-group mental-wellness-rg

# Restart App Service
az webapp restart --name mental-wellness-api --resource-group mental-wellness-rg

# Check Static Web App status
az staticwebapp show --name mental-wellness-frontend --resource-group mental-wellness-rg
```

---

## 🎓 Learning Benefits

By using Azure, you'll learn:
- ✅ **Cloud architecture** (enterprise-level)
- ✅ **DevOps practices** (CI/CD pipelines)
- ✅ **Database management** (PostgreSQL in cloud)
- ✅ **Monitoring and logging** (Application Insights)
- ✅ **Security best practices** (Azure security features)

**This is the same technology stack used by major companies like Stack Overflow, GE Aviation, and H&R Block!**

---

## 🚀 Quick Start Summary

1. **Claim Azure Student benefits**
2. **Install Azure CLI**
3. **Run the deployment commands**
4. **Configure environment variables**
5. **Push to GitHub → Automatic deployment!**

**Your professional-grade Mental Wellbeing AI App will be live on Microsoft Azure! 🎉**
