# Waler - The First Relationship Clarity Tool

Waler helps you understand your social connections through introspection, not surveillance. We detect when someone leaves your digital circle and guide you through what it means about you and your relationship.

## 🚀 Quick Start (Windows)

**Option 1: Automatic (Recommended)**
```bash
# Double-click this file:
start.bat
```

**Option 2: Manual**

1. **Initialize Database**
```bash
cd server
python init_db.py
```

2. **Install Dependencies**
```bash
# Python
cd server
pip install -r requirements.txt

# Node.js
cd client
npm install
```

3. **Start Servers**

Terminal 1 (Backend):
```bash
cd server
python app.py
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

4. **Open Browser**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📋 Features

### ✅ Implemented

**Onboarding:**
- 14-step introspection questionnaire
- AI-powered insights with conversion wall
- Technical setup (platform, username, email, password)

**Monetization:**
- **Premium** - $9.99/month (7-day trial)
  - AI relationship analysis
  - See who unfollowed/blocked you
  - Full change history
  - Personalized insights
  
- **Pro** - $29.99/month (14-day trial)
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
FlowTrack/
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
