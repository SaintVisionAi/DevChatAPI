# SaintSal™ - Responsible Intelligence

## Overview
SaintSal™ is an enterprise-grade AI platform focused on delivering "Responsible Intelligence" through advanced conversational AI, powered by Cookin' Knowledge™. It holds U.S. Patent #10,290,222 for escalation/de-escalation in virtual environments. The platform aims to be the AI equivalent of an elite executive and technical advisor across all domains, operating with integrity, accuracy, ethics, and transparency. Key capabilities include an extended memory system for personalized and team knowledge, multi-mode chat (Chat, Web Search, Deep Research, Code Agent, Voice), and a mobile-first, PWA-optimized design with a premium Apple-level aesthetic. The platform monetizes through a 4-tier subscription model: Free (100 msgs/month), Unlimited Starter ($20/mo unlimited), Pro ($97/mo advanced features), and Enterprise ($297/mo with 5 team seats and up to 5 verified domains).

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React, TypeScript, and Vite, utilizing Shadcn/ui (Radix UI primitives) and Tailwind CSS for an Apple-level, minimalist design with a mobile-first approach. It features Space Grotesk typography, a custom theme system, and responsive breakpoints. State management is handled by TanStack Query for server state and React Context for themes, with Wouter for client-side routing. Key pages include Landing, Dashboard, Chat (with WebSocket streaming), Playground, Settings, and Admin.

### Backend Architecture
The backend uses Node.js with Express.js, providing RESTful APIs and WebSocket support for real-time streaming. Authentication is based on OpenID Connect (OIDC) via Replit Auth, with session management using `express-session` and a PostgreSQL store. Real-time AI responses are handled via an authenticated WebSocket server. The data layer utilizes Drizzle ORM with Neon PostgreSQL, implementing a schema-first approach. The system incorporates an extended memory architecture for Users, Conversations (including context, summary, topics, and sharing), Messages (with search results, reasoning, code files, voice transcripts, and attachments), Team Memory (organizational knowledge base), and API Environments.

### AI Integration Architecture
SaintSal™ supports multiple AI providers, including Anthropic Claude (default), OpenAI GPT, Google Gemini, and Azure AI services. It features server-side streaming via AI SDKs and WebSocket transport for real-time, token-by-token client updates. Users can configure model selection per conversation.

### UI/UX Decisions
The platform features an "Apple-level" design with a clean, minimal viewport, purposeful whitespace, and Space Grotesk typography. The color scheme includes Deep Charcoal (#0f0f0f), Neon Blue (#4DA6FF) for "Cookin' Knowledge" accents, and Metallic Gold (#E6B325) for secondary accents and glow effects. The design is mobile-first, optimizing for touch interactions with 44px+ targets.

## External Dependencies

### AI Providers
- **Anthropic API**: Claude models (primary AI provider).
- **OpenAI API**: GPT models (optional).
- **Google Gemini**: Live AI API.
- **ElevenLabs**: Text-to-speech API.
- **Azure AI Services**: Embeddings, vision, speech, content safety, document intelligence, language services, translator.
- **xAI Grok**: Grok-2 for chat/voice, Aurora for image generation.

### Database
- **Neon PostgreSQL**: Serverless Postgres for data persistence and session storage.

### Authentication
- **Replit OIDC**: Identity provider for user authentication.

### Payment Processing
- **Stripe**: Customer billing, subscription management, and pricing tables.

## Subscription Tiers

### Free Tier ($0/forever)
- 100 messages per month
- Basic chat mode
- Standard response time
- Community support

### Unlimited Starter ($20/month)
- Unlimited messages
- All 5 AI modes (Chat, Search, Research, Code, Voice)
- Voice conversations with ElevenLabs
- Image generation (DALL-E & Grok Aurora)
- Extended memory system
- Priority support
- Early access to new features

### Pro ($97/month)
- Everything in Unlimited Starter
- 10x faster response times
- Advanced AI models
- Custom AI personalities
- API access
- Unlimited image generation
- Priority voice processing
- White-glove support

### Enterprise ($297/month)
- Everything in Pro
- 5 team seats included
- Up to 5 verified domains
- Team memory (extended organizational knowledge)
- Shared knowledge base
- Admin dashboard
- SSO integration
- Dedicated account manager
- Custom contracts
- 99.9% uptime SLA

### Business Integrations
- **GoHighLevel CRM**: Contact management and workflow automation.
- **Azure Cosmos DB**: Document storage for conversations.
- **Azure Search**: Knowledge base search functionality.

### Cloud Services
- **Azure services**: Utilized across multiple regions (primarily eastus) for various AI and infrastructure needs.