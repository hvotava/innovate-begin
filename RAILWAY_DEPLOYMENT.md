# 🚀 Railway Deployment - Kompletní Návod

## 📋 Přehled
React Dashboard s Node.js backendem připravený pro deployment na Railway.app s PostgreSQL databází.

## 🎯 **KROK 1: GitHub Repository**

```bash
# Repository je již připraven!
git remote add origin https://github.com/VASE_UZIVATELSKE_JMENO/lecture-dashboard.git
git branch -M main
git push -u origin main
```

## 🎯 **KROK 2: Railway Setup**

1. **Přihlaste se na:** https://railway.app
2. **Klikněte:** "New Project"
3. **Vyberte:** "Deploy from GitHub repo"
4. **Vyberte:** váš `lecture-dashboard` repository
5. **Railway automaticky detekuje Node.js projekt**

## 🎯 **KROK 3: PostgreSQL Database**

Railway už má vaši PostgreSQL databázi:
```
postgresql://postgres:ulrLIUFMOFKhCmmzJLyGGVRRwuDzxfHE@postgres.railway.internal:5432/railway
```

## 🎯 **KROK 4: Environment Variables**

V Railway Dashboard → Settings → Environment, přidejte:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:ulrLIUFMOFKhCmmzJLyGGVRRwuDzxfHE@postgres.railway.internal:5432/railway
PORT=5000

# Optional - Twilio integration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Optional - OpenAI integration  
OPENAI_API_KEY=your_openai_api_key
```

## 🎯 **KROK 5: Inicializace Databáze**

Po prvním deployu na Railway, spusťte inicializaci databáze:

1. **V Railway Dashboard klikněte na váš projekt**
2. **Přejděte na "Deploy" tab**
3. **Klikněte "View Logs"**
4. **Otevřete Terminal v Railway**
5. **Spusťte:**
```bash
cd backend && node scripts/init-railway-db.js
```

## 📊 **Co se vytvoří:**

### 👥 **Uživatelé (5):**
- Jan Novák (Level 0)
- Marie Svobodová (Level 1) 
- Petr Dvořák (Level 2)
- Anna Procházková (Level 0)
- Tomáš Černý (Level 3)

### 📚 **Lekce a Testy (9):**
- **Level 0:** Vstupní test (5 otázek)
- **Level 1:** Základní představení (lekce)
- **Level 1:** Test - Základní představení (3 otázky)
- **Level 2:** Čísla a věk (lekce)
- **Level 2:** Test - Čísla a věk (4 otázky)
- **Level 3:** Rodina (lekce)
- **Level 3:** Test - Rodina (4 otázky)
- **Level 4:** Profese a práce (lekce)
- **Level 4:** Test - Profese a práce (2 otázky)

## 🌐 **Finální URLs:**

- **Frontend:** `https://your-app.railway.app`
- **API:** `https://your-app.railway.app/api`
- **Health Check:** `https://your-app.railway.app/api/health`

## ✅ **Funkcionality:**

- ✅ **Dashboard** - statistiky a grafy
- ✅ **Správa uživatelů** - CRUD + volání přes Twilio
- ✅ **Správa lekcí** - zobrazení s novou logikou
- ✅ **Responsivní design** - funguje na mobilu
- ✅ **PostgreSQL** - produkční databáze
- ✅ **Health monitoring** - Railway health checks

## 🔧 **Technická specifikace:**

- **Frontend:** React 18 + TypeScript + Material-UI
- **Backend:** Node.js + Express + Sequelize ORM
- **Database:** PostgreSQL (Railway)
- **Build:** Multi-stage Docker build
- **Deployment:** Railway.app s automatickým CI/CD

## 🎊 **Po deployu můžete:**

1. **Přidat nové uživatele** a volat jim
2. **Spravovat lekce** s novou logikou (test → lekce → test)
3. **Sledovat statistiky** na dashboardu
4. **Používat na mobilu** - plně responsivní

---

## 🚀 **READY TO DEPLOY!**

**Vše je připraveno pro nasazení na Railway. Stačí pushnout na GitHub a připojit k Railway!** 🎯 