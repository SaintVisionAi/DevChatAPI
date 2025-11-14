// Reference: javascript_log_in_with_replit, javascript_websocket blueprints
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { handleWebSocket } from "./websocket";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const server = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
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
  // ✅ Register API routes (includes setupAuth with Replit OIDC)
  await registerRoutes(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws: any, request: any) => {
    try {
      // Parse session from cookie to get authenticated user
      const cookieHeader = request.headers.cookie;
      if (!cookieHeader) {
        console.error("WebSocket connection rejected: No session cookie");
        ws.close(1008, "Unauthorized - No session");
        return;
      }

      // Extract session ID from cookie
      const cookies = cookieHeader
        .split(";")
        .reduce((acc: any, cookie: string) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        }, {});

      const sessionCookie = cookies["connect.sid"];
      if (!sessionCookie) {
        console.error("WebSocket connection rejected: No session ID");
        ws.close(1008, "Unauthorized - No session ID");
        return;
      }

      // Decode session ID (format: s:sessionId.signature)
      const sessionId = decodeURIComponent(sessionCookie)
        .split(".")[0]
        .substring(2);

      // Load session from PostgreSQL using shared session store
      const { sessionStore } = await import("./simple-auth");

      sessionStore.get(sessionId, async (err: any, session: any) => {
        if (err || !session || !session.userId) {
          console.error(
            "WebSocket connection rejected: Invalid or expired session",
            err,
          );
          ws.close(1008, "Unauthorized - Invalid session");
          return;
        }

        // Extract user from simple-auth session
        const userId = session.userId;
        const email = session.user?.email;

        if (!userId || !email) {
          console.error("WebSocket connection rejected: No user in session");
          ws.close(1008, "Unauthorized - No user");
          return;
        }

        console.log(`WebSocket authenticated for user: ${email} (${userId})`);
        handleWebSocket(ws, request, userId, email);
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
      ws.close(1011, "Internal server error");
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
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
