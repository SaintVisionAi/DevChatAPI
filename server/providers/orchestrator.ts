// Provider Orchestrator - Routes to appropriate AI provider based on model/mode
import type { WebSocket } from 'ws';
import { gemini } from './gemini';
import { grok } from './grok';
import { elevenLabs } from './elevenlabs';
import { perplexity } from '../perplexity';
import { deepResearch } from './research';
import { codeAgent } from './codeagent';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

interface OrchestratorMessage {
  role: string;
  content: string;
  imageData?: string; // For vision requests
}

interface OrchestratorOptions {
  model: string;
  mode?: 'chat' | 'search' | 'research' | 'code' | 'voice' | 'vision';
  temperature?: number;
  maxTokens?: number;
  voiceSettings?: any; // For ElevenLabs
}

export class AIOrchestrator {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize existing providers
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Route request to appropriate provider based on model/mode
   */
  async processRequest(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    const { model, mode = 'chat' } = options;

    // Handle special modes first
    if (mode === 'search') {
      return this.handleSearch(messages, ws, options);
    }

    if (mode === 'research') {
      return this.handleResearch(messages, ws, options);
    }

    if (mode === 'code') {
      return this.handleCode(messages, ws, options);
    }

    if (mode === 'voice') {
      return this.handleVoice(messages, ws, options);
    }

    if (mode === 'vision' && messages.some(m => m.imageData)) {
      return this.handleVision(messages, ws, options);
    }

    // Route based on model
    if (model.includes('grok')) {
      return this.handleGrok(messages, ws, options);
    }

    if (model.includes('gemini')) {
      return this.handleGemini(messages, ws, options);
    }

    if (model.includes('claude')) {
      return this.handleClaude(messages, ws, options);
    }

    if (model.includes('gpt') || model.includes('o3')) {
      return this.handleOpenAI(messages, ws, options);
    }

    throw new Error(`Unknown model: ${model}`);
  }

  /**
   * Handle web search with Perplexity
   */
  private async handleSearch(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    ws.send(JSON.stringify({
      type: 'status',
      message: '🔍 Searching the web...',
    }));

    const perplexityMessages = messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    const result = await perplexity.search(perplexityMessages, {
      model: 'sonar-pro',
      temperature: 0.2,
      searchRecencyFilter: 'month',
      returnRelatedQuestions: true,
    });

    // Stream the response
    const formatted = perplexity.formatWithCitations(result);
    const chunks = formatted.match(/.{1,50}/g) || [];
    
    for (const chunk of chunks) {
      ws.send(JSON.stringify({ type: 'chunk', content: chunk }));
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    return formatted;
  }

  /**
   * Handle deep research with chain-of-thought reasoning
   */
  private async handleResearch(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    // Get the last user message as the research question
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      throw new Error('No user message found for research');
    }

    // Perform deep research with chain-of-thought
    const result = await deepResearch.performResearch(
      lastUserMessage.content,
      ws,
      {
        model: options.model || 'claude-3-opus-20240229',
        temperature: options.temperature || 0.7,
        maxSteps: 5,
      }
    );

    return result;
  }

  /**
   * Handle code agent requests
   */
  private async handleCode(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    // Get the last user message as the code request
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      throw new Error('No user message found for code request');
    }

    // Extract any code files from the message (if provided)
    // For now, we'll process without files, but this can be enhanced
    // to accept file uploads and multi-file context
    const files: any[] = [];

    // Process with code agent
    const result = await codeAgent.processCodeRequest(
      lastUserMessage.content,
      files,
      ws,
      {
        model: options.model || 'claude-3-sonnet-20240229',
        temperature: options.temperature || 0.3,
        operation: 'analyze', // Default to analysis
      }
    );

