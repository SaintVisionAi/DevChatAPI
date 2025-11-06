# 🚀 Cookin' Knowledge - Your Gotta Guy™

[![Patent Protected](https://img.shields.io/badge/Patent-US10290222-gold)](https://patents.google.com/patent/US10290222B1)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-brightgreen)](https://saintsal.ai)
[![AI Powered](https://img.shields.io/badge/AI-Claude%20%2B%20GPT%20%2B%20Gemini-blue)](https://saintsal.ai)

## 🔥 The Ultimate Enterprise AI Platform

**Cookin' Knowledge** (SaintSal™) is an enterprise-grade AI platform that combines the best features of ChatGPT, Claude, and Perplexity with extended memory systems, team collaboration, and 81% mobile-optimized voice features.

### ✨ Key Features

- **🎤 Voice Mode** - Walkie-talkie push-to-talk with ElevenLabs TTS (81% mobile users)
- **🔍 Web Search** - Perplexity integration with real-time citations
- **🧠 Deep Research** - 3-step chain-of-thought analysis with web search
- **💻 Code Agent** - Multi-file code generation, editing, and refactoring
- **👁️ Vision Analysis** - Gemini Vision API for image understanding
- **💾 Extended Memory** - Per-user conversation context and preferences
- **👥 Team Memory** - Shared organizational knowledge base
- **🔐 Enterprise Auth** - OIDC/Replit auth with role-based access
- **💳 Stripe Payments** - Integrated subscription management

## 📱 Mobile-First Design

- **Prominent walkie-talkie button** for voice interaction
- **Responsive chat UI** with keyboard optimization
- **Touch-optimized** controls (44px+ touch targets)
- **Clean mode selector** with compact pills
- **Sticky input** with smart positioning

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + WebSocket
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **AI Providers**: 
  - Anthropic Claude (Sonnet 4.5, Haiku, Opus)
  - OpenAI (GPT-4o, GPT-5)
  - Perplexity (Web Search)
  - Google Gemini (Vision)
  - ElevenLabs (TTS)
- **Auth**: OpenID Connect (Replit Auth)
- **Payments**: Stripe

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- API Keys (see Environment Variables)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cookin-knowledge.git
cd cookin-knowledge

# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
# Database (Required)
DATABASE_URL=postgresql://...

# Session (Required)
SESSION_SECRET=your-secret-here

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
GOOGLE_GEMINI_API_KEY=...
GROK_API_KEY=xai-...
ELEVENLABS_API_KEY=...

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Auth (Replit)
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id
```

## 📦 Project Structure

```
cookin-knowledge/
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── providers/       # AI provider integrations
│   ├── routes.ts        # API routes
│   ├── websocket.ts     # WebSocket handlers
│   └── auth.ts          # Authentication
├── shared/              # Shared types/schemas
│   └── schema.ts        # Drizzle schema
└── package.json
```

## 🎯 API Modes

### Chat Mode
Standard AI conversations with Claude/GPT models

### Web Search Mode
```javascript
// Searches with Perplexity and returns citations
mode: 'search'
```

### Deep Research Mode
```javascript
// 3-step analysis: Understanding → Research → Synthesis
mode: 'research'
```

### Code Agent Mode
```javascript
// Multi-file code operations
mode: 'code'
operations: ['analyze', 'edit', 'create', 'refactor']
```

### Voice Mode
```javascript
// Push-to-talk with automatic TTS response
mode: 'voice'
```

## 🔐 Security Features

- **OIDC Authentication** via Replit
- **Session-based WebSocket auth**
- **Role-based access control** (Admin, Developer, Viewer)
- **Secure API key management**
- **End-to-end encryption ready**

## 💰 Pricing Tiers

- **Free**: 100 AI messages/month
- **Pro ($20/mo)**: 5000 messages/month, priority support
- **Enterprise**: Custom limits, white-label, dedicated support

## 🌟 Premium SaintSal™ Design

- Deep black background (#0f0f0f)
- Gold accents (#E6B325) with glow effects
- Neon blue highlights (#4DA6FF)
- Space Grotesk typography

## 📱 PWA Features

- **Installable** on mobile devices
- **Offline capable** with service workers
- **Push notifications** ready
- **App-like experience**

## 🚢 Deployment

### Production Build

```bash
npm run build
```

### Deploy to Production

The app is configured for deployment on Replit or any Node.js hosting platform.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

Protected by U.S. Patent #10,290,222. All rights reserved.

## 🌐 Links

- **Website**: [saintsal.ai](https://saintsal.ai)
- **Documentation**: [docs.saintsal.ai](https://docs.saintsal.ai)
- **Support**: ryan@cookinknowledge.com

## 👨‍💻 Author

**Ryan Keller** - SaintSal™
- Email: ryan@cookinknowledge.com
- Phone: +1 949-997-2097

---

<div align="center">
  <strong>Your Gotta Guy™ for Everything</strong>
  <br>
  Built with ❤️ using Replit
</div>