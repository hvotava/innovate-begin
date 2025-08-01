# 📚 Lecture Dashboard - React Admin Interface

Moderní, responzivní admin dashboard pro Lecture aplikaci postavený na React + Node.js s napojením na stávající PostgreSQL databázi.

## ✨ Funkce

### 🎯 Současné funkce
- **Moderní UI** - Material-UI s pěkným designem a barvami
- **Responzivní design** - funguje na desktop i mobilech
- **Dashboard** - přehledné statistiky a grafy
- **Správa uživatelů** - CRUD operace s vyhledáváním
- **Sidebar navigace** - intuitivní menu
- **Dark/Light theme ready** - připraveno pro přepínání témat

### 🚀 Plánované funkce
- **Správa lekcí** - vytváření a editace lekcí
- **Správa testů** - přehled testových session
- **Pokročilá analytika** - detailní reporty a grafy
- **Realtime notifikace** - živé updaty
- **Export dat** - CSV, PDF exporty
- **Uživatelské role** - admin/teacher/viewer

## 🏗️ Architektura

```
react-dashboard/
├── backend/          # Node.js API server
│   ├── config/       # Database konfigurace
│   ├── models/       # Sequelize modely
│   ├── routes/       # API endpointy
│   └── server.js     # Hlavní server
└── frontend/         # React aplikace
    ├── src/
    │   ├── components/  # Reusable komponenty
    │   ├── pages/      # Stránky aplikace
    │   ├── services/   # API služby
    │   └── types/      # TypeScript typy
    └── public/
```

## 🚀 Rychlý start

### 1. Backend (Node.js API)

```bash
cd react-dashboard/backend

# Instalace závislostí
npm install

# Vytvoření .env souboru
cp .env.example .env

# Upravte .env s vaší DATABASE_URL z Railway
# DATABASE_URL=postgresql://postgres:password@host:port/database

# Spuštění dev serveru
npm run dev
```

Backend poběží na `http://localhost:5000`

### 2. Frontend (React)

```bash
cd react-dashboard/frontend

# Instalace závislostí (už provedeno)
npm install

# Spuštění dev serveru
npm start
```

Frontend poběží na `http://localhost:3000`

## 🗄️ Databáze

Dashboard používá **stejnou PostgreSQL databázi** jako vaše stávající FastAPI aplikace. Sequelize modely jsou navrženy tak, aby odpovídaly vašim SQLAlchemy modelům:

- `users` - uživatelé systému
- `lessons` - lekce a jejich obsah
- `test_sessions` - testovací session
- `attempts` - pokusy uživatelů
- `answers` - odpovědi na otázky

## 📡 API Endpointy

### Dashboard
- `GET /api/dashboard/stats` - základní statistiky
- `GET /api/dashboard/user-performance` - výkon uživatelů
- `GET /api/dashboard/lesson-analytics` - analytika lekcí
- `GET /api/dashboard/recent-activity` - nedávná aktivita

### Uživatelé
- `GET /api/users` - seznam uživatelů (s paginací)
- `GET /api/users/:id` - detail uživatele
- `POST /api/users` - vytvoření uživatele
- `PUT /api/users/:id` - úprava uživatele
- `DELETE /api/users/:id` - smazání uživatele

### Lekce
- `GET /api/lessons` - seznam lekcí
- `POST /api/lessons` - vytvoření lekce
- `PUT /api/lessons/:id` - úprava lekce

### Testy
- `GET /api/tests/sessions` - testovací session
- `GET /api/tests/attempts` - pokusy uživatelů

## 🎨 Design System

### Barvy
- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#f59e0b` (Amber)  
- **Success**: `#10b981` (Emerald)
- **Error**: `#ef4444` (Red)
- **Background**: `#f8fafc` (Slate 50)

### Komponenty
- **Cards** - zaoblené rohy (12px), jemné stíny
- **Buttons** - bez uppercase, zaoblené
- **Data Grid** - čisté řádky, hover efekty
- **Sidebar** - tmavý design s gradientem

## 📱 Responzivní design

Dashboard je plně responzivní:
- **Desktop** (1200px+) - plný sidebar, 4 sloupce stats
- **Tablet** (768px-1199px) - plný sidebar, 2 sloupce stats  
- **Mobile** (< 768px) - skrytý sidebar, 1 sloupec stats

## 🔧 Konfigurace

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@host:port/database
FRONTEND_URL=http://localhost:3000
```

### Produkční nasazení

#### Backend
```bash
npm run build  # pokud budete mít build step
npm start      # produkční server
```

#### Frontend
```bash
npm run build  # vytvoří optimalizovanou verzi
# Nasaďte build/ složku na static hosting
```

## 🛠️ Technologie

### Backend
- **Node.js** + **Express** - API server
- **Sequelize** - ORM pro PostgreSQL
- **Helmet** - bezpečnost
- **CORS** - cross-origin requests
- **Rate limiting** - ochrana proti spam

### Frontend  
- **React 18** + **TypeScript** - UI framework
- **Material-UI** - komponenty a design
- **React Router** - routing
- **Recharts** - grafy a vizualizace
- **Axios** - HTTP client

## 🎯 Další kroky

1. **Připojení na skutečné API** - nahradit mock data
2. **Dokončení CRUD operací** - lekce, testy
3. **Realtime funkce** - WebSocket notifikace
4. **Autentifikace** - JWT tokeny
5. **Pokročilé grafy** - více vizualizací
6. **Export funkcionalita** - PDF/CSV reporty
7. **Mobile optimalizace** - touch gestures

## 🤝 Přispívání

1. Forkněte repo
2. Vytvořte feature branch (`git checkout -b feature/amazing-feature`)
3. Commitněte změny (`git commit -m 'Add amazing feature'`)
4. Pushněte branch (`git push origin feature/amazing-feature`)
5. Otevřete Pull Request

## 📄 Licence

MIT License - použijte jak chcete!

---

**Vytvořeno pro SynQFlows Lecture** 🚀 