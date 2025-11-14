// Replit OIDC Authentication Integration
// Based on blueprint:javascript_log_in_with_replit
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// ====== TypeScript Types for Session Auth ======
export interface ReplitSessionUser {
  id?: string;  // User's OIDC sub claim (optional - may not be set immediately)
  claims: {
    sub: string;
    email?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    exp?: number;  // Token expiration timestamp
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;  // Unix timestamp
}

// Extend Express Request to include typed user
export interface SessionAuthRequest extends Express.Request {
  user: ReplitSessionUser;
}

// Extend Express namespace for type-safe passport usage
declare global {
  namespace Express {
    interface User extends ReplitSessionUser {}
    
    // Add Passport authentication methods to Request
    interface Request {
      user?: User;
      isAuthenticated(): this is { user: User };
      logout(callback: (err: any) => void): void;
    }
  }
}

const getOidcConfig = memoize(
  async () => {
    try {
      // CRITICAL: ISSUER_URL must be https://replit.com (NOT your custom domain)
      // This is Replit's OIDC provider endpoint, not your app's URL
      const issuerUrl = process.env.ISSUER_URL || "https://replit.com";
      const fullIssuerUrl = issuerUrl.endsWith("/oidc") ? issuerUrl : `${issuerUrl}/oidc`;
      
      if (!process.env.REPL_ID) {
        throw new Error("REPL_ID environment variable is required for OIDC authentication");
      }
      
      console.log(`[OIDC] Discovering configuration from: ${fullIssuerUrl}`);
      console.log(`[OIDC] Client ID (REPL_ID): ${process.env.REPL_ID}`);
      
      const config = await client.discovery(
        new URL(fullIssuerUrl),
        process.env.REPL_ID
      );
      
      console.log(`[OIDC] ✅ Successfully discovered OIDC configuration`);
      return config;
    } catch (error) {
      console.error(`[OIDC] ❌ Failed to discover OIDC configuration:`, error);
      console.error(`[OIDC] Make sure ISSUER_URL is set to: https://replit.com`);
      console.error(`[OIDC] Current ISSUER_URL: ${process.env.ISSUER_URL}`);
      console.error(`[OIDC] Current REPL_ID: ${process.env.REPL_ID}`);
      throw error;
    }
  },
  { maxAge: 3600 * 1000 }
);

// Session store singleton - export for WebSocket use
const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const pgStore = connectPg(session);
export const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: false,
  ttl: sessionTtl,
  tableName: "sessions",
});

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  
  // CRITICAL: Only update refresh_token if response includes one
  // OIDC spec allows refresh grants to omit new refresh tokens
  // Preserve existing token to avoid breaking persistent sessions
  if (tokens.refresh_token) {
    user.refresh_token = tokens.refresh_token;
  }
  
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // ✅ FIX: Wrap OIDC config in try-catch to prevent server crashes
  let config: Awaited<ReturnType<typeof client.discovery>> | null = null;
  try {
    config = await getOidcConfig();
  } catch (error) {
    console.error(`[AUTH] ⚠️  OIDC configuration failed - auth routes will be disabled`);
    console.error(`[AUTH] Server will start, but login will not work until ISSUER_URL is fixed`);
    console.error(`[AUTH] Required: ISSUER_URL=https://replit.com (NOT your custom domain)`);
    
    // Install fallback auth routes that explain the issue
    app.get("/api/auth/oidc", (req, res) => {
      res.status(503).json({
        error: "Authentication not available",
        message: "OIDC configuration failed. Please check ISSUER_URL environment variable.",
        details: "ISSUER_URL must be set to: https://replit.com",
        current: process.env.ISSUER_URL
      });
    });
    
    app.get("/api/auth/callback", (req, res) => {
      res.status(503).json({
        error: "Authentication not available",
        message: "OIDC configuration failed."
      });
    });
    
    app.post("/api/auth/logout", (req, res) => {
      res.json({ success: true, message: "Logout unavailable - OIDC not configured" });
    });
    
    // Don't crash the server - just return without setting up real auth
    console.warn(`[AUTH] ⚠️  Server started in degraded mode - fix ISSUER_URL to enable authentication`);
    return;
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config: config!,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/auth/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb: (err: any, id?: Express.User) => void) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb: (err: any, user?: Express.User | false | null) => void) => cb(null, user));

  app.get("/api/auth/oidc", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/auth/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/dashboard",
      failureRedirect: "/login",
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error('[AUTH] Logout error:', err);
        return res.redirect("/");
      }
      res.redirect(
        client.buildEndSessionUrl(config!, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Validate authentication exists
  if (!req.isAuthenticated?.() || !req.user) {
    console.warn("[Auth] Request not authenticated or missing user object");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as ReplitSessionUser;

  // CRITICAL: Validate claims exist (prevents crashes in route handlers)
  if (!user.claims || !user.claims.sub) {
    console.error("[Auth] Session missing claims - forcing re-auth", {
      hasUser: !!user,
      hasClaims: !!user.claims,
      hasClaimsSub: !!(user.claims && user.claims.sub),
    });
    return res.status(401).json({ message: "Unauthorized - invalid session" });
  }

  // Validate expiry exists
  if (!user.expires_at) {
    console.warn("[Auth] Session missing expiry timestamp", {
      userId: user.claims.sub,
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if token is still valid
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired - attempt refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.warn("[Auth] Token expired and no refresh token available", {
      userId: user.claims.sub,
    });
    return res.status(401).json({ message: "Unauthorized - session expired" });
  }

  // Attempt token refresh
  try {
    console.info("[Auth] Refreshing expired token", {
      userId: user.claims.sub,
    });
    
    // CRITICAL: Preserve refresh token before update
    // OIDC spec allows refresh grant to omit new refresh_token
    // Without explicit preservation, sessions break after first refresh
    const previousRefreshToken = user.refresh_token;
    
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    
    // Explicitly restore refresh token if response didn't include new one
    if (!tokenResponse.refresh_token && previousRefreshToken) {
      user.refresh_token = previousRefreshToken;
      console.info("[Auth] Preserved existing refresh token (grant omitted new token)", {
        userId: user.claims.sub,
      });
    }
    
    // Ensure claims are still present after refresh
    if (!user.claims || !user.claims.sub) {
      console.error("[Auth] Token refresh succeeded but claims lost", {
        userId: user.id,
      });
      return res.status(401).json({ message: "Unauthorized - refresh failed" });
    }
    
    // Ensure refresh token is still present (critical for persistent sessions)
    if (!user.refresh_token) {
      console.error("[Auth] Refresh token lost after update - session will break", {
        userId: user.claims.sub,
      });
      return res.status(401).json({ message: "Unauthorized - session corrupted" });
    }
    
    console.info("[Auth] Token refresh successful", {
      userId: user.claims.sub,
      hasNewRefreshToken: !!tokenResponse.refresh_token,
    });
    return next();
  } catch (error) {
    console.error("[Auth] Token refresh failed", {
      userId: user.claims.sub,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(401).json({ message: "Unauthorized - refresh failed" });
  }
};

// Middleware to require admin role
// MUST be used after isAuthenticated middleware
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as ReplitSessionUser;
  const userId = user.claims.sub;

  try {
    const dbUser = await storage.getUserById(userId);
    
    if (!dbUser) {
      console.warn("[Auth] Admin check failed - user not found in database", {
        userId,
      });
      return res.status(403).json({ message: "Forbidden - admin access required" });
    }
    
    if (dbUser.role !== "admin") {
      console.warn("[Auth] Admin check failed - insufficient role", {
        userId,
        role: dbUser.role,
      });
      return res.status(403).json({ message: "Forbidden - admin access required" });
    }
    
    console.info("[Auth] Admin check passed", {
      userId,
    });
    next();
  } catch (error) {
    console.error("[Auth] Error checking admin role", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Internal server error" });
  }
};
