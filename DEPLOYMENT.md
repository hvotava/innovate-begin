# 🚀 Railway Deployment Guide

## 📋 Přehled
Tento projekt je React Dashboard s Node.js backendem připravený pro deployment na Railway.app.

## 🏗️ Architektura
- **Frontend**: React aplikace (TypeScript, Material-UI)
- **Backend**: Node.js/Express API (TypeScript, Sequelize ORM)
- **Database**: SQLite (development) / PostgreSQL (production)
- **Build**: Multi-stage Docker build

## 🔧 Environment Variables pro Railway

Nastavte tyto proměnné v Railway dashboard:

### Required
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
```

### Optional (Twilio integration)
```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
OPENAI_API_KEY=your_openai_api_key
```

### Optional (CORS)
```bash
FRONTEND_URL=https://your-app.railway.app
```

## 🚀 Deployment Steps

### 1. GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/lecture-dashboard.git
git push -u origin main
```

### 2. Railway Setup
1. Přihlaste se na [Railway.app](https://railway.app)
2. Klikněte "New Project"
3. Vyberte "Deploy from GitHub repo"
4. Vyberte váš repository
5. Railway automaticky detekuje Node.js projekt

### 3. Database Setup
1. V Railway dashboard klikněte "Add Service"
2. Vyberte "PostgreSQL"
3. Zkopírujte DATABASE_URL z PostgreSQL služby
4. Přidejte ji do environment variables vašeho hlavního servisu

### 4. Environment Variables
V Railway dashboard → Settings → Environment:
- Přidejte všechny potřebné proměnné (viz výše)

### 5. Deploy
Railway automaticky deployuje při push do main branch.

## 🏥 Health Check
- Endpoint: `/api/health`
- Vrací: `{"status": "OK", "timestamp": "...", "environment": "production"}`

## 📊 Features
- ✅ Responsive React dashboard
- ✅ REST API with Express
- ✅ SQLite/PostgreSQL support
- ✅ User management (CRUD)
- ✅ Twilio integration for calls
- ✅ OpenAI integration
- ✅ Material-UI components
- ✅ TypeScript support
- ✅ Production-ready Docker build

## 🔍 Local Development
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 🌐 Production URLs
- **Frontend**: https://your-app.railway.app
- **API**: https://your-app.railway.app/api
- **Health**: https://your-app.railway.app/api/health

## 🐛 Troubleshooting
- Check Railway logs for deployment issues
- Verify environment variables are set correctly
- Ensure DATABASE_URL is properly configured
- Check health endpoint after deployment 