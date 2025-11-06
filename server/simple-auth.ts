// Simple username/password authentication
import bcrypt from "bcryptjs";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Export the session store for WebSocket authentication
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
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupSimpleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).send("Email and password required");
      }

      // Get user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user || !user.passwordHash) {
        return res.status(401).send("Invalid email or password");
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValid) {
        return res.status(401).send("Invalid email or password");
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      res.json({ success: true, user: (req.session as any).user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).send("Login failed");
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Logout failed");
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).send("Unauthorized");
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).send("Failed to fetch user");
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.userId) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
}