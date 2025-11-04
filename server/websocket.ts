// Reference: javascript_websocket, javascript_anthropic_ai_integrations, javascript_openai_ai_integrations blueprints
import { WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { storage } from "./storage";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

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

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  email?: string;
}

export function handleWebSocket(ws: AuthenticatedSocket, request: IncomingMessage, userId: string, email: string) {
  ws.userId = userId;
  ws.email = email;

  console.log(`WebSocket connected for user: ${email}`);

  ws.on("message", async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === "chat") {
        await handleChatMessage(ws, message);
      }
    } catch (error) {
      console.error("WebSocket error:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: "Failed to process message",
      }));
    }
  });

  ws.on("close", () => {
    console.log(`WebSocket disconnected for user: ${email}`);
  });
}

async function handleChatMessage(ws: AuthenticatedSocket, message: any) {
  const { conversationId, message: userMessage, model } = message;

  if (!ws.userId) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Unauthorized",
    }));
    return;
  }

  try {
    // Save user message
    await storage.createMessage({
      conversationId,
      role: "user",
      content: userMessage,
    });

    // Check if AI clients are available
    if (!anthropic && !openai) {
      ws.send(JSON.stringify({
        type: "error",
        message: "AI services not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to secrets.",
      }));
      return;
    }

    // Get conversation history
    const messages = await storage.getMessagesByConversationId(conversationId);
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    let fullResponse = "";

    // Stream response based on model
    if (model.includes("claude") || model.includes("anthropic")) {
      if (!anthropic) {
        ws.send(JSON.stringify({
          type: "error",
          message: "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to secrets.",
        }));
        return;
      }

      const stream = await anthropic.messages.stream({
        model: model === "claude-opus-4-1" ? "claude-opus-4-20250514" : "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: conversationHistory,
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const text = chunk.delta.text;
          fullResponse += text;
          ws.send(JSON.stringify({
            type: "chunk",
            content: text,
          }));
        }
      }
    } else {
      if (!openai) {
        ws.send(JSON.stringify({
          type: "error",
          message: "OpenAI API key not configured. Please add OPENAI_API_KEY to secrets.",
        }));
        return;
      }

      // OpenAI streaming
      const stream = await openai.chat.completions.create({
        model: model === "gpt-5" ? "gpt-4-turbo-preview" : "gpt-4-turbo-preview",
        messages: conversationHistory,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          ws.send(JSON.stringify({
            type: "chunk",
            content,
          }));
        }
      }
    }

    // Save assistant message
    await storage.createMessage({
      conversationId,
      role: "assistant",
      content: fullResponse,
      model,
    });

    // Send done signal
    ws.send(JSON.stringify({
      type: "done",
    }));
  } catch (error) {
    console.error("Chat error:", error);
    ws.send(JSON.stringify({
      type: "error",
      message: error instanceof Error ? error.message : "Failed to generate response",
    }));
  }
}
