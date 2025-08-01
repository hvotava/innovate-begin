# 🚀 RYCHLÝ RAILWAY DEPLOYMENT

## 📋 VŠE JE PŘIPRAVENO! Stačí 4 kroky:

### 🔗 **KROK 1: GitHub Repository**
1. Jděte na: https://github.com/new
2. **Repository name:** `lecture-dashboard`
3. **Description:** `React Dashboard s Node.js backendem pro vzdělávací systém`
4. **Public** repository
5. **NEVYBÍREJTE** "Add a README file" (už máme soubory)
6. Klikněte **"Create repository"**

### 📤 **KROK 2: Push kódu na GitHub**
Po vytvoření repository spusťte v terminálu:

```bash
# Přidejte remote (nahraďte USERNAME svým GitHub jménem)
git remote add origin https://github.com/USERNAME/lecture-dashboard.git

# Push kódu
git branch -M main
git push -u origin main
```

### 🚂 **KROK 3: Railway Deployment**
1. Jděte na: https://railway.app
2. Klikněte **"New Project"**
3. Vyberte **"Deploy from GitHub repo"**
4. Vyberte váš `lecture-dashboard` repository
5. Railway automaticky začne build proces

### ⚙️ **KROK 4: Environment Variables**
V Railway Dashboard → Settings → Environment, přidejte:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:ulrLIUFMOFKhCmmzJLyGGVRRwuDzxfHE@postgres.railway.internal:5432/railway
PORT=5000
```

### 🗄️ **KROK 5: Inicializace Databáze**
Po úspěšném deployu:

1. V Railway Dashboard klikněte na váš projekt
2. Přejděte na **"Deployments"** tab
3. Klikněte **"View Logs"**
4. Otevřete **Terminal** (ikona terminálu)
5. Spusťte:
```bash
cd backend && node scripts/init-railway-db.js
```

## 🎉 **VÝSLEDEK:**

Po dokončení budete mít:
- ✅ **5 testovacích uživatelů** (Jan, Marie, Petr, Anna, Tomáš)
- ✅ **9 lekcí a testů** (Level 0-4)
- ✅ **Novou logiku:** test → lekce → test
- ✅ **Funkční dashboard** na `https://your-app.railway.app`
- ✅ **API endpoints** na `https://your-app.railway.app/api`
- ✅ **Twilio integrace** pro volání

## 🎯 **Funkcionality:**
- 📊 **Dashboard** - statistiky a grafy
- 👥 **Správa uživatelů** - CRUD + volání
- 📚 **Správa lekcí** - nová struktura
- 📱 **Responsivní design** - funguje na mobilu
- 🗄️ **PostgreSQL** - produkční databáze

## 📞 **Testování:**
Po deployu můžete:
1. Otevřít dashboard na Railway URL
2. Přejít na "Uživatelé"
3. Kliknout "Zavolat" u libovolného uživatele
4. Zobrazí se notifikace s potvrzením volání

---

## 🚀 **READY TO DEPLOY!**
**Všechno je připraveno - stačí následovat kroky výše!** 🎯 