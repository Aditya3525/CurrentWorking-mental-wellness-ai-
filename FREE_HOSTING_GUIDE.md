# 🚀 FREE Deployment Guide - Alternative to Azure

Since Azure Student has region restrictions, here are **FREE** alternatives that work perfectly:

## 🎯 Recommended Setup (100% Free)

### Frontend: **Vercel** (Free Plan)
- ✅ Automatic deployments from GitHub
- ✅ Custom domains
- ✅ Fast global CDN
- ✅ Perfect for React/Vite apps

### Backend: **Railway** (Free $5/month credit)
- ✅ Free PostgreSQL database
- ✅ Automatic deployments
- ✅ Environment variables
- ✅ Perfect for Node.js

## 📋 Step-by-Step Setup

### Step 1: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up with GitHub** (use your student account)
3. **Import your repository**: `Aditya3525/CurrentWorking-mental-wellness-ai-`
4. **Configure settings**:
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: **npm run build**
   - Output Directory: **dist**
5. **Click Deploy**

### Step 2: Deploy Backend to Railway

1. **Go to [railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Configure settings**:
   - Root Directory: **backend**
   - Start Command: **npm start**
6. **Add PostgreSQL database** (click + Add → Database → PostgreSQL)

### Step 3: Environment Configuration

**Frontend (.env.production)**:
```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_APP_NAME=Mental Wellbeing AI
```

**Backend (.env)**:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://your-railway-db-url
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-key
```

## 🔧 Quick Setup Commands

Run these commands to prepare your project:
