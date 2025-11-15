// Grok AI API integration (X.AI)
import type { WebSocket } from 'ws';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class GrokProvider {
  private apiKey: string;
  private baseUrl = 'https://api.x.ai/v1';

  constructor() {
    this.apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Stream chat response with Grok
   */
  async streamChat(
    messages: GrokMessage[],
    ws: WebSocket,
    options: GrokOptions = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Grok API key not configured');
    }

    const {
      model = 'grok-2-latest',
      temperature = 0.7,
      maxTokens = 4096,
      stream = true,
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Grok API error: ${response.status} - ${error}`);
      }

      if (!stream) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        ws.send(JSON.stringify({ type: 'chunk', content }));
        return content;
      }

      // Handle streaming response with newline-aware buffering
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = ''; // Buffer for incomplete lines

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append to buffer and process complete lines
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              ws.send(JSON.stringify({
                type: 'chunk',
                content,
              }));
            }
          } catch (e) {
            // Log but continue on JSON parse errors
            console.error('Grok JSON parse error:', e, 'Data:', data);
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Grok chat error:', error);
      throw error;
    }
  }
}

export const grok = new GrokProvider();