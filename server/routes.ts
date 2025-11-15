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
// Use simple email/password authentication
import { setupSimpleAuth, isAuthenticated } from "./simple-auth";

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

// Helper to sanitize user data (exclude sensitive fields like passwordHash)
function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    stripeCustomerId: user.stripeCustomerId,
  };
}

export async function registerRoutes(app: Express) {
  // ✅ SETUP SIMPLE EMAIL/PASSWORD AUTHENTICATION
  await setupSimpleAuth(app);

  // Conversations (protected by isAuthenticated)
  app.get("/api/conversations", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).send("Failed to fetch conversations");
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
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

  app.delete("/api/conversations/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const conversationId = req.params.id;
      
      // Verify the conversation belongs to the user
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      await storage.deleteConversation(conversationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Messages (protected by isAuthenticated)
  app.get("/api/conversations/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const messages = await storage.getMessagesByConversationId(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Failed to fetch messages");
    }
  });

  // API Environments (protected by isAuthenticated)
  app.get("/api/environments", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      const environments = await storage.getEnvironmentsByUserId(userId);
      res.json(environments);
    } catch (error) {
      console.error("Error fetching environments:", error);
      res.status(500).send("Failed to fetch environments");
    }
  });

  app.post("/api/environments", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
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

  // Environment Variables (protected by isAuthenticated)
  app.get("/api/environments/:id/variables", isAuthenticated, async (req: any, res: Response) => {
    try {
      const variables = await storage.getVariablesByEnvironmentId(req.params.id);
      res.json(variables);
    } catch (error) {
      console.error("Error fetching variables:", error);
      res.status(500).send("Failed to fetch variables");
    }
  });

  app.post("/api/environments/:id/variables", isAuthenticated, async (req: any, res: Response) => {
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

  // Playground Execute (protected by isAuthenticated)
  app.post("/api/playground/execute", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
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

  // Stats (protected by isAuthenticated)
  app.get("/api/stats", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).send("Failed to fetch stats");
    }
  });

  // Admin routes - temporarily disabled for local dev
  // Uncomment and implement requireAdmin middleware when needed
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).send("Failed to fetch admin stats");
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res: Response) => {
    try {
      // TODO: Add role-based authorization check (admin only)
      const users = await storage.getAllUsers();
      // Sanitize user data to exclude passwordHash
      const sanitizedUsers = users.map(user => sanitizeUser(user));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Failed to fetch users");
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 10);

      // TODO: Implement createUser in storage
      res.status(501).json({ message: "User creation not implemented yet" });
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message?.includes('unique')) {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const targetUserId = req.params.id;
      const { email, password, firstName, lastName, phone, role } = req.body;

      const updates: any = {};
      if (email) updates.email = email;
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (role) updates.role = role;
      
      if (password) {
        const bcrypt = await import('bcryptjs');
        updates.passwordHash = await bcrypt.hash(password, 10);
      }

      // TODO: Implement updateUser in storage
      res.status(501).json({ message: "User update not implemented yet" });
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.message?.includes('unique')) {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // User Profile Routes (protected by isAuthenticated)
  const profileUpdateSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone format").min(10, "Phone must be at least 10 characters").max(20),
  }).strict(); // Ensure no extra fields are sent

  app.patch("/api/user/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      
      console.log("[PATCH /api/user/profile] Request body:", JSON.stringify(req.body));
      
      // Validate request body
      const validatedData = profileUpdateSchema.parse(req.body);
      
      console.log("[PATCH /api/user/profile] Validated data:", JSON.stringify(validatedData));

      const updatedUser = await storage.updateUser(userId, validatedData);
      
      console.log("[PATCH /api/user/profile] Updated user:", updatedUser.id, updatedUser.firstName, updatedUser.lastName, updatedUser.phone);
      
      // Return safe user data (exclude passwordHash and other sensitive fields)
      res.json(sanitizeUser(updatedUser));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error("[PATCH /api/user/profile] Validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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

  // Profile Image Upload (protected by isAuthenticated)
  app.post("/api/user/profile-image", isAuthenticated, upload.single("image"), async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
      }

      // Validate image type
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "File must be an image" });
      }

      // Process image and get base64
      const processedFile = await fileProcessor.processFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Create data URL for profile image
      const profileImageUrl = `data:${req.file.mimetype};base64,${processedFile.base64}`;

      // Update user profile with image URL
      const updatedUser = await storage.updateUser(userId, { profileImageUrl });
      
      // Return safe user data (exclude passwordHash)
      res.json({ 
        user: sanitizeUser(updatedUser),
        imageUrl: profileImageUrl 
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // File Upload Routes (protected by isAuthenticated)
  app.post("/api/upload", isAuthenticated, upload.single("file"), async (req: any, res: Response) => {
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

  app.post("/api/upload/multiple", isAuthenticated, upload.array("files", 5), async (req: any, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files provided" });
      }

      const files = (req.files as any[]).map((file: any) => ({
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

  app.get("/api/upload/:fileId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const stats = await fileProcessor.getFileStats(req.params.fileId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting file stats:", error);
      res.status(404).json({ message: "File not found" });
    }
  });

  // ✅ IMAGE GENERATION ROUTES
  import('./routes/image-generation').then((module) => {
    app.use('/api/images', module.default);
    console.log('[Routes] Image generation endpoints registered');
  }).catch((error) => {
    console.error('[Routes] Failed to load image generation routes:', error);
  });

  // Voice endpoints (protected by isAuthenticated)
  app.post("/api/voice/tts", isAuthenticated, async (req: any, res: Response) => {
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

  app.post("/api/voice/stt", isAuthenticated, upload.single("audio"), async (req: any, res: Response) => {
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
