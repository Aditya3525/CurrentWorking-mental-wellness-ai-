# Render.com Deployment Guide

This guide will help you deploy the Mental Wellbeing AI App to Render.com.

## Prerequisites

1. **GitHub Account** - Your code should be pushed to a GitHub repository
2. **Render.com Account** - Sign up at https://render.com (free tier available)
3. **Push your code to GitHub**:
   ```powershell
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

## Important Changes Made for Render

✅ **Database**: Changed from SQLite to PostgreSQL in `backend/prisma/schema.prisma`
✅ **Build Script**: Updated `backend/package.json` to include Prisma generation and migrations
✅ **Render Config**: Updated `backend/render.yaml` with proper environment variables

---

## Deployment Steps

### Part 1: Deploy Backend API

1. **Login to Render.com**
   - Go to https://dashboard.render.com

2. **Create New PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `mental-wellbeing-db`
   - Plan: Free
   - Click "Create Database"
   - **Copy the Internal Database URL** (you'll need this later)

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository: `CurrentWorking-mental-wellness-ai-`

4. **Configure the Backend Service**
   - **Name**: `mental-wellbeing-backend`
   - **Region**: Oregon (US West) or closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**: 
     ```
     npm start
     ```
   - **Plan**: Free

5. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Paste the Internal Database URL from step 2 |
   | `JWT_SECRET` | Generate a secure random string (32+ characters) |
   | `JWT_EXPIRE` | `7d` |
   | `FRONTEND_URL` | `https://your-frontend-name.onrender.com` (update after frontend deploy) |
   | `PORT` | `10000` |

6. **Deploy Backend**
   - Click "Create Web Service"
   - Wait for build to complete (5-10 minutes)
   - Your backend will be at: `https://mental-wellbeing-backend.onrender.com`

7. **Run Database Migrations**
   - Go to your backend service dashboard
   - Click "Shell" tab
   - Run these commands:
     ```bash
     npx prisma migrate deploy
     npm run seed
     ```
   - This creates tables and seeds admin users

---

### Part 2: Deploy Frontend

1. **Create Static Site for Frontend**
   - Click "New +" → "Static Site"
   - Connect the same GitHub repository
   - Select: `CurrentWorking-mental-wellness-ai-`

2. **Configure Frontend Service**
   - **Name**: `mental-wellbeing-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: 
     ```
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`

3. **Add Environment Variables**
   Create a file `frontend/.env.production` with:
   ```
   VITE_API_URL=https://mental-wellbeing-backend.onrender.com
   ```

4. **Update Frontend API Configuration**
   - In `frontend/src/config/` or wherever API base URL is defined
   - Make sure it reads from `import.meta.env.VITE_API_URL`

5. **Deploy Frontend**
   - Click "Create Static Site"
   - Wait for build (3-5 minutes)
   - Your frontend will be at: `https://mental-wellbeing-frontend.onrender.com`

---

### Part 3: Final Configuration

1. **Update Backend CORS**
   - Go to backend service on Render
   - Go to "Environment" tab
   - Update `FRONTEND_URL` to your actual frontend URL:
     ```
     https://mental-wellbeing-frontend.onrender.com
     ```
   - Click "Save Changes" (this will redeploy)

2. **Test the Deployment**
   - Visit your frontend URL
   - Try logging in with admin credentials:
     - Email: `admin@example.com`
     - Password: `admin123`

---

## Important Notes

### Free Tier Limitations
- **Backend**: Spins down after 15 minutes of inactivity (cold start ~1 minute on first request)
- **Database**: 90-day expiration on free PostgreSQL
- **Frontend**: Always available (served from CDN)

### Environment Variables
Make sure these are set on Render:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `JWT_SECRET` - Strong random string
- ✅ `FRONTEND_URL` - Your frontend Render URL
- ✅ `NODE_ENV=production`

### Custom Domain (Optional)
- Go to your service → "Settings" → "Custom Domain"
- Add your domain and configure DNS

---

## Troubleshooting

### Backend Won't Start
- Check logs: Service → "Logs" tab
- Verify `DATABASE_URL` is correct
- Make sure migrations ran: `npx prisma migrate deploy`

### Database Connection Errors
- Use the **Internal Database URL** (not External)
- Format: `postgresql://user:password@host:port/database`

### CORS Errors
- Verify `FRONTEND_URL` in backend environment variables matches your actual frontend URL
- Check backend CORS configuration in `src/server.ts`

### Admin Login Not Working
- Run seed script from backend Shell: `npm run seed`
- Check if database has users: `npx prisma studio` (from Shell)

---

## Updating Your Deployment

### Push Code Changes
```powershell
git add .
git commit -m "Update: description of changes"
git push origin main
```

Render will automatically rebuild and redeploy (if auto-deploy is enabled).

### Manual Deploy
- Go to service dashboard
- Click "Manual Deploy" → "Deploy latest commit"

### Run Migrations After Schema Changes
```bash
# From backend Shell on Render
npx prisma migrate deploy
```

---

## Monitoring & Logs

- **View Logs**: Service dashboard → "Logs" tab
- **Metrics**: Service dashboard → "Metrics" tab
- **Database**: Database dashboard → "Info" tab

---

## Alternative: Using render.yaml (Blueprint)

If you prefer Infrastructure as Code, you can use the `backend/render.yaml`:

1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your repo
4. Render will detect `render.yaml` and create services automatically

**Note**: You'll still need to add environment variables manually through the UI.

---

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Prisma on Render: https://render.com/docs/deploy-prisma

---

## Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Backend service deployed with all environment variables
- [ ] Database migrations run successfully
- [ ] Database seeded with admin users
- [ ] Frontend deployed as static site
- [ ] Backend `FRONTEND_URL` updated with actual frontend URL
- [ ] Admin login tested and working
- [ ] Analytics and other features tested

---

**Deployment Complete! 🎉**

Your Mental Wellbeing AI App is now live on Render.com.
