// Reference: javascript_log_in_with_replit, javascript_websocket blueprints
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { handleWebSocket } from "./websocket";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const server = createServer(app);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup authentication
  await setupAuth(app);

  // Register API routes
  registerRoutes(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, request) => {
    try {
      // Get the authenticated user from session
      const user = (request as any).user;
      
      if (user && user.sub && user.email) {
        // Use authenticated user
        const userId = user.sub;
        const email = user.email;
        
        console.log("WebSocket connection authenticated for:", email);
        handleWebSocket(ws, request, userId, email);
      } else {
        // Fallback to default user for testing
        let userId = "default-user";
        let email = "user@example.com";
        
        // Ensure the default user exists
        const storage = await import("./storage").then(m => m.storage);
        try {
          await storage.upsertUser({
            id: userId,
            email: email,
            firstName: "Default",
            lastName: "User"
          });
        } catch (error) {
          console.error("Error ensuring user exists:", error);
        }
        
        console.log("WebSocket connection using default user");
        handleWebSocket(ws, request, userId, email);
      }
    } catch (error) {
      console.error("WebSocket connection error:", error);
      ws.close();
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
