# 🚀 GitHub Pages Deployment Setup

This repository is now configured for automatic deployment to GitHub Pages! Follow these simple steps to enable it.

> **💡 Prefer a checklist?** See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for a step-by-step checklist.

## Quick Setup (3 Steps)

### 1. Enable GitHub Pages

1. Go to your repository: https://github.com/Aditya3525/CurrentWorking-mental-wellness-ai-
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Select `GitHub Actions`
4. Click **Save**

### 2. Configure Environment Variables (Optional but Recommended)

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click on the **Variables** tab
3. Add the following repository variables:
   - `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.onrender.com/api`)
   - `VITE_BASE_PATH`: Leave as `/CurrentWorking-mental-wellness-ai-/` for GitHub Pages hosting

**Note**: If you don't set `VITE_API_URL`, the build will use a placeholder value that clearly indicates configuration is needed.

### 3. Deploy Your Site

#### Option A: Automatic Deployment (Recommended)
Simply push to the `main` branch:
```bash
git push origin main
```

#### Option B: Manual Deployment
Use the GitHub Actions interface:
1. Go to the **Actions** tab
2. Select "Deploy to GitHub Pages" workflow
3. Click **Run workflow** → **Run workflow**

## Monitoring Deployment

1. Go to the **Actions** tab in your repository
2. Watch the "Deploy to GitHub Pages" workflow run
3. Once complete (✅), your site will be live at:
   ```
   https://aditya3525.github.io/CurrentWorking-mental-wellness-ai-/
   ```

## What's Been Configured

✅ **GitHub Actions Workflow** (`.github/workflows/free-deploy.yml`)
   - Automatically builds and deploys on push to `main` branch
   - Configured with proper Node.js 18 environment
   - Handles frontend build with environment variables

✅ **Frontend Build Configuration**
   - Vite configured with proper base path support
   - `.nojekyll` file added to prevent Jekyll processing
   - `404.html` for client-side routing support

✅ **Deployment Documentation**
   - Comprehensive `GITHUB_PAGES_DEPLOYMENT.md` guide
   - This setup document for quick reference

## Backend Deployment

**Important**: GitHub Pages only hosts static files (frontend). Your backend needs separate deployment.

### Recommended Backend Hosting Options:

1. **Render** (Free tier available)
   - Easy setup with GitHub integration
   - See backend documentation for deployment details

2. **Railway** (Developer-friendly)
   - Automatic deployments from GitHub
   - Guide: See backend deployment docs

3. **Heroku** / **AWS** / **GCP**
   - For production-grade hosting
   - See respective deployment guides

After deploying your backend, update the `VITE_API_URL` variable in GitHub Actions settings.

## Troubleshooting

### Build Fails
- Check the Actions tab for detailed error logs
- Verify Node.js version is 18+ in the workflow
- Test build locally: `cd frontend && npm run build`

### 404 on Page Refresh
- Expected with client-side routing
- The workflow includes `404.html` fallback
- Alternatively, consider hash routing in React

### API Connection Issues
- Verify `VITE_API_URL` is correctly set in repository variables
- Check CORS settings in your backend
- Ensure backend URL is accessible from browser
- Check browser console for errors

### Deployment Not Triggering
- Ensure GitHub Pages is set to "GitHub Actions" source
- Check that workflow file exists in `.github/workflows/free-deploy.yml`
- Verify you're pushing to the `main` branch

## Additional Resources

- **Detailed Deployment Guide**: `GITHUB_PAGES_DEPLOYMENT.md`
- **Main README**: `README.md`
- **Backend Setup**: `backend/README.md`
- **Environment Setup**: `ENVIRONMENT_SETUP.md`

## Testing Before Deployment

To test the build locally:
```bash
# Install dependencies
cd frontend
npm install

# Build with production settings
VITE_API_URL=https://your-api.com/api VITE_BASE_PATH=/CurrentWorking-mental-wellness-ai-/ npm run build

# Preview the build
npm run preview
```

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `frontend/public/` with your domain
2. Configure DNS with your domain provider
3. Set `VITE_BASE_PATH` to `/` in repository variables
4. Enable HTTPS in repository settings

## Security Notes

- ✅ Never commit API keys or secrets to the repository
- ✅ Use GitHub Secrets for sensitive values
- ✅ Configure proper CORS on your backend
- ✅ Enable HTTPS for production (automatic with GitHub Pages)

---

## Next Steps After Deployment

1. ✅ Test the deployed site thoroughly
2. ✅ Deploy backend to your chosen platform
3. ✅ Update `VITE_API_URL` with production backend URL
4. ✅ Set up monitoring and analytics
5. ✅ Configure custom domain (optional)

Happy deploying! 🎉
