# SaintSal

## Overview

SaintSal (saintsal.ai) is an enterprise-grade AI platform for professional developers and teams. The platform provides production-ready AI chat, API playground, development console, and comprehensive API key management. Protected by U.S. Patent #10,290,222 for escalation/de-escalation in virtual environments.

The platform combines enterprise conversational AI (Claude, GPT) with professional developer tools for API testing, environment management, team collaboration, and API key issuance. Built for organizations that need enterprise-grade infrastructure with role-based access controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, bundled using Vite

**UI Component System**: Shadcn/ui (Radix UI primitives) with Tailwind CSS
- Design philosophy follows Apple HIG principles: minimalist, content-focused with purposeful whitespace
- Typography uses Inter font family with a comprehensive scale (Display, H1-H3, Body variations)
- Custom theme system supporting light/dark modes via CSS variables
- Responsive breakpoints: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)

**Layout Strategy**:
- Fixed sidebar navigation (256px, collapsible to 64px icon-only)
- Max-width constraints for readability (800px for chat, 1280px for general content)
- Two-column API playground (40/60 split for configuration/response)

**State Management**:
- TanStack Query (React Query) for server state and API caching
- React Context for theme management
- Local component state for UI interactions

**Routing**: Wouter for lightweight client-side routing

**Key Pages**:
- Landing: Marketing page with features and pricing
- Dashboard: User overview with quick actions
- Chat: Real-time AI conversation interface with WebSocket streaming
- Playground: API testing environment with request/response inspection
- Settings: User profile and environment management
- Admin: Role-restricted analytics and user management

### Backend Architecture

**Runtime**: Node.js with Express.js

**API Design**: RESTful endpoints with WebSocket support for streaming
- `/api/auth/*` - Authentication flows
- `/api/conversations` - Chat conversation management
- `/api/messages` - Message CRUD operations
- `/api/environments` - API environment configuration
- `/api/admin/*` - Administrative endpoints (role-restricted)

**Authentication Strategy**: OpenID Connect (OIDC) via Replit Auth
- Session-based authentication using express-session
- PostgreSQL session store (connect-pg-simple)
- Passport.js for OIDC strategy implementation
- Role-based access control (admin, developer, viewer)

**Real-time Communication**: WebSocket server for AI streaming responses
- Separate WebSocket handlers for chat and API playground
- Authenticated WebSocket connections using session data
- Streaming token-by-token AI responses for improved UX

**Database Layer**: Drizzle ORM with Neon PostgreSQL
- Schema-first approach with TypeScript type safety
- Migration system via Drizzle Kit
- Connection pooling with @neondatabase/serverless

**Data Models**:
- Users: Authentication, roles, Stripe subscription integration
- Conversations: Chat sessions with model tracking
- Messages: Individual chat messages with role (user/assistant/system)
- API Environments: Named environment configurations for API testing
- Environment Variables: Key-value pairs scoped to environments
- API Request History: Audit trail of API playground requests
- Sessions: OIDC session persistence

### AI Integration Architecture

**Multi-Provider Support**:
- Anthropic Claude (via @anthropic-ai/sdk)
- OpenAI GPT (via openai package)
- Azure AI services (multiple endpoints for embeddings, vision, speech, etc.)

**Streaming Implementation**:
- Server-side streaming using AI SDK streaming APIs
- WebSocket transport for real-time client updates
- Token-by-token rendering in React components

**Model Selection**: User-configurable per conversation
- Default: Claude Sonnet 4.5
- Alternative models selectable via UI dropdown

### Subscription & Monetization

**Payment Processing**: Stripe integration
- Customer and subscription tracking in user table
- Embedded Stripe pricing table for self-service signup
- Subscription status tracking (free, paid tiers)

**Pricing Tiers**:
- Free: 100 AI messages/month, basic features
- Pro: 5000 messages/month, priority support, advanced features
- Enterprise: Custom limits, white-label, dedicated support

## External Dependencies

### Third-Party Services

**AI Providers**:
- Anthropic API (Claude models) - API key required via ANTHROPIC_API_KEY
- OpenAI API (GPT models) - Optional via OPENAI_API_KEY
- Azure AI Foundry - Multiple services (embeddings, vision, speech, content safety)
- Azure Cognitive Services - Document intelligence, language services, translator
- ElevenLabs - Text-to-speech API
- Google Gemini - Live AI API

**Database**:
- Neon PostgreSQL - Serverless Postgres via DATABASE_URL
- Uses WebSocket constructor (ws package) for serverless compatibility

**Authentication**:
- Replit OIDC - Identity provider via ISSUER_URL and REPL_ID
- Session secret required via SESSION_SECRET

**Payment Processing**:
- Stripe - Customer billing and subscription management
- Publishable key: pk_live_51SGbmHGVzsQbCDmm...
- Pricing table ID: prctbl_1SIQItGVzsQbCDmmZ97ubwpM

**Business Integrations**:
- GoHighLevel CRM - Contact management and workflow automation
- Azure Cosmos DB - Document storage for conversations
- Azure Search - Knowledge base search functionality

### Infrastructure Services

**Email & SMS**:
- Agent email: ryan@cookinknowledge.com
- Agent phone: +19499972097

**Cloud Services**:
- Azure services across multiple regions (primarily eastus)
- Azure Speech Services for STT/TTS
- Azure Vision and Document Intelligence

**Development Tools**:
- Replit development plugins (@replit/vite-plugin-*)
- GitHub access token for repository integrations

### Required Environment Variables

**Critical for Core Functionality**:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session encryption key
- `REPL_ID` - Replit environment identifier
- `ISSUER_URL` - OIDC provider URL (defaults to replit.com/oidc)
- `ANTHROPIC_API_KEY` - Claude API access (primary AI provider)

**Optional AI Enhancements**:
- `OPENAI_API_KEY` - GPT model access
- `AZURE_*` - Various Azure AI service credentials
- `ELEVENLABS_API_KEY` - Voice synthesis
- `GEMINI_API_LIVE_KEY` - Google AI access

**Business Integration**:
- `GHL_*` - GoHighLevel CRM credentials and webhooks
- Stripe keys (embedded in frontend pricing table)