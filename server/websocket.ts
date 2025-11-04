// Reference: javascript_websocket, javascript_anthropic_ai_integrations, javascript_openai_ai_integrations blueprints
import { WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { storage } from "./storage";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { perplexity } from "./perplexity";
import { orchestrator } from "./providers/orchestrator";

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

/**
 * Update conversation memory with context, summary, and key topics
 */
async function updateConversationMemory(
  conversationId: string,
  messages: any[],
  lastResponse: string
) {
  try {
    // Only update memory every 5 messages to avoid too frequent updates
    if (messages.length % 5 !== 0) return;

    // Get conversation to check current state
    const conversation = await storage.getConversationById(conversationId);
    if (!conversation) return;

    // Extract key topics from the last few messages
    const recentMessages = messages.slice(-10);
    const content = recentMessages.map(m => m.content).join(' ');
    
    // Simple key topic extraction (could be enhanced with NLP)
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 4) { // Only consider words longer than 4 chars
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }
    
    const keyTopics = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // Generate a simple summary
    const summary = `Conversation with ${messages.length} messages discussing: ${keyTopics.join(', ')}`;

    // Extract user preferences and context
    const context = {
      messageCount: messages.length,
      lastActive: new Date().toISOString(),
      topics: keyTopics,
      preferences: {
        preferredModel: conversation.model,
        mode: conversation.mode,
      },
    };

    // Update the conversation
    await storage.updateConversation(conversationId, {
      summary,
      keyTopics,
      context,
    });
  } catch (error) {
    console.error('Error updating conversation memory:', error);
    // Don't throw - this is a non-critical operation
  }
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
  const { conversationId, message: userMessage, model, mode, imageData } = message;

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

    // Get conversation history
    const messages = await storage.getMessagesByConversationId(conversationId);
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Add image data if present
    if (imageData) {
      conversationHistory[conversationHistory.length - 1].imageData = imageData;
    }

    // Use orchestrator to handle all models and modes
    try {
      const fullResponse = await orchestrator.processRequest(
        conversationHistory,
        ws as any,
        {
          model,
          mode: mode || 'chat',
          temperature: 0.7,
          maxTokens: 4096,
        }
      );

      // Save assistant message
      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        model,
      });

      // Update conversation memory (context, summary, key topics)
      await updateConversationMemory(conversationId, conversationHistory, fullResponse);

      // Send done signal
      ws.send(JSON.stringify({
        type: "done",
      }));

      return;
    } catch (error) {
      // Fallback to legacy handlers if orchestrator fails
      console.log('Orchestrator failed, falling back to legacy handlers:', error);
      
      // Handle different modes with legacy code
      if (mode === 'search') {
        await handleSearchMode(ws, conversationId, userMessage, model);
        return;
      }

    }
    
    // Continue with legacy chat handling...
    // Check if AI clients are available
    if (!anthropic && !openai) {
      ws.send(JSON.stringify({
        type: "error",
        message: "AI services not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to secrets.",
      }));
      return;
    }

    // Re-use conversation history from above
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

// WEB SEARCH MODE - Powered by Perplexity with citations
async function handleSearchMode(
  ws: AuthenticatedSocket,
  conversationId: string,
  userMessage: string,
  model: string
) {
  try {
    // Get conversation history for context
    const messages = await storage.getMessagesByConversationId(conversationId);
    
    // Build Perplexity message format
    const perplexityMessages = [
      {
        role: 'system' as const,
        content: 'You are Cookin\' Knowledge, Your Gotta Guy™. Provide accurate, well-researched answers with proper citations. Be comprehensive but concise.',
      },
      // Include recent conversation context (last 5 messages for context)
      ...messages.slice(-5).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Ensure we end with user message (Perplexity requirement)
    if (perplexityMessages[perplexityMessages.length - 1].role !== 'user') {
      // This shouldn't happen since we just saved the user message, but safety check
      perplexityMessages.push({
        role: 'user' as const,
        content: userMessage,
      });
    }

    ws.send(JSON.stringify({
      type: "status",
      message: "🔍 Searching the web...",
    }));

    // Search with Perplexity
    const searchResult = await perplexity.search(perplexityMessages, {
      model: 'llama-3.1-sonar-large-128k-online',
      temperature: 0.2,
      searchRecencyFilter: 'month',
      returnRelatedQuestions: true,
    });

    // Stream the answer
    const answer = searchResult.answer;
    const chunkSize = 50; // Stream in chunks for better UX
    
    for (let i = 0; i < answer.length; i += chunkSize) {
      const chunk = answer.slice(i, i + chunkSize);
      ws.send(JSON.stringify({
        type: "chunk",
        content: chunk,
      }));
      // Small delay for smooth streaming effect
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Send citations
    if (searchResult.citations.length > 0) {
      const citationsText = '\n\n**Sources:**\n' + 
        searchResult.citations.map((url, idx) => `${idx + 1}. ${url}`).join('\n');
      
      ws.send(JSON.stringify({
        type: "chunk",
        content: citationsText,
      }));
    }

    // Save assistant message with search results
    await storage.createMessage({
      conversationId,
      role: "assistant",
      content: perplexity.formatWithCitations(searchResult),
      model: 'perplexity-search',
      searchResults: {
        citations: searchResult.citations,
        usage: searchResult.usage,
      } as any,
    });

    ws.send(JSON.stringify({
      type: "done",
    }));

  } catch (error) {
    console.error("Search mode error:", error);
    
    let errorMessage = "Search failed. ";
    if (error instanceof Error && error.message.includes('PERPLEXITY_API_KEY')) {
      errorMessage += "Please add PERPLEXITY_API_KEY to enable web search.";
    } else {
      errorMessage += error instanceof Error ? error.message : "An error occurred";
    }
    
    ws.send(JSON.stringify({
      type: "error",
      message: errorMessage,
    }));
  }
}
