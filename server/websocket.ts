// Reference: javascript_websocket, javascript_anthropic_ai_integrations, javascript_openai_ai_integrations blueprints
// @ts-ignore - ws types are installed but TypeScript can't find them
import type WebSocket from "ws";
import type { IncomingMessage } from "http";
import { storage } from "./storage";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { perplexity } from "./perplexity";
import { getSaintSalPrompt } from "./providers/saintsal-prompt";
// import { orchestrator } from "./providers/orchestrator"; // Module doesn't exist - commented out

// Initialize AI clients only if API keys are available
let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

if (process.env.ANTHROPIC_API_KEY) {
  try {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('✅ Anthropic client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Anthropic client:', error);
  }
}

if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error);
  }
}

type AuthenticatedSocket = WebSocket & {
  userId?: string;
  email?: string;
};

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

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: "connected",
    message: "WebSocket connection established",
    userId: userId,
  }));

  ws.on("message", async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === "chat") {
        await handleChatMessage(ws, message);
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: "Failed to process message",
      }));
    }
  });

  // Keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) {
      ws.ping();
    }
  }, 30000);

  ws.on("error", (error: Error) => {
    console.error('WebSocket error:', error);
    clearInterval(pingInterval);
  });

  ws.on("close", () => {
    clearInterval(pingInterval);
  });
}

