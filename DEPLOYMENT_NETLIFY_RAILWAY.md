# Netlify + Railway Deployment Guide

## Frontend (Netlify)
Netlify is perfect for React apps with automatic deployments.

### Steps:
1. Create account at netlify.com
2. Connect your GitHub repository
3. Build settings:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
   - Environment variables:
     ```
     VITE_API_URL=https://your-backend-app.railway.app
     ```

## Backend (Railway)
Railway is excellent for Node.js backend with database.

### Steps:
1. Create account at railway.app
2. Create new project from GitHub repository
3. Add PostgreSQL database service
4. Configure environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=https://your-netlify-app.netlify.app
   PORT=${{PORT}}
   
   # AI API Keys
   GEMINI_API_KEY_1=your_gemini_api_key
   OPENAI_API_KEY_1=your_openai_api_key
   ANTHROPIC_API_KEY_1=your_anthropic_api_key
   ```

5. Build settings:
   - Build command: `npm run build`
   - Start command: `npm run start`
   - Root directory: `/backend`

## Auto-deployment:
- Both platforms auto-deploy on git push
- Preview deployments available
- Easy rollbacks
