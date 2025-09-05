# 🎓 GitHub Student Pack Deployment Guide for Mental Wellbeing AI App

## 🎉 AMAZING! With GitHub Student Pack, you get FREE access to premium services!

### 🏆 **RECOMMENDED DEPLOYMENT STACK** (All FREE with Student Pack)

## Option 1: Vercel Pro + PlanetScale (Best for Full-Stack) ⭐⭐⭐

### **Vercel Pro** (FREE with Student Pack)
- **Normal**: $20/month
- **With Student Pack**: FREE Pro plan
- **Benefits**: 
  - Unlimited deployments
  - Advanced analytics
  - Team collaboration
  - Edge functions
  - Higher limits

### **PlanetScale** (FREE with Student Pack)
- **Normal**: $29/month for production
- **With Student Pack**: FREE production database
- **Benefits**:
  - Serverless MySQL (compatible with Prisma)
  - Branching for database schema changes
  - Global edge network
  - Automatic scaling

### Setup Steps:
1. **Activate Student Pack Benefits**:
   - Go to [education.github.com/pack](https://education.github.com/pack)
   - Claim Vercel Pro and PlanetScale credits

2. **Database Setup** (PlanetScale):
   ```bash
   # Install PlanetScale CLI
   npm install -g @planetscale/cli
   
   # Login and create database
   pscale auth login
   pscale database create mental-wellbeing-db
   pscale branch create mental-wellbeing-db main
   ```

3. **Update Prisma for PlanetScale**:
   ```prisma
   // Update your schema.prisma
   generator client {
     provider = "prisma-client-js"
   }
   
   datasource db {
     provider     = "mysql"
     url          = env("DATABASE_URL")
     relationMode = "prisma"
   }
   ```

## Option 2: Netlify Pro + Railway Pro ⭐⭐

### **Netlify Pro** (FREE with Student Pack)
- **Normal**: $19/month
- **With Student Pack**: FREE Pro features
- **Benefits**: Advanced build features, team collaboration

### **Railway Pro** (FREE credits with Student Pack)
- **Normal**: $5-20/month
- **With Student Pack**: $5/month credit
- **Benefits**: PostgreSQL database, better performance

## Option 3: DigitalOcean + Heroku ⭐

### **DigitalOcean** (FREE $200 credit with Student Pack)
- **Normal**: $5-20/month
- **With Student Pack**: $200 FREE credit (4-40 months free!)
- **Benefits**: Full VPS control, Docker support

### **Heroku** (FREE credits with Student Pack)
- **Normal**: $7-25/month
- **With Student Pack**: Extended free tier
- **Benefits**: Easy deployment, add-ons

## Option 4: Microsoft Azure (FREE with Student Pack) ⭐⭐

### **Azure for Students** (FREE $100 credit)
- **Benefits**: 
  - Azure App Service
  - Azure Database for PostgreSQL
  - Azure Static Web Apps
  - Full Microsoft ecosystem

---

## 🚀 **STEP-BY-STEP: VERCEL PRO + PLANETSCALE SETUP**

### Step 1: Claim Your Student Benefits
```bash
# Visit and claim:
# - Vercel Pro: https://vercel.com/github-students
# - PlanetScale: https://planetscale.com/github-students
```

# 🎓 GitHub Student Pack Deployment Guide for Mental Wellbeing AI App

## 🎉 AMAZING! With GitHub Student Pack, you get FREE access to premium services!

### 🏆 **RECOMMENDED DEPLOYMENT STACK** (All FREE with Student Pack)

## Option 1: Vercel Pro + PlanetScale (Best for Full-Stack) ⭐⭐⭐

### **Vercel Pro** (FREE with Student Pack)
- **Normal**: $20/month
- **With Student Pack**: FREE Pro plan
- **Benefits**: 
  - Unlimited deployments
  - Advanced analytics
  - Team collaboration
  - Edge functions
  - Higher limits

### **PlanetScale** (FREE with Student Pack)
- **Normal**: $29/month for production
- **With Student Pack**: FREE production database
- **Benefits**:
  - Serverless MySQL (compatible with Prisma)
  - Branching for database schema changes
  - Global edge network
  - Automatic scaling

### Setup Steps:
1. **Activate Student Pack Benefits**:
   - Go to [education.github.com/pack](https://education.github.com/pack)
   - Claim Vercel Pro: [vercel.com/github-students](https://vercel.com/github-students)
   - Claim PlanetScale: [planetscale.com/github-students](https://planetscale.com/github-students)

2. **Database Setup** (PlanetScale):
   ```bash
   # Install PlanetScale CLI
   npm install -g @planetscale/cli
   
   # Login and create database
   pscale auth login
   pscale database create mental-wellbeing-ai
   pscale branch create mental-wellbeing-ai main
   pscale connect mental-wellbeing-ai main --port 3309
   ```

3. **Update Prisma for PlanetScale**:
   ```bash
   # Copy the PlanetScale schema
   cp backend/schema-planetscale.prisma backend/prisma/schema.prisma
   
   # Generate Prisma client
   cd backend
   npx prisma generate
   ```

4. **Deploy to Vercel**:
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Ready for Student Pack deployment"
   git push origin main
   
   # Deploy with Vercel CLI (with Pro benefits)
   npx vercel --prod
   ```

5. **Environment Variables for Vercel**:
   ```env
   NODE_ENV=production
   DATABASE_URL=mysql://username:password@host.planetscale.com/mental-wellbeing-ai?sslaccept=strict
   JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
   FRONTEND_URL=https://your-app.vercel.app
   
   # AI API Keys (some have Student Pack bonuses)
   GEMINI_API_KEY_1=your_gemini_key
   OPENAI_API_KEY_1=your_openai_key  # $5 free credit with Student Pack
   ANTHROPIC_API_KEY_1=your_anthropic_key
   
   AI_PROVIDER_PRIORITY=gemini,openai,anthropic
   AI_MAX_TOKENS=150
   AI_TEMPERATURE=0.7
   ```

## Option 2: Netlify Pro + Railway Pro ⭐⭐

### **Netlify Pro** (FREE with Student Pack)
- **Normal**: $19/month
- **With Student Pack**: FREE Pro features
- **Benefits**: Form handling, split testing, team features

### **Railway Pro** (FREE credits with Student Pack)
- **Normal**: $5-20/month
- **With Student Pack**: $5/month credit (first year free!)

### Setup:
1. **Frontend (Netlify Pro)**:
   ```bash
   # Build settings
   Build command: cd frontend && npm run build
   Publish directory: frontend/dist
   Environment: VITE_API_URL=https://your-backend.railway.app/api
   ```

2. **Backend (Railway)**:
   ```bash
   # Deploy settings
   Root directory: /backend
   Build command: npm run build
   Start command: npm run start
   ```

## Option 3: DigitalOcean ($200 FREE Credit) ⭐

### **DigitalOcean** (MASSIVE $200 credit)
- **Normal**: $5-50/month
- **With Student Pack**: $200 FREE (4-40 months free hosting!)

### Setup:
1. **Claim credit**: [digitalocean.com/github-students](https://digitalocean.com/github-students)
2. **Create Droplet**: Ubuntu 22.04, $5/month (40 months free!)
3. **Deploy with Docker**:
   ```bash
   # Use the docker-compose.yml provided
   git clone your-repo
   cd your-repo
   docker-compose up -d
   ```

## Option 4: Microsoft Azure (FREE $100 Credit) ⭐⭐

### **Azure for Students**
- **Benefits**: $100 credit + free services
- **Services**: App Service, Database, Static Web Apps

---

## 🎁 **BONUS STUDENT PACK SERVICES**

### **Additional FREE Services:**
1. **MongoDB Atlas** - $200 credit
2. **Heroku** - Extended free tier  
3. **AWS** - $200 credits
4. **Google Cloud** - $300 credits
5. **Stripe** - No transaction fees
6. **Twilio** - $50 credit
7. **SendGrid** - 15,000 free emails/month

### **AI/ML Services:**
1. **OpenAI** - $5 free credits
2. **AssemblyAI** - $50 credits
3. **Daily.co** - Video API credits

---

## 🚀 **QUICK START WITH STUDENT PACK**

### Step 1: Run Setup Script
```powershell
.\student-pack-setup.ps1
```

### Step 2: Choose Your Stack
- **Beginner**: Vercel Pro + PlanetScale
- **Intermediate**: Netlify Pro + Railway  
- **Advanced**: DigitalOcean + Docker

### Step 3: Claim Benefits
Visit each service and claim your Student Pack benefits:
- [GitHub Student Pack Portal](https://education.github.com/pack)

### Step 4: Deploy!
Follow the specific setup guide for your chosen stack.

---

## 💰 **TOTAL VALUE**

### **What You Get FREE:**
- **Vercel Pro**: $240/year
- **PlanetScale**: $348/year  
- **DigitalOcean**: $200 credit
- **MongoDB**: $200 credit
- **OpenAI**: $60/year value
- **And 100+ other services**

**Total Value: $1000+ per year FREE!**

---

## 🔄 **CONTINUOUS DEPLOYMENT**

With any option, you get:
✅ **Automatic deployments** on git push  
✅ **Preview deployments** for branches  
✅ **Professional monitoring**  
✅ **SSL certificates**  
✅ **Global CDN**  
✅ **Team collaboration**  

---

## 🆘 **Student Pack Support**

- **GitHub Education**: [education.github.com](https://education.github.com)
- **Student Developer Pack**: [education.github.com/pack](https://education.github.com/pack)
- **Support**: GitHub Education Support

---

## 🎯 **PRO TIPS**

1. **Stack your benefits**: Use multiple services together
2. **Learn while building**: Great learning opportunity  
3. **Build portfolio**: Professional-grade projects
4. **Network**: Join GitHub Education community
5. **Document**: Share your experience

**You're getting enterprise-level hosting and services completely FREE! 🎉**