    return result;
  }

  /**
   * Handle vision requests with Gemini
   */
  private async handleVision(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    if (!gemini.isAvailable()) {
      throw new Error('Gemini API key required for vision features');
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.imageData) {
      throw new Error('No image data provided for vision request');
    }

    ws.send(JSON.stringify({
      type: 'status',
      message: '🖼️ Analyzing image...',
    }));

    return gemini.processImage(
      lastMessage.imageData,
      lastMessage.content,
      ws,
      {
        model: 'gemini-2.0-flash-exp',
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2048,
      }
    );
  }

  /**
   * Handle voice requests with ElevenLabs
   */
  private async handleVoice(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    if (!elevenLabs.isAvailable()) {
      throw new Error('ElevenLabs API key required for voice features');
    }

    const lastMessage = messages[messages.length - 1];
    
    ws.send(JSON.stringify({
      type: 'status',
      message: '🎤 Processing voice...',
    }));

    // First get text response from AI model
    let textResponse = '';
    const model = options.model || 'gpt-4o-mini';
    
    if (model.includes('claude')) {
      textResponse = await this.handleClaude(messages, ws, options);
    } else if (model.includes('gemini')) {
      textResponse = await this.handleGemini(messages, ws, options);
    } else {
      textResponse = await this.handleOpenAI(messages, ws, options);
    }

    // Then convert to speech
    ws.send(JSON.stringify({
      type: 'status',
      message: '🔊 Generating speech...',
    }));

    const audioBuffer = await elevenLabs.textToSpeech(textResponse, {
      voice: options.voiceSettings?.voice || 'nova',
      model: 'eleven_turbo_v2',
      voiceSettings: {
        stability: options.voiceSettings?.stability || 0.75,
        similarityBoost: options.voiceSettings?.similarityBoost || 0.75,
      },
    });

    // Send audio data back to client
    ws.send(JSON.stringify({
      type: 'audio',
      data: audioBuffer.toString('base64'),
      text: textResponse,
    }));

    return textResponse;
  }

  /**
   * Handle Grok requests
   */
  private async handleGrok(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    if (!grok.isAvailable()) {
      throw new Error('Grok API key not configured');
    }

    return grok.streamChat(
      messages as any,
      ws,
      {
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      }
    );
  }

  /**
   * Handle Gemini requests
   */
  private async handleGemini(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    if (!gemini.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    return gemini.streamChat(messages, ws, {
      model: options.model,
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
    });
  }

  /**
   * Handle Claude requests
   */
  private async handleClaude(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    const stream = await this.anthropic.messages.stream({
      model: options.model === 'claude-opus-4-1' ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      messages: messages as any,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullResponse += text;
        ws.send(JSON.stringify({ type: 'chunk', content: text }));
      }
    }

    return fullResponse;
  }

  /**
   * Handle OpenAI requests
   */
  private async handleOpenAI(
    messages: OrchestratorMessage[],
    ws: WebSocket,
    options: OrchestratorOptions
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const stream = await this.openai.chat.completions.create({
      model: options.model === 'gpt-5' ? 'gpt-4-turbo-preview' : options.model,
      messages: messages as any,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        ws.send(JSON.stringify({ type: 'chunk', content }));
      }
    }

    return fullResponse;
  }

  /**
   * Synthesize speech with ElevenLabs
   */
  async synthesizeSpeech(
    text: string,
    ws: WebSocket,
    options?: any
  ): Promise<void> {
    if (!elevenLabs.isAvailable()) {
      throw new Error('ElevenLabs API key not configured');
    }

    await elevenLabs.streamTextToSpeech(text, ws, options);
  }

  /**
   * Get available providers status
   */
  getProvidersStatus(): Record<string, boolean> {
    return {
      anthropic: !!this.anthropic,
      openai: !!this.openai,
      gemini: gemini.isAvailable(),
      grok: grok.isAvailable(),
      perplexity: true, // Already checked in perplexity.ts
      elevenLabs: elevenLabs.isAvailable(),
    };
  }
}

export const orchestrator = new AIOrchestrator();