# Waler - The First Relationship Clarity Tool

Waler helps you understand your social connections through introspection, not surveillance. We detect when someone leaves your digital circle and guide you through what it means about you and your relationship.

## �️ Base de Données: Supabase PostgreSQL

**L'application utilise maintenant Supabase!**

### ⚡ Configuration Rapide (5 minutes)

**Consultez le guide complet:** [DEMARRAGE_RAPIDE_SUPABASE.md](./DEMARRAGE_RAPIDE_SUPABASE.md)

**Résumé:**
1. Créez un projet sur https://supabase.com (gratuit)
2. Copiez votre connection string
3. Exécutez `setup-env.bat` ou créez `.env` manuellement
4. Créez les tables (SQL fourni dans le guide)
5. Lancez `npm run dev`

**Documentation complète:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 🚀 Quick Start

### 1. Configuration Environnement

**Automatique (Recommandé):**
```bash
# Double-cliquez sur:
setup-env.bat
```

**Manuel:**
```bash
# Copiez le template
copy .env.template .env

# Éditez .env et ajoutez votre DATABASE_URL Supabase
notepad .env
```

### 2. Installer les Dépendances

```bash
npm install
```

### 3. Configurer Supabase

Voir [DEMARRAGE_RAPIDE_SUPABASE.md](./DEMARRAGE_RAPIDE_SUPABASE.md)

### 4. Démarrer le Serveur

```bash
npm run dev
```

### 5. Ouvrir l'Application

**Application:** http://localhost:5000

## 📋 Features

### ✅ Implemented

**Onboarding:**
- 14-step introspection questionnaire
- AI-powered insights with conversion wall
- Technical setup (platform, username, email, password)

**Monetization:**
- **Premium** - $4.99/month (7-day trial)
  - AI relationship analysis
  - See who unfollowed/blocked you
  - Full change history
  - Personalized insights
  
- **Pro** - $14.99/month (14-day trial)
  - Everything in Premium
  - Client management dashboard
  - Track client followers/following
  - Session notes & milestones
  - Progress reports

**Dashboard:**
- Personal mode (your own stats)
- Professional mode (client management) - Pro only
- Real-time metrics
- Beautiful visualizations

## 📁 Project Structure

```
Waler/
├── client/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Main pages
│   │   ├── hooks/       # Custom hooks
│   │   └── contexts/    # React contexts
│   └── package.json
│
├── server/              # Flask backend
│   ├── routes/          # API routes
│   │   ├── auth.py      # Authentication
│   │   ├── clients.py   # Client management
│   │   └── subscription.py # Stripe
│   ├── app.py           # Main server
│   ├── init_db.py       # DB initialization
│   └── requirements.txt
│
├── agent_a.py           # Agent A - Unfollow detector
├── agent_b.py           # Agent B - Account verification
├── agent_c.py           # Agent C - Pro clients tracker
├── agent_prospects.py   # Agent Prospects - New followers detection
├── agent_connections.py # Agent Connections - Relationship quality analysis
├── start.bat            # Quick start script
├── SETUP.md             # Detailed setup guide
└── context.md           # Product documentation
```

## 🔧 Troubleshooting

### "Erreur d'inscription"
1. Make sure database is initialized: `python server/init_db.py`
2. Check backend is running on port 5000
3. Password must be at least 6 characters
4. Email/username must be unique

### Port Already in Use
**Backend:**
Edit `server/app.py`, change port:
```python
app.run(debug=True, port=5001)
```

**Frontend:**
Edit `client/vite.config.ts`, add:
```ts
server: { port: 3000 }
```

### Database Issues
Reset database:
```bash
cd server
del waler.db
python init_db.py
```

## 📚 Documentation

- **SETUP.md** - Detailed setup instructions
- **STRIPE_SETUP.md** - Payment integration guide
- **AGENT_PROSPECTS_GUIDE.md** - Agent Prospects (new followers) guide
- **AGENT_CONNECTIONS_GUIDE.md** - Agent Connections (relationship quality) guide
- **AGENT_C_GUIDE.md** - Agent C (Pro clients tracker) guide
- **context.md** - Product strategy & architecture

## 🛠️ Tech Stack

**Frontend:**
- React + TypeScript
- TailwindCSS
- Framer Motion
- Recharts
- Wouter (routing)

**Backend:**
- Flask (Python)
- SQLite
- Stripe (payments)
- Instagram/Facebook APIs

## 🎯 Next Steps

1. ✅ Complete onboarding flow
2. ✅ Test registration
3. 🔜 Configure Stripe (see STRIPE_SETUP.md)
4. 🔜 Integrate Instagram API
5. 🔜 Deploy to production

## 📞 Support

For issues:
1. Check console logs (browser + terminal)
2. Verify database exists (`server/waler.db`)
3. Ensure both servers are running
4. See SETUP.md for detailed troubleshooting

---

**Made with ❤️ for understanding relationships better**
