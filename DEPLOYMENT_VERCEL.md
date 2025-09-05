# Vercel Deployment Guide

## Prerequisites
1. Create account at vercel.com
2. Install Vercel CLI: `npm i -g vercel`
3. Push your code to GitHub repository

## Database Setup
1. Create PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)
2. Get connection string

## Environment Variables Setup
Set these in Vercel dashboard (Settings > Environment Variables):

### Required Environment Variables:
```
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key_change_this
FRONTEND_URL=https://your-app-name.vercel.app

# AI API Keys (add your actual keys)
GEMINI_API_KEY_1=your_gemini_api_key
OPENAI_API_KEY_1=your_openai_api_key
ANTHROPIC_API_KEY_1=your_anthropic_api_key

# AI Configuration
AI_PROVIDER_PRIORITY=gemini,openai,anthropic
AI_MAX_TOKENS=150
AI_TEMPERATURE=0.7
AI_TIMEOUT=30000
```

## Deployment Steps:
1. Push code to GitHub
2. Connect Vercel to your GitHub repository
3. Configure environment variables
4. Deploy!

## Auto-deployment:
- Every push to main branch = automatic deployment
- Preview deployments for pull requests
- Rollback capability