async function handleChatMessage(ws: AuthenticatedSocket, message: any) {
  let { conversationId, message: userMessage, model, mode, imageData } = message;

  if (!ws.userId) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Unauthorized",
    }));
    return;
  }

  // Check message limits
  let shouldIncrementUsage = false;
  try {
    const { checkMessageLimit } = await import('./tier-limits');
    const limitCheck = await checkMessageLimit(ws.userId);
    
    if (!limitCheck.allowed) {
      ws.send(JSON.stringify({
        type: "error",
        message: `Message limit reached! You've used all ${limitCheck.limit} messages this month. Upgrade to send more messages.`,
        code: "LIMIT_REACHED",
        tier: limitCheck.tier,
        limit: limitCheck.limit,
        remaining: 0,
      }));
      return;
    }
    
    shouldIncrementUsage = true;
  } catch (error) {
    console.error('Error checking tier limit:', error);
    // Continue anyway
  }

  try {
    // Create conversation if it doesn't exist
    if (!conversationId) {
      const conversation = await storage.createConversation({
        userId: ws.userId,
        title: userMessage.substring(0, 100),
        model: model || 'gpt-5',
        mode: mode || 'chat',
      });
      conversationId = conversation.id;
      
      ws.send(JSON.stringify({
        type: "conversationCreated",
        conversationId,
      }));
    }

    // Save user message
    const messageData: any = {
      conversationId,
      role: "user",
      content: userMessage,
    };

    if (imageData) {
      messageData.attachments = [{
        type: 'image',
        data: imageData,
        mimeType: imageData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
      }];
    }

    await storage.createMessage(messageData);
    
    // Increment message count
    if (shouldIncrementUsage && ws.userId) {
      try {
        const { incrementMessageCount } = await import('./tier-limits');
        await incrementMessageCount(ws.userId);
      } catch (error) {
        console.error('Failed to increment message count:', error);
      }
    }

    // Get conversation history
    const messages = await storage.getMessagesByConversationId(conversationId);
    
    // Build conversation with SaintSal system prompt
    const systemPrompt = getSaintSalPrompt(mode || 'chat');
    
    // For Anthropic: system is separate, for OpenAI: system is in messages
    const conversationHistoryWithoutSystem = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
    
    // OpenAI format (with system in messages)
    const conversationHistoryWithSystem = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistoryWithoutSystem
    ];

    // Handle image analysis with Gemini if image is present
    if (imageData) {
      const { gemini } = await import("./providers/gemini");
      
      if (gemini.isAvailable()) {
        const prompt = `${userMessage}\n\nPlease analyze the image provided.`;
        const response = await gemini.processImage(imageData, prompt, ws, {
          model: 'gemini-1.5-flash',
          temperature: 0.7,
        });
        
        // Save AI response
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: response,
          model: "gemini-1.5-flash",
        });

        ws.send(JSON.stringify({ type: "done" }));
        
        // Update conversation memory
        await updateConversationMemory(conversationId, messages, response);
        return;
      }
    }

    // Orchestrator module doesn't exist - skip directly to legacy handlers
    // Handle different modes
    if (mode === 'search') {
      await handleSearchMode(ws, conversationId, userMessage, model);
      return;
    }
    
    if (mode === 'code') {
      await handleCodeMode(ws, conversationId, userMessage, model);
      return;
    }
    
    if (mode === 'research') {
      await handleResearchMode(ws, conversationId, userMessage, model);
      return;
    }
    
    if (mode === 'voice') {
      await handleVoiceMode(ws, conversationId, userMessage, model);
      return;
    }
    
    // Continue with legacy chat handling
    if (!anthropic && !openai) {
      ws.send(JSON.stringify({
        type: "error",
        message: "AI services not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to secrets.",
      }));
      return;
    }

    let fullResponse = "";
    
    // ✅ GROK MODEL SUPPORT
    if (model.includes("grok") || model.includes("xai")) {
      const { grok } = await import("./providers/grok");
      
      if (!grok.isAvailable()) {
        ws.send(JSON.stringify({
          type: "error",
          message: "Grok API key not configured. Please add GROK_API_KEY to secrets.",
        }));
        return;
      }

      try {
        fullResponse = await grok.streamChat(conversationHistoryWithSystem, ws, {
          model: 'grok-2-1212',
          temperature: 0.7,
        });

        // Save AI response
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fullResponse,
          model: model,
        });

        ws.send(JSON.stringify({ type: "done" }));
        
        await updateConversationMemory(conversationId, messages, fullResponse);
      } catch (error: any) {
        ws.send(JSON.stringify({
          type: "error",
          message: error.message || "Grok API error",
        }));
      }
      return;
    }
    
    if (model.includes("claude") || model.includes("anthropic")) {
      if (!anthropic) {
        ws.send(JSON.stringify({
          type: "error",
          message: "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to secrets.",
        }));
        return;
      }

      // Map UI model names to Anthropic API model names
      let anthropicModel = "claude-sonnet-4-20250514"; // Default to Sonnet 4
      if (model.includes("opus")) {
        anthropicModel = "claude-opus-4-20250514";
      } else if (model.includes("sonnet-4-5")) {
        anthropicModel = "claude-sonnet-4-20250514";
      } else if (model.includes("sonnet")) {
        anthropicModel = "claude-3-5-sonnet-20241022";
      }
      
      try {
        const stream = await anthropic.messages.stream({
          model: anthropicModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: conversationHistoryWithoutSystem,
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
      } catch (error: any) {
        console.error('Anthropic API error:', error);
        ws.send(JSON.stringify({ 
          type: "error", 
          message: "AI service error: " + (error?.message || String(error))
        }));
        return;
      }
    } else {
      if (!openai) {
        ws.send(JSON.stringify({
          type: "error",
          message: "OpenAI API key not configured. Please add OPENAI_API_KEY to secrets.",
        }));
        return;
      }

      // Map UI model names to OpenAI API model names
      let openaiModel = "gpt-4o"; // Default to GPT-4o (best available as GPT-5 proxy)
      if (model.includes("gpt-5")) {
        openaiModel = "gpt-4o"; // Use GPT-4o as GPT-5 (OpenAI's best model)
      } else if (model.includes("gpt-4")) {
        openaiModel = "gpt-4-turbo-preview";
      }
      
      try {
        // OpenAI streaming
        const stream = await openai.chat.completions.create({
          model: openaiModel,
          messages: conversationHistoryWithSystem,
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
      } catch (error: any) {
        console.error('OpenAI API error:', error);
        ws.send(JSON.stringify({ 
          type: "error", 
          message: "OpenAI service error: " + (error?.message || "Unknown error")
        }));
        return;
      }
    }

    // Save assistant message
    if (fullResponse.length > 0) {
      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        model,
      });
    }

    ws.send(JSON.stringify({ type: "done" }));
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
      model: 'sonar-pro',
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

// CODE MODE - Multi-file code generation and editing
async function handleCodeMode(
  ws: AuthenticatedSocket,
  conversationId: string,
  userMessage: string,
  model: string
) {
  try {
    const { codeAgent } = await import("./providers/codeagent");
    
    // Parse for /code command or file references
    const files = [];
    
    // Process code request
    const codeFiles: any[] = [];
    const response = await codeAgent.processCodeRequest(
      userMessage,
      codeFiles,
      ws as any,
      {
        model: model.includes('claude') ? 'claude-sonnet-4-5-20250929' : 'gpt-4o',
        temperature: 0.3,
        operation: 'analyze',
      }
    );
    
    // Save the response
    await storage.createMessage({
      conversationId,
      role: "assistant",
      content: response,
      model: model,
      codeFiles: codeFiles,
    });
    
    ws.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error('Code mode error:', error);
    ws.send(JSON.stringify({
      type: "error",
      message: "Failed to process code request",
    }));
  }
}

// RESEARCH MODE - Deep chain-of-thought analysis
async function handleResearchMode(
  ws: AuthenticatedSocket,
  conversationId: string,
  userMessage: string,
  model: string
) {
  try {
    ws.send(JSON.stringify({
      type: "chunk",
      content: "🔬 Starting deep research...\n\n",
    }));
    
    // Step 1: Break down the question
    ws.send(JSON.stringify({
      type: "chunk",
      content: "**Step 1: Understanding your question**\n",
    }));
    
    // Use AI to analyze the question
    const analysisPrompt = `Analyze this research question and identify:
1. Key concepts to explore
2. Required data sources
3. Potential sub-questions
4. Research methodology

Question: ${userMessage}`;
    
    let fullResponse = "";
    
    if (anthropic) {
      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.5,
      });
      
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          const text = chunk.delta.text;
          fullResponse += text;
          ws.send(JSON.stringify({
            type: "chunk",
            content: text,
          }));
        }
      }
    } else if (openai) {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.5,
        stream: true,
      });
      
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        fullResponse += text;
        ws.send(JSON.stringify({
          type: "chunk",
          content: text,
        }));
      }
    }
    
    // Step 2: Web search for current information
    ws.send(JSON.stringify({
      type: "chunk",
      content: "\n\n**Step 2: Gathering current information**\n",
    }));
    
    const searchResult = await perplexity.search([
      { role: 'user', content: userMessage }
    ], {
      model: 'sonar-reasoning',
      temperature: 0.3,
      searchRecencyFilter: 'month',
    });
    
    const formattedResult = perplexity.formatWithCitations(searchResult);
    fullResponse += "\n\n" + formattedResult;
    
    ws.send(JSON.stringify({
      type: "chunk",
      content: formattedResult,
    }));
    
    // Step 3: Synthesis
    ws.send(JSON.stringify({
      type: "chunk",
      content: "\n\n**Step 3: Synthesis and Conclusions**\n",
    }));
    
    const synthesisPrompt = `Based on the analysis and research:
${fullResponse}

Provide a comprehensive synthesis with:
1. Key findings
2. Evidence-based conclusions
3. Remaining questions
4. Recommendations`;
    
    if (anthropic) {
      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        messages: [{ role: "user", content: synthesisPrompt }],
        temperature: 0.3,
      });
      
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          const text = chunk.delta.text;
          fullResponse += text;
          ws.send(JSON.stringify({
            type: "chunk",
            content: text,
          }));
        }
      }
    }
    
    // Save the research
    await storage.createMessage({
      conversationId,
      role: "assistant",
      content: fullResponse,
      model: model,
      reasoning: JSON.stringify({
        steps: ["Analysis", "Research", "Synthesis"],
        sources: searchResult.citations,
      }),
    });
    
    ws.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error('Research mode error:', error);
    ws.send(JSON.stringify({
      type: "error",
      message: "Failed to complete research",
    }));
  }
}

// VOICE MODE - Ultra-realistic voice with ElevenLabs SaintSal Agent
async function handleVoiceMode(
  ws: AuthenticatedSocket,
  conversationId: string,
  userMessage: string,
  model: string
) {
  try {
    ws.send(JSON.stringify({
      type: "status",
      message: "🎙️ Processing with SaintSal voice...",
    }));

    const { elevenLabs } = await import("./providers/elevenlabs");
    
    if (!elevenLabs.isAvailable()) {
      ws.send(JSON.stringify({
        type: "error",
        message: "ElevenLabs API key required for voice mode. Please add ELEVENLABS_API_KEY to secrets.",
      }));
      return;
    }

    // Stream conversation with ElevenLabs Conversational AI agent
    // This will handle both text streaming AND voice streaming
    await elevenLabs.streamConversation(userMessage, ws, {
      agentId: 'agent_540Nk85Srebarapn6vd3mhBxH7z', // Your SaintSal agent
    });

    ws.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error('Voice mode error:', error);
    ws.send(JSON.stringify({
      type: "error",
      message: error instanceof Error ? error.message : "Voice processing failed",
    }));
  }
}
