// Gemini Vision API integration
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { WebSocket } from 'ws';

interface GeminiVisionOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiProvider {
  private client: GoogleGenerativeAI | null = null;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Process image with Gemini Vision API
   */
  async processImage(
    imageData: string, // base64 or URL
    prompt: string,
    ws: WebSocket,
    options: GeminiVisionOptions = {}
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key not configured');
    }

    const {
      model = 'gemini-2.0-flash-exp',
      temperature = 0.7,
      maxOutputTokens = 2048,
    } = options;

    try {
      // Get the model
      const genModel = this.client.getGenerativeModel({ 
        model,
        generationConfig: {
          temperature,
          maxOutputTokens,
        }
      });

      // Process image
      let imagePart;
      if (imageData.startsWith('data:')) {
        // Base64 image
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
        imagePart = {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        };
      } else {
        // URL - fetch and convert to base64
        const response = await fetch(imageData);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        imagePart = {
          inlineData: {
            data: base64,
            mimeType: response.headers.get('content-type') || 'image/jpeg',
          },
        };
      }

      // Stream the response
      const result = await genModel.generateContentStream([prompt, imagePart]);
      
      let fullResponse = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        
        // Send chunks to WebSocket
        ws.send(JSON.stringify({
          type: 'chunk',
          content: chunkText,
        }));
      }

      return fullResponse;
    } catch (error) {
      console.error('Gemini Vision error:', error);
      throw error;
    }
  }

  /**
   * Stream chat response with Gemini
   */
  async streamChat(
    messages: Array<{ role: string; content: string }>,
    ws: WebSocket,
    options: GeminiVisionOptions = {}
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key not configured');
    }

    const {
      model = 'gemini-2.0-flash-exp',
      temperature = 0.7,
      maxOutputTokens = 4096,
    } = options;

    try {
      const genModel = this.client.getGenerativeModel({ 
        model,
        generationConfig: {
          temperature,
          maxOutputTokens,
        }
      });

      // Convert messages to Gemini format
      const chat = genModel.startChat({
        history: messages.slice(0, -1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      });

      // Stream the response
      const result = await chat.sendMessageStream(messages[messages.length - 1].content);
      
      let fullResponse = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        
        // Send chunks to WebSocket
        ws.send(JSON.stringify({
          type: 'chunk',
          content: chunkText,
        }));
      }

      return fullResponse;
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }
}

export const gemini = new GeminiProvider();