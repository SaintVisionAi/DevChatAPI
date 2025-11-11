# 🚀 Cookin' Knowledge - Your Gotta Guy™

[![Patent Protected](https://img.shields.io/badge/Patent-US10290222-gold)](https://patents.google.com/patent/US10290222B1)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-brightgreen)](https://saintsal.ai)
[![AI Powered](https://img.shields.io/badge/AI-Claude%20%2B%20GPT%20%2B%20Gemini-blue)](https://saintsal.ai)

## 🔥 Vision & Mission

**Cookin' Knowledge** (SaintSal™) embodies the digital legacy of Sal Couzzo - IQ 157, former Goldman Sachs executive track. This isn't just another AI chatbot. It's **The Gotta Guy™** - your on-demand expert across EVERY domain. Like having a Goldman Sachs CEO, Silicon Valley CTO, elite law firm partner, and Pentagon contractor all in your pocket, available 24/7.

### The Gotta Guy™ Principle

- **Whatever the problem** → You HAVE the answer. Not "I'll try" - you KNOW.
- **Whatever the need** → You HAVE the solution. Not "maybe" - you DELIVER.
- **Whatever the complexity** → You SOLVE it. Not "it's complicated" - you EXECUTE.

**Full-spectrum dominance** across business, technology, law, and strategy. Protected by U.S. Patent #10,290,222 for escalation/de-escalation in virtual environments.

---

## ✨ Core Functionalities

### 🎯 Five AI Modes

1. **💬 Chat Mode** - Context-aware conversations with extended memory that learns your preferences
2. **🔍 Web Search** - Real-time internet search via Perplexity API with cited sources
3. **🧠 Deep Research** - 3-step chain-of-thought analysis: Understanding → Research → Synthesis
4. **💻 Code Agent** - Multi-file code generation, editing, debugging, and refactoring
5. **🎤 Voice Mode** - Walkie-talkie push-to-talk with ElevenLabs TTS (critical for 81% mobile users)

### 🧠 Revolutionary Memory Architecture

- **Personal Memory**: Per-user conversation context, writing style, domain knowledge, and preferences
- **Team Memory**: Shared organizational knowledge base with category tagging and access control
- **AI Summaries**: Automatic conversation summarization with topic extraction
- **Context Persistence**: Full historical context maintained across all sessions

### 🎨 Premium "Apple meets SaintSal™" Design

- **Deep charcoal black** (#0f0f0f) for executive luxury
- **Metallic gold accents** (#E6B325) with subtle glow effects
- **Neon blue highlights** (#4DA6FF) for interactive elements
- **Glass-morphism UI** optimized for mobile-first experience
- **Space Grotesk typography** for modern, sophisticated aesthetic

### 🚀 Enterprise Features

- **Artifacts Panel**: Display and manage generated code files, documents, and content in real-time
- **WebSocket Streaming**: Token-by-token AI responses for instant feedback
- **Multi-Provider AI**: Anthropic Claude, OpenAI GPT, Google Gemini, Perplexity, Grok
- **Vision Capabilities**: Image analysis and understanding via Gemini Vision API
- **Text-to-Speech**: Natural voice synthesis powered by ElevenLabs
- **API Playground**: Enterprise-grade API testing with request/response inspection
- **Role-Based Access**: Admin, developer, and viewer permissions with audit trails

---

## 💰 Pricing Tiers

- **Starter** ($27/mo): 500 messages, basic features, community support
- **Pro** ($97/mo): 5,000 messages, priority support, advanced features, team memory
- **Enterprise** ($297/mo): Unlimited messages, white-label, dedicated support, custom integrations

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Shadcn/ui
- **Backend**: Node.js + Express + WebSocket
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **AI Providers**: 
  - Anthropic Claude (Sonnet 4.5, Haiku, Opus)
  - OpenAI (GPT-4o, GPT-4.5)
  - Perplexity (Web Search with Citations)
  - Google Gemini (Vision Analysis)
  - ElevenLabs (Text-to-Speech)
  - Grok (X.AI Integration)
- **Auth**: OpenID Connect (Replit Auth) with session-based security
- **Payments**: Stripe subscription management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (provided via Neon)
- API Keys (see Environment Variables)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy secrets from Replit Secrets panel

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

Required secrets (set in Replit Secrets panel):

```env
# Core (Required)
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-here
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
GROK_API_KEY=xai-...

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

---

## 📦 Project Structure

```
cookin-knowledge/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (Chat, Dashboard, Playground)
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # Utilities and helpers
├── server/                # Express backend
│   ├── providers/         # AI provider integrations
│   │   ├── anthropic.ts  # Claude integration
│   │   ├── openai.ts     # GPT integration
│   │   └── perplexity.ts # Web search
│   ├── routes.ts          # RESTful API routes
│   ├── websocket.ts       # Real-time streaming
│   ├── replitAuth.ts      # OIDC authentication
│   └── storage.ts         # Database operations
├── shared/                # Shared types/schemas
│   └── schema.ts          # Drizzle ORM schema
└── VERCEL_DEPLOYMENT.md   # Production deployment guide
```

---

## 🔐 Security Features

- **OIDC Authentication** via Replit (enterprise-grade)
- **Session-based WebSocket auth** with PostgreSQL persistence
- **Role-based access control** (Admin, Developer, Viewer)
- **Encrypted API key management** via environment secrets
- **Multi-user data isolation** verified and tested
- **Secure session handling** with connect-pg-simple

---

## 📱 Mobile-First PWA Features

- **Prominent walkie-talkie button** for voice (81% mobile users)
- **Responsive chat UI** with keyboard optimization
- **Touch-optimized controls** (44px+ touch targets)
- **Sticky input positioning** for seamless interaction
- **Installable** on iOS and Android devices
- **Offline capable** with service workers
- **App-like experience** with native feel

---

## 🚢 Production Deployment

### Vercel Deployment (Recommended)

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment guide including:
- Environment variable setup
- Database configuration
- WebSocket configuration
- Production build optimization
- Domain configuration

### Build Commands

```bash
# Production build
npm run build

# Database schema sync
npm run db:push
```

---

## 📊 Database Schema

Extended memory architecture with:
- **Users**: Authentication, roles, Stripe subscriptions
- **Conversations**: Chat sessions with mode, context, summaries, team sharing
- **Messages**: Full message history with search results, reasoning, code files, voice transcripts
- **Team Memory**: Shared organizational knowledge base
- **API Environments**: Named configurations for API playground
- **Sessions**: Secure PostgreSQL-based session storage

---

## 📖 Synopsis

**Cookin' Knowledge (SaintSal™)** represents the evolution from basic AI chatbots to comprehensive knowledge partners. Built for professionals who demand Goldman Sachs-level expertise on demand, this platform combines five specialized AI modes with revolutionary extended memory systems that learn and adapt to individual users and teams.

Designed mobile-first for the 81% of users on-the-go, featuring premium glass-morphism UI with deep charcoal, gold, and neon blue aesthetics. Enterprise-ready with Stripe subscription management, multi-provider AI integration (Claude, GPT, Gemini, Perplexity, Grok), and patent-protected interaction methodologies.

Whether you need instant answers, deep research with citations, multi-file code generation, or voice interaction via walkie-talkie, SaintSal™ is **Your Gotta Guy™** - delivering full-spectrum dominance across every domain of knowledge. Not just AI. Not just a tool. Your complete knowledge partner operating at the apex of human intelligence across business, technology, law, and strategy.

**Production Status**: ✅ Ready for Vercel deployment with complete authentication, PostgreSQL database, WebSocket streaming, and multi-AI provider integration verified and tested.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Submit a pull request

---

## 📄 License

Protected by **U.S. Patent #10,290,222** for escalation/de-escalation in virtual environments. All rights reserved.

---

## 🌐 Links & Support

- **Website**: [saintsal.ai](https://saintsal.ai)
- **Email**: ryan@cookinknowledge.com
- **Phone**: +1 949-997-2097

---

## 👨‍💻 Author

**Ryan Keller** - SaintSal™  
*Bringing Sal Couzzo's legacy to the digital age*

---

<div align="center">
  <strong>Your Gotta Guy™ for Everything</strong>
  <br>
  <em>Full-Spectrum Dominance. Patent Protected. Enterprise Ready.</em>
  <br><br>
  Built with ❤️ using Replit
</div>
