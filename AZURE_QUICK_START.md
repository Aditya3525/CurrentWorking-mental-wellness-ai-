# 🚀 Azure Deployment Quick Start Checklist

## ✅ Pre-Deployment Checklist

### 🎓 Student Benefits
- [ ] Claimed Azure Student Pack ($100 credit)
- [ ] Verified student status
- [ ] Have access to Azure Portal

### 💻 Local Setup  
- [ ] Node.js 18+ installed
- [ ] Git initialized in project
- [ ] Azure CLI installed
- [ ] Logged into Azure CLI (`az login`)

### 🔑 API Keys Ready
- [ ] Gemini API key (if using)
- [ ] OpenAI API key (if using)
- [ ] Anthropic API key (if using)

---

## 🚀 Deployment Steps

### Step 1: Run Setup Script
```powershell
.\azure-setup.ps1
```

### Step 2: GitHub Secrets Configuration
Add these secrets in your GitHub repository (Settings > Secrets):

**Required Secrets:**
- [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN` (from Static Web App deployment center)
- [ ] `AZURE_WEBAPP_PUBLISH_PROFILE` (download from App Service)
- [ ] `AZURE_APP_SERVICE_NAME` (your backend app service name)
- [ ] `AZURE_DATABASE_URL` (PostgreSQL connection string)
- [ ] `AZURE_FRONTEND_URL` (Static Web App URL)
- [ ] `AZURE_BACKEND_URL` (App Service URL)

**Optional Secrets (for AI features):**
- [ ] `GEMINI_API_KEY` 
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`

### Step 3: Push to GitHub
```bash
git add .
git commit -m "Azure deployment setup"
git push origin main
```

### Step 4: Monitor Deployment
- [ ] Check GitHub Actions tab for deployment status
- [ ] Verify frontend deploys to Static Web App
- [ ] Verify backend deploys to App Service
- [ ] Check database migrations run successfully

---

## 🔧 Configuration URLs

### Azure Portal Links:
- **Resource Group**: `https://portal.azure.com/#view/HubsExtension/BrowseResourceGroups`
- **Static Web Apps**: `https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FStaticSites`
- **App Services**: `https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2Fsites`
- **Databases**: `https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.DBforPostgreSQL%2FflexibleServers`

### GitHub Configuration:
- **Secrets**: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
- **Actions**: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

---

## 🎯 Expected Results

### After Successful Deployment:

**Frontend (Static Web App):**
- [ ] Accessible at: `https://your-app-name.azurestaticapps.net`
- [ ] Loads React application
- [ ] Shows proper styling and components
- [ ] HTTPS enabled automatically

**Backend (App Service):**
- [ ] Accessible at: `https://your-app-name.azurewebsites.net`
- [ ] Health check endpoint works: `/health`
- [ ] API endpoints respond: `/api/auth`, `/api/chat`, etc.
- [ ] Database connection successful

**Database (PostgreSQL):**
- [ ] Tables created from Prisma migrations
- [ ] Connection secure with SSL
- [ ] Accessible from App Service

**Automatic Deployments:**
- [ ] Git push triggers deployment
- [ ] GitHub Actions run successfully
- [ ] Changes appear on live site within 5-10 minutes

---

## 🆘 Troubleshooting Quick Fixes

### Common Issues:

**Build Failures:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database Connection Issues:**
```bash
# Test connection string
az postgres flexible-server connect --name YOUR_DB_NAME --admin-user dbadmin
```

**App Service Not Starting:**
```bash
# Check logs
az webapp log tail --name YOUR_APP_NAME --resource-group mental-wellness-rg

# Restart app
az webapp restart --name YOUR_APP_NAME --resource-group mental-wellness-rg
```

**Static Web App Build Failing:**
- Check `frontend/package.json` build script
- Verify output directory is `dist`
- Check environment variables in Azure Portal

---

## 📊 Monitoring & Management

### Daily Checks:
- [ ] Application Insights for performance
- [ ] Azure Monitor for uptime
- [ ] Check remaining Azure credit balance

### Weekly Reviews:
- [ ] Review error logs in Application Insights
- [ ] Check database performance metrics
- [ ] Monitor API response times

### Monthly Tasks:
- [ ] Review Azure billing and usage
- [ ] Update dependencies if needed
- [ ] Review security recommendations

---

## 💡 Pro Tips

1. **Cost Management:**
   - Use Azure Cost Management to track spending
   - Set up billing alerts at 80% of credit
   - Monitor resource usage regularly

2. **Performance:**
   - Enable Application Insights for detailed metrics
   - Use Azure CDN for static assets
   - Configure auto-scaling rules

3. **Security:**
   - Enable Azure Security Center recommendations
   - Use Azure Key Vault for sensitive configuration
   - Regularly update dependencies

4. **Backup:**
   - Configure automated database backups
   - Use Azure DevOps for more complex pipelines
   - Keep deployment scripts in version control

---

## 🎉 Success Checklist

Your deployment is successful when:

- [ ] ✅ Frontend loads at Azure Static Web App URL
- [ ] ✅ Backend API responds at Azure App Service URL  
- [ ] ✅ Database connections work
- [ ] ✅ AI chat functionality works (if configured)
- [ ] ✅ GitHub Actions deploy automatically on push
- [ ] ✅ HTTPS certificates are active
- [ ] ✅ Application Insights shows telemetry

**Congratulations! Your Mental Wellbeing AI App is now live on Microsoft Azure! 🚀**

---

## 📞 Support Resources

- **Azure Documentation**: https://docs.microsoft.com/azure
- **Azure Support**: https://azure.microsoft.com/support
- **Student Support**: https://azure.microsoft.com/support/student
- **GitHub Actions**: https://docs.github.com/actions
