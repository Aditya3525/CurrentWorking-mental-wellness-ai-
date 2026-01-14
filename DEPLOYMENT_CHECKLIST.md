# ✅ GitHub Deployment Checklist

Use this checklist to ensure your GitHub Pages deployment is set up correctly.

## Pre-Deployment Setup

- [ ] Repository is on GitHub (https://github.com/Aditya3525/CurrentWorking-mental-wellness-ai-)
- [ ] Code is pushed to the `main` branch
- [ ] You have admin access to the repository

## GitHub Pages Configuration

### Step 1: Enable GitHub Pages
- [ ] Go to repository **Settings**
- [ ] Click on **Pages** in the left sidebar
- [ ] Under "Build and deployment":
  - [ ] Set Source to **GitHub Actions**
  - [ ] Save changes

### Step 2: Configure Environment Variables (Optional)
- [ ] Go to **Settings** → **Secrets and variables** → **Actions**
- [ ] Click the **Variables** tab
- [ ] Add `VITE_API_URL` with your backend URL (e.g., `https://your-backend.onrender.com/api`)
- [ ] Verify `VITE_BASE_PATH` is set (default: `/CurrentWorking-mental-wellness-ai-/`)

## Trigger Deployment

Choose one option:

### Option A: Push to Main Branch
- [ ] Ensure you're on the main branch: `git branch`
- [ ] Push your changes: `git push origin main`

### Option B: Manual Workflow Trigger
- [ ] Go to **Actions** tab
- [ ] Select "Deploy to GitHub Pages"
- [ ] Click **Run workflow**
- [ ] Click **Run workflow** button

## Verify Deployment

- [ ] Go to **Actions** tab
- [ ] Watch the "Deploy to GitHub Pages" workflow
- [ ] Wait for the green checkmark (✅)
- [ ] Visit your site: https://aditya3525.github.io/CurrentWorking-mental-wellness-ai-/

## Post-Deployment Checks

### Frontend Testing
- [ ] Site loads without errors
- [ ] All pages are accessible
- [ ] Client-side routing works (refresh page test)
- [ ] No console errors in browser developer tools

### Backend Connection (If Configured)
- [ ] API calls are reaching the backend
- [ ] Check browser Network tab for API requests
- [ ] Verify CORS is configured on backend
- [ ] Authentication flows work correctly

## Troubleshooting

If deployment fails, check:
- [ ] Review **Actions** tab for error messages
- [ ] Verify Node.js version is 18+ in workflow
- [ ] Test build locally: `cd frontend && npm run build`
- [ ] Check that `.nojekyll` file exists in `frontend/public/`

If site loads but API calls fail:
- [ ] Verify `VITE_API_URL` is set correctly in repository variables
- [ ] Check backend CORS configuration
- [ ] Ensure backend is deployed and accessible
- [ ] Check browser console for CORS or network errors

## Backend Deployment (Separate)

GitHub Pages only hosts the frontend. Deploy backend separately:

- [ ] Choose a backend hosting platform:
  - [ ] Render (free tier available)
  - [ ] Railway
  - [ ] Heroku
  - [ ] AWS / GCP / Azure

- [ ] Deploy backend following platform-specific guide
- [ ] Update `VITE_API_URL` in GitHub Actions variables
- [ ] Configure CORS to allow your GitHub Pages domain
- [ ] Test backend API endpoints independently

## Documentation Reference

- **Quick Setup**: [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
- **Detailed Guide**: [GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md)
- **Main README**: [README.md](./README.md)
- **Backend Setup**: [backend/README.md](./backend/README.md)

## Support

If you encounter issues:
1. Check the documentation files listed above
2. Review GitHub Actions logs for errors
3. Test the build locally
4. Verify all configuration steps were followed

---

**Your GitHub Pages URL**: https://aditya3525.github.io/CurrentWorking-mental-wellness-ai-/

Happy deploying! 🎉
