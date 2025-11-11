# Cookin' Knowledge - Vercel Deployment Guide

## 🚀 Production Deployment to Vercel

This guide walks you through deploying the Cookin' Knowledge AI platform to Vercel with full WebSocket support for real-time chat streaming.

---

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** - Install: `npm install -g vercel`
3. **PostgreSQL Database** - Neon, Supabase, or other hosted Postgres
4. **API Keys** - Anthropic, OpenAI, ElevenLabs, etc.

---

## Architecture Overview

**Challenge:** Vercel serverless functions don't support persistent WebSockets.

**Solution:** Deploy the full Express.js server to Vercel's Node.js runtime (not serverless).

```
┌─────────────────────┐
│   Vercel Hosting    │
│                     │
│  Express Server     │  ← Full Node.js app
│  - REST API routes  │
│  - WebSocket (/ws)  │
│  - Static frontend  │
└─────────────────────┘
         │
         ├─→ Neon PostgreSQL
         ├─→ Anthropic AI
         └─→ Other services
```

---

## Step 1: Create `vercel.json` Configuration

Create a `vercel.json` file in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["client/dist/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/ws",
      "dest": "server/index.ts"
    },
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "server/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Important:** This configuration:
- Uses `@vercel/node` builder for full Node.js runtime (not serverless)
- Routes WebSocket (`/ws`) and API requests to Express server
- Routes all other requests to Express (for static file serving)

---

## Step 2: Build Configuration

The existing `package.json` already has the necessary build script:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

Vercel will automatically use the `build` script during deployment. The build:
1. Compiles the frontend with Vite
2. Bundles the backend with esbuild
3. Outputs to `dist/` directory

**Note:** You can optionally add a `vercel-build` script manually if you need Vercel-specific build steps, but it's not required.

---

## Step 3: Set Up Environment Variables

### Required Variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database

# Session Security
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# OIDC Authentication (Replit Auth)
# CRITICAL: ISSUER_URL must be https://replit.com (NOT your custom domain!)
ISSUER_URL=https://replit.com
REPL_ID=0bceeef8-7d6e-4ce0-9f65-7775bbfceabf

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Other Services
PERPLEXITY_API_KEY=...
GROK_API_KEY=...
```

### Add to Vercel:

**Option A: Via Vercel Dashboard**
1. Go to your project → Settings → Environment Variables
2. Add each variable above
3. Select "Production", "Preview", and "Development" environments

**Option B: Via Vercel CLI**
```bash
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production
vercel env add ANTHROPIC_API_KEY production
# ... etc
```

---

## Step 4: Database Setup

### Using Neon PostgreSQL (Recommended):

1. **Create Neon Project**
   - Go to [neon.tech](https://neon.tech)
   - Create new project
   - Copy connection string

2. **Push Schema to Production DB**
   ```bash
   # Set production DATABASE_URL locally
   export DATABASE_URL="postgresql://..."
   
   # Push schema
   npm run db:push
   ```

3. **Verify Tables Created**
   ```bash
   npm run db:studio
   # Opens Drizzle Studio to view tables
   ```

### Alternative: Supabase, Railway, or other hosted Postgres

The app works with any PostgreSQL database. Just:
1. Get connection string
2. Set `DATABASE_URL` environment variable
3. Run `npm run db:push`

---

## Step 5: Deploy to Vercel

### Initial Deployment:

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

The CLI will:
1. Build your app (`npm run vercel-build`)
2. Upload to Vercel
3. Configure routes and environment
4. Provide deployment URL

### Subsequent Deployments:

```bash
# Deploy latest changes
vercel --prod
```

Or connect GitHub/GitLab for automatic deployments on push.

---

## Step 6: Configure OIDC Redirect URLs

After deploying, update your OIDC provider (Replit Auth) with the production callback URL:

**Allowed Redirect URIs:**
```
https://your-app.vercel.app/api/login/callback
```

**Allowed Logout URIs:**
```
https://your-app.vercel.app/
```

Update these in your Replit project settings or OIDC provider dashboard.

---

## Step 7: Test Production Deployment

1. **Visit Deployment URL**
   ```
   https://your-app.vercel.app
   ```

2. **Test Authentication**
   - Click "Login"
   - Complete OIDC flow
   - Should redirect back to app

3. **Test Chat**
   - Navigate to `/chat`
   - Send a message
   - Verify WebSocket connection works
   - Confirm streaming response appears

4. **Check Logs**
   ```bash
   vercel logs
   ```

---

## WebSocket Configuration Notes

### How WebSockets Work on Vercel:

Vercel's Node.js runtime supports WebSockets, but with these considerations:

1. **Connection Limits**
   - Hobby plan: Limited concurrent connections
   - Pro plan: Higher limits
   - Enterprise: Custom limits

2. **Timeout Behavior**
   - Idle connections may timeout after 5-10 minutes
   - Implement heartbeat/ping-pong to keep alive

3. **Load Balancing**
   - Multiple instances may be running
   - WebSocket reconnection should be handled gracefully

### Adding Heartbeat (Recommended):

Update `server/websocket.ts` to add ping/pong:

```typescript
// In handleWebSocket function
const pingInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
  }
}, 30000); // 30 seconds

ws.on('pong', () => {
  console.log('[WS] Pong received, connection alive');
});

ws.on('close', () => {
  clearInterval(pingInterval);
});
```

---

## Alternative: Split Architecture

If you encounter WebSocket issues on Vercel, consider split architecture:

### Option A: WebSocket on Render.com

1. **Deploy WebSocket server to Render**
   - Render fully supports WebSockets
   - Deploy same Express app
   - Only use for `/ws` endpoint

2. **Deploy API to Vercel**
   - Remove WebSocket from Vercel deployment
   - Use serverless functions for REST API

3. **Update Frontend**
   ```typescript
   // Point WebSocket to Render
   const wsUrl = new URL('/ws', 'wss://your-app.onrender.com');
   
   // API requests still go to Vercel
   const apiUrl = 'https://your-app.vercel.app/api';
   ```

### Option B: Managed WebSocket Service

Use Ably, Pusher, or Socket.io managed service:
- No server maintenance
- Built-in scaling
- Higher cost

---

## Custom Domain Setup

1. **Add Domain in Vercel**
   - Project Settings → Domains
   - Add `saintsal.ai` or your domain

2. **Update DNS Records**
   ```
   Type: CNAME
   Name: @  (or www)
   Value: cname.vercel-dns.com
   ```

3. **Update OIDC Redirect URLs**
   ```
   https://saintsal.ai/api/login/callback
   ```

---

## Monitoring & Debugging

### View Logs:
```bash
vercel logs --follow
```

### Common Issues:

**WebSocket 400/503 Errors:**
- Check Vercel plan limits
- Verify `vercel.json` routes
- Ensure environment variables set

**Database Connection Issues:**
- Verify `DATABASE_URL` in Vercel env vars
- Check Neon connection pooling settings
- Test connection locally with production URL

**OIDC Callback Failures:**
- Verify callback URL matches exactly
- Check `SESSION_SECRET` is set
- Ensure `ISSUER_URL` is correct

---

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Database schema pushed to production
- [ ] OIDC redirect URLs updated
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS working (automatic on Vercel)
- [ ] Chat streaming tested end-to-end
- [ ] API playground tested
- [ ] Stripe webhooks configured (if using payments)
- [ ] Error monitoring setup (Sentry, LogRocket, etc.)

---

## Next Steps

1. **Deploy:** Run `vercel --prod`
2. **Test:** Visit your deployment URL
3. **Monitor:** Check logs and performance
4. **Scale:** Upgrade Vercel plan if needed

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Drizzle ORM:** https://orm.drizzle.team
- **WebSocket API:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

## 🎉 You're Ready!

Your Cookin' Knowledge platform is production-ready. Deploy with confidence!

```bash
vercel --prod
```

**Questions?** Check the logs or review this guide.
