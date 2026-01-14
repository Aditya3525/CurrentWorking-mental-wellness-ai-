# GitHub Pages Deployment Guide

This guide will help you deploy the MaanaSarathi frontend application to GitHub Pages.

## Prerequisites

- Repository hosted on GitHub
- Node.js 18+ installed locally
- GitHub Pages enabled in repository settings

## Automatic Deployment via GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/free-deploy.yml`) that automatically deploys the frontend to GitHub Pages when changes are pushed to the `main` branch.

### Steps to Enable GitHub Pages

1. **Enable GitHub Pages in Repository Settings**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: Select **GitHub Actions**
   - Save the settings

2. **Configure Environment Variables (Optional)**
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Under "Variables" tab, add:
     - `VITE_API_URL`: Your backend API URL (e.g., `https://api.example.com/api`)
   - If not set, it will default to `https://api.example.com/api`

3. **Configure Base Path (If Using Repo Hosting)**
   
   If your GitHub Pages site is hosted at `https://username.github.io/repo-name/` (repository hosting):
   - Update the workflow file to set `VITE_BASE_PATH`:
     ```yaml
     - name: Build frontend
       run: |
         cd frontend
         npm run build
       env:
         VITE_API_URL: ${{ vars.VITE_API_URL }}
         VITE_BASE_PATH: /CurrentWorking-mental-wellness-ai-/
     ```
   
   If using a custom domain or organization pages (`https://username.github.io/`):
   - No base path configuration needed (defaults to `/`)

4. **Push Changes to Main Branch**
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

5. **Monitor Deployment**
   - Go to the **Actions** tab in your repository
   - Watch the "Deploy to GitHub Pages" workflow run
   - Once complete, your site will be live at:
     - Custom domain: `https://your-domain.com`
     - Organization pages: `https://username.github.io`
     - Repository pages: `https://username.github.io/repo-name`

## Manual Local Build and Deploy

If you prefer to deploy manually:

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Build the Frontend**
   ```bash
   # For root deployment
   npm run build

   # For repository hosting
   VITE_BASE_PATH=/CurrentWorking-mental-wellness-ai-/ npm run build
   ```

3. **Deploy Using gh-pages Package**
   ```bash
   # Install gh-pages
   npm install -D gh-pages

   # Deploy
   npx gh-pages -d dist
   ```

## Backend Deployment

**Important:** GitHub Pages can only host static files (frontend). Your backend needs to be deployed separately on a service that supports Node.js applications:

- **Recommended Options:**
  - [Render](https://render.com) - See `RENDER_DEPLOYMENT_GUIDE.md`
  - [Railway](https://railway.app)
  - [Heroku](https://heroku.com)
  - [AWS/GCP](AWS_GCP_DEPLOYMENT_GUIDE.md)

After deploying your backend, update the `VITE_API_URL` environment variable in GitHub Actions to point to your backend URL.

## Troubleshooting

### 404 Errors on Page Refresh

If you get 404 errors when refreshing pages:
- This is expected with client-side routing on GitHub Pages
- The workflow includes a fallback mechanism in the build
- Alternatively, consider using hash routing in your React app

### Build Failures

If the GitHub Actions workflow fails:
1. Check the Actions tab for detailed error logs
2. Verify all dependencies are correctly listed in `package.json`
3. Ensure Node.js version is 18+ in the workflow
4. Test the build locally: `cd frontend && npm run build`

### API Connection Issues

If the frontend can't connect to the API:
1. Verify `VITE_API_URL` is correctly set in repository variables
2. Check CORS settings in your backend
3. Ensure backend URL is accessible from the browser
4. Check browser console for detailed error messages

## Custom Domain Setup

To use a custom domain:

1. Add a `CNAME` file to `frontend/public/` with your domain:
   ```
   your-domain.com
   ```

2. Configure DNS settings with your domain provider:
   - Add a CNAME record pointing to `username.github.io`
   - Or A records pointing to GitHub Pages IPs

3. Enable HTTPS in repository settings (recommended)

## Security Considerations

- Never commit sensitive API keys or secrets to the repository
- Use GitHub Secrets for sensitive environment variables
- Configure proper CORS headers on your backend
- Enable HTTPS for production deployments
- Review security best practices in `HELP_SAFETY_DEPLOYMENT_CHECKLIST.md`

## Next Steps

After deploying to GitHub Pages:

1. **Test the deployment** - Visit your GitHub Pages URL and test all features
2. **Set up monitoring** - Consider using services like Sentry for error tracking
3. **Configure analytics** - Implement usage analytics (see `ANALYTICS_IMPLEMENTATION_COMPLETE.md`)
4. **Backend deployment** - Deploy your backend following the appropriate guide
5. **Custom domain** - Set up a custom domain if desired

For more information, see:
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- Repository-specific guides: `RENDER_DEPLOYMENT_GUIDE.md`, `AWS_GCP_DEPLOYMENT_GUIDE.md`
