# 🚂 Napojení React Dashboard na Railway Databázi

## 📋 Jak získat DATABASE_URL z Railway

### 1. Přihlaste se na Railway
```bash
https://railway.app/dashboard
```

### 2. Otevřete váš projekt
- Najděte projekt s PostgreSQL databází
- Klikněte na **PostgreSQL** službu

### 3. Zkopírujte DATABASE_URL
- Jděte na záložku **Variables**
- Najděte `DATABASE_URL`
- Zkopírujte celou hodnotu (začíná `postgresql://`)

## 🔧 Nastavení v React Dashboard

### 1. Aktualizujte backend .env soubor:
```bash
cd react-dashboard/backend
```

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
FRONTEND_URL=http://localhost:3000

# Twilio konfigurace (zkopírujte z hlavního projektu)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+...
```

### 2. Restartujte backend:
```bash
pkill -f "node server.js"
node server.js &
```

### 3. Testujte připojení:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/users
```

## 🎯 Testování funkcionalit

### Dashboard je nyní připraven s:

✅ **Volání uživatelů** - tlačítko 📞 "Zavolat"  
✅ **Pokročilé mazání** - s kontrolou závislých dat  
✅ **API propojení** - real-time data z databáze  
✅ **Error handling** - snackbar notifikace  
✅ **Loading stavy** - indikátory při operacích  

### Nové funkce v Users stránce:

1. **📞 Zavolat** - iniciuje Twilio hovor
2. **✏️ Upravit** - editace uživatele  
3. **📊 Pokrok** - analýza výkonu uživatele
4. **🗑️ Smazat** - s force delete možností

## 🚀 Spuštění dashboardu

### Terminal 1 - Backend:
```bash
cd react-dashboard/backend
node server.js
```

### Terminal 2 - Frontend:
```bash
cd react-dashboard/frontend  
npm start
```

### Otevřete prohlížeč:
```
http://localhost:3000
```

## 🔗 Propojení se stávajícím systémem

Dashboard používá **stejnou databázi** jako váš hlavní FastAPI projekt, takže:

- ✅ Uživatelé se synchronizují automaticky
- ✅ Test sessions jsou viditelné v real-time  
- ✅ Změny se projeví okamžitě v obou systémech
- ✅ Žádná duplikace dat

## 📊 Další kroky

1. **Napojit na Railway databázi** ☝️ (hlavní krok)
2. **Přidat Twilio integraci** pro skutečné volání
3. **Dokončit CRUD pro lekce** a testy
4. **Přidat real-time notifikace** 
5. **Deploy na Railway** jako samostatnou službu

---

**Dashboard je připraven! Stačí jen nastavit správnou DATABASE_URL z Railway.** 🎉 