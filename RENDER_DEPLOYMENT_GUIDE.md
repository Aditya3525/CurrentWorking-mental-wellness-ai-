# 🆓 FREE Backend Deployment Guide - Render

## Why Render?
- ✅ **500 hours/month FREE** (enough for your app)
- ✅ **FREE PostgreSQL database**
- ✅ **Auto-deploys from GitHub**
- ✅ **No credit card required**
- ✅ **SSL certificates included**

## 📋 Step-by-Step Render Deployment:

### Step 1: Create Render Account
1. Go to **render.com** (should be open)
2. **Sign up with GitHub**
3. **Authorize Render** to access your repositories

### Step 2: Deploy Backend
1. **Click "New +"** → **"Web Service"**
2. **Connect GitHub repository**: `CurrentWorking-mental-wellness-ai-`
3. **Configure settings**:
   - **Name**: `mental-wellbeing-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### Step 3: Add Database
1. **Click "New +"** → **"PostgreSQL"**
2. **Configure**:
   - **Name**: `mental-wellbeing-db`
   - **Database Name**: `mental_wellbeing`
   - **User**: `mental_wellbeing_user`
   - **Plan**: **Free**

### Step 4: Environment Variables
Add these in your web service settings:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=[Render will provide this]
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key
```

### Step 5: Connect Frontend to Backend
Update your frontend `.env.production`:
```
VITE_API_URL=https://mental-wellbeing-backend.onrender.com
```

## 🎯 Benefits:
- ✅ **Completely FREE** for personal projects
- ✅ **Automatic HTTPS**
- ✅ **Auto-deploys** on git push
- ✅ **Built-in monitoring**
- ✅ **No sleep/cold start issues** (unlike Heroku free tier)

## 🚀 Alternative Free Options:

### Option 2: Cyclic
- Go to **cyclic.sh**
- Import GitHub repo
- Uses MongoDB (built-in)
- Completely free

### Option 3: Supabase + Vercel Functions
- **Supabase**: Free PostgreSQL database
- **Vercel**: Free API endpoints
- More setup required but very powerful
