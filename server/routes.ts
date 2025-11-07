// Reference: javascript_log_in_with_replit, javascript_openai_ai_integrations, javascript_anthropic_ai_integrations blueprints
import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import {
  insertConversationSchema,
  insertMessageSchema,
  insertApiEnvironmentSchema,
  insertEnvironmentVariableSchema,
} from "@shared/schema";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { fileProcessor } from "./fileprocessor";
import multer from "multer";

// Initialize AI clients only if API keys are available
let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function registerRoutes(app: Express) {
  // Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }
    try {
      const userId = req.session.user.id;
      if (!userId) {
        return res.status(401).send("Unauthorized");
      }
      const user = await storage.getUserById(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const userId = req.session.user!.id;
      if (!userId) {
        return res.status(401).send("Unauthorized");
      }
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).send("Failed to fetch conversations");
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const userId = req.session.user!.id;
      if (!userId) {
        return res.status(401).send("Unauthorized");
      }
      const data = insertConversationSchema.parse({
        ...req.body,
        userId,
      });
      const conversation = await storage.createConversation(data);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).send("Failed to create conversation");
    }
  });

  // Messages
  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const messages = await storage.getMessagesByConversationId(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Failed to fetch messages");
    }
  });

  // API Environments
  app.get("/api/environments", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const userId = req.session.user!.id;
      if (!userId) {
        return res.status(401).send("Unauthorized");
      }
      const environments = await storage.getEnvironmentsByUserId(userId);
      res.json(environments);
    } catch (error) {
      console.error("Error fetching environments:", error);
      res.status(500).send("Failed to fetch environments");
    }
  });

  app.post("/api/environments", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const userId = req.session.user!.id;
      if (!userId) {
        return res.status(401).send("Unauthorized");
      }
      const data = insertApiEnvironmentSchema.parse({
        ...req.body,
        userId,
      });
      const environment = await storage.createEnvironment(data);
      res.json(environment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating environment:", error);
      res.status(500).send("Failed to create environment");
    }
  });

  // Environment Variables
  app.get("/api/environments/:id/variables", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const variables = await storage.getVariablesByEnvironmentId(req.params.id);
      res.json(variables);
    } catch (error) {
      console.error("Error fetching variables:", error);
      res.status(500).send("Failed to fetch variables");
    }
  });

  app.post("/api/environments/:id/variables", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const data = insertEnvironmentVariableSchema.parse({
        ...req.body,
        environmentId: req.params.id,
      });
      const variable = await storage.createVariable(data);
      res.json(variable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating variable:", error);
      res.status(500).send("Failed to create variable");
    }
  });

  // Playground Execute
  app.post("/api/playground/execute", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const userId = req.session.user!.id;
      if (!userId) {
        return res.status(401).send("Unauthorized");
      }
      const { environmentId, method, url, headers, body } = req.body;
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method,
        headers: headers || {},
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const responseTime = Date.now() - startTime;
      const responseData = await response.json();

      // Save to history
      await storage.createRequestHistory({
        userId,
        environmentId,
        method,
        url,
        headers,
        body,
        response: JSON.stringify(responseData),
        statusCode: response.status,
        responseTime,
      });

      res.json({
        data: responseData,
        status: response.status,
      });
    } catch (error) {
      console.error("Error executing request:", error);
      res.status(500).json({ error: "Failed to execute request" });
    }
  });

  // Stats
  app.get("/api/stats", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const userId = req.session.user!.id;
      if (!userId) {
        return res.status(401).send("Unauthorized");
      }
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).send("Failed to fetch stats");
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(403).send("Forbidden");
    }

    try {
      const userId = req.session.user!.id;
      if (!userId) {
        return res.status(403).send("Forbidden");
      }
      const user = await storage.getUserById(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).send("Forbidden");
      }
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).send("Failed to fetch admin stats");
    }
  });

  app.get("/api/admin/users", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(403).send("Forbidden");
    }

    try {
      const userId = req.session.user!.id;
      if (!userId) {
        return res.status(403).send("Forbidden");
      }
      const user = await storage.getUserById(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).send("Forbidden");
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Failed to fetch users");
    }
  });

  // File Upload Routes
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5, // Max 5 files at once
    },
  });

  // Single file upload
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const processedFile = await fileProcessor.processFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json(processedFile);
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  // Multiple file upload
  app.post("/api/upload/multiple", upload.array("files", 5), async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files provided" });
      }

      const files = req.files.map(file => ({
        buffer: file.buffer,
        name: file.originalname,
        mimeType: file.mimetype,
      }));

      const processedFiles = await fileProcessor.processMultipleFiles(files);
      res.json(processedFiles);
    } catch (error) {
      console.error("Error processing files:", error);
      res.status(500).json({ message: "Failed to process files" });
    }
  });

  // Get file info
  app.get("/api/upload/:fileId", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const stats = await fileProcessor.getFileStats(req.params.fileId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting file stats:", error);
      res.status(404).json({ message: "File not found" });
    }
  });

  // Voice endpoints
  // Text to Speech
  app.post("/api/voice/tts", async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const { text, voiceId } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const { elevenLabs } = await import("./providers/elevenlabs");
      
      if (!elevenLabs.isAvailable()) {
        return res.status(503).json({ message: "Text-to-speech service not available" });
      }

      const audioBuffer = await elevenLabs.textToSpeech(text, { 
        voiceId: voiceId || "21m00Tcm4TlvDq8ikWAM" 
      });
      
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });

  // Speech to Text (using OpenAI Whisper)
  app.post("/api/voice/stt", upload.single("audio"), async (req: Request, res: Response) => {
    if (!req.session?.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      if (!openai) {
        return res.status(503).json({ message: "Speech recognition not available" });
      }

      // Convert buffer to File object for OpenAI
      const file = new File([req.file.buffer], "audio.webm", { type: req.file.mimetype });
      
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: "en",
      });

      res.json({ text: transcription.text });
    } catch (error) {
      console.error("STT error:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });
}
