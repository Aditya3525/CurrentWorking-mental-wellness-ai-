# 🎯 BEST FREE DEPLOYMENT: GitHub Pages + Heroku

## Why This is Perfect:
✅ **100% FREE** for 2+ years  
✅ **$312 value** from Heroku Student Pack  
✅ **Automatic deployments** from GitHub  
✅ **Professional hosting** with custom domains  
✅ **PostgreSQL database** included  

## Step-by-Step Setup:

### Phase 1: Claim Your Student Benefits (5 minutes)

1. **Heroku Student Pack**:
   - Go to: [education.github.com/pack](https://education.github.com/pack)
   - Find "Heroku" in the list
   - Click "Enjoy a credit of $13 USD per month for 24 months"
   - Sign up with your GitHub account

### Phase 2: Prepare Frontend for GitHub Pages (5 minutes)

1. **Update package.json** to set the correct base path:
   ```json
   {
     "homepage": "https://yourusername.github.io/your-repo-name"
   }
   ```

2. **Build command** will be:
   ```bash
   npm run build
   ```

### Phase 3: Deploy Backend to Heroku (10 minutes)

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and create app**:
   ```bash
   heroku login
   heroku create your-mental-wellness-api
   ```

3. **Add PostgreSQL database** (FREE with Student Pack):
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_super_secret_jwt_key
   heroku config:set FRONTEND_URL=https://yourusername.github.io/your-repo-name
   # Add your AI API keys
   heroku config:set GEMINI_API_KEY_1=your_gemini_key
   heroku config:set OPENAI_API_KEY_1=your_openai_key
   ```

### Phase 4: Deploy Frontend to GitHub Pages (5 minutes)

1. **Enable GitHub Pages**:
   - Go to your GitHub repo → Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages (we'll create this)

2. **Auto-deploy with GitHub Actions**:
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node
           uses: actions/setup-node@v3
           with:
             node-version: '18'
         - name: Install and Build
           run: |
             cd frontend
             npm install
             npm run build
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./frontend/dist
   ```

## 🎉 RESULT:
- **Frontend**: https://yourusername.github.io/your-repo-name
- **Backend**: https://your-mental-wellness-api.herokuapp.com
- **Database**: PostgreSQL (managed by Heroku)
- **Cost**: $0 for 2+ years
- **Auto-deploy**: Every git push = live update

## Alternative: DigitalOcean ($200 FREE Credit)

**Even Better Option**:
- **DigitalOcean**: $200 FREE credit (40 months of $5 droplet)
- **Full control**: Ubuntu server, Docker, custom setup
- **Professional**: Same as enterprise companies use

### Quick DigitalOcean Setup:
1. Claim $200 credit from Student Pack
2. Create $5 droplet (Ubuntu 22.04)
3. Use provided Docker setup
4. 40 months of free hosting!

## 🚀 RECOMMENDATION:

**Start with GitHub Pages + Heroku** (easier)
**Upgrade to DigitalOcean** later (more professional)

Both are completely FREE with Student Pack!
