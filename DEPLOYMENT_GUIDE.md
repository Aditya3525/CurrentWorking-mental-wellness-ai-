# 🚀 Complete Deployment Guide for Mental Wellbeing AI App

## Overview
This guide provides multiple deployment options for your full-stack Mental Wellbeing AI App with **automatic deployments** that reflect changes when you push code.

## 🎯 Recommended Deployment Strategy

### Option 1: Vercel (Easiest) ⭐⭐⭐
**Best for beginners, handles both frontend and backend**

#### Steps:
1. **Prepare your repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

2. **Database Setup:**
   - Go to [Neon](https://neon.tech) or [Supabase](https://supabase.com)
   - Create a PostgreSQL database
   - Copy the connection string

3. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up and connect your GitHub account
   - Import your repository
   - Configure environment variables (see below)
   - Deploy!

4. **Environment Variables for Vercel:**
   ```
   NODE_ENV=production
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_super_secret_jwt_key_change_this
   FRONTEND_URL=https://your-app-name.vercel.app
   
   # AI API Keys
   GEMINI_API_KEY_1=your_gemini_api_key
   OPENAI_API_KEY_1=your_openai_api_key
   ANTHROPIC_API_KEY_1=your_anthropic_api_key
   
   AI_PROVIDER_PRIORITY=gemini,openai,anthropic
   AI_MAX_TOKENS=150
   AI_TEMPERATURE=0.7
   AI_TIMEOUT=30000
   ```

### Option 2: Netlify + Railway (More Control) ⭐⭐
**Separate frontend and backend deployment**

#### Frontend (Netlify):
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Build settings:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
   - Environment: `VITE_API_URL=https://your-backend.railway.app`

#### Backend (Railway):
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Add PostgreSQL database
4. Set environment variables (same as above)
5. Root directory: `/backend`

### Option 3: Docker + DigitalOcean/AWS ⭐
**For advanced users who want full control**

## 🔧 Pre-Deployment Setup

### 1. Update Backend for Production
Add this to your `backend/src/server.ts`:

```typescript
// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}
```

### 2. Update Package.json Scripts
Add these to your root `package.json`:

```json
{
  "scripts": {
    "deploy:vercel": "vercel --prod",
    "deploy:netlify": "cd frontend && npm run build && netlify deploy --prod",
    "postbuild": "cd backend && npx prisma migrate deploy"
  }
}
```

## 🔄 Automatic Deployments

### Git-based Auto Deployment:
1. **Push to main branch** = automatic production deployment
2. **Push to other branches** = preview deployments
3. **Pull requests** = preview deployments with URL

### Example workflow:
```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push origin main
# 🎉 Your changes are now live!
```

## 🗄️ Database Migration in Production

For database changes:
```bash
# Add this to your deployment pipeline
npx prisma migrate deploy
npx prisma generate
```

## 🌐 Custom Domain Setup

### For Vercel:
1. Go to your project settings
2. Add custom domain
3. Configure DNS records

### For Netlify:
1. Site settings > Domain management
2. Add custom domain
3. Configure DNS

## 🔒 Environment Variables Security

### Required Variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong random string (use: `openssl rand -base64 32`)
- AI API keys for your chosen providers
- `FRONTEND_URL`: Your frontend domain

### Optional but Recommended:
- `RATE_LIMIT_MAX_REQUESTS=100`
- `RATE_LIMIT_WINDOW_MS=900000`
- `LOG_LEVEL=info`

## 📊 Monitoring & Analytics

### Add to your deployment:
1. **Error tracking**: Sentry
2. **Analytics**: Google Analytics or Mixpanel
3. **Uptime monitoring**: UptimeRobot
4. **Performance**: Vercel Analytics (free tier)

## 🚨 Troubleshooting

### Common Issues:

1. **Build fails**: Check Node.js version (18+)
2. **Database connection**: Verify connection string
3. **Environment variables**: Ensure all required vars are set
4. **CORS errors**: Update `FRONTEND_URL` environment variable

### Logs:
- **Vercel**: Function logs in dashboard
- **Railway**: Real-time logs in dashboard
- **Netlify**: Deploy logs and function logs

## 🎯 Quick Start (Recommended)

1. **Choose Vercel** (easiest option)
2. **Set up database** at Neon.tech
3. **Push code to GitHub**
4. **Deploy on Vercel**
5. **Configure environment variables**
6. **Test your live app**

## 📞 Support

If you need help:
1. Check the deployment platform's documentation
2. Review error logs
3. Verify environment variables
4. Test locally first with `npm run build && npm start`

---

**🎉 Congratulations!** Once deployed, every time you push code to your main branch, your live website will automatically update with your changes!
