// ElevenLabs Voice Synthesis API + Conversational AI Agent
import WebSocket from 'ws';

export interface ElevenLabsVoiceSettings {
  stability?: number; // 0-1
  similarityBoost?: number; // 0-1
  style?: number; // 0-1
  useSpeakerBoost?: boolean;
}

export interface ElevenLabsOptions {
  voiceId?: string;
  modelId?: string;
  voiceSettings?: ElevenLabsVoiceSettings;
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_192' | 'pcm_16000' | 'pcm_22050' | 'pcm_44100';
}

export interface ConversationalAgentOptions {
  agentId?: string;
  onAudioChunk?: (audioData: string) => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

export class ElevenLabsProvider {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  
  // SaintSal™ Agent Configuration
  private readonly SAINTSAL_AGENT_ID = 'agent_540Nk85Srebarapn6vd3mhBxH7z';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Convert text to speech with ElevenLabs
   * Returns audio buffer
   */
  async textToSpeech(
    text: string,
    options: ElevenLabsOptions = {}
  ): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const {
      voiceId = '21m00Tcm4TlvDq8ikWAM', // Default voice (Rachel)
      modelId = 'eleven_turbo_v2_5',
      voiceSettings = {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.5,
        useSpeakerBoost: true,
      },
      outputFormat = 'mp3_44100_128',
    } = options;

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': `audio/${outputFormat.startsWith('mp3') ? 'mpeg' : 'wav'}`,
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: voiceSettings,
            output_format: outputFormat,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  /**
   * Stream text to speech with WebSocket support
   * Sends audio chunks as base64
   */
  async streamTextToSpeech(
    text: string,
    ws: any, // WebSocket
    options: ElevenLabsOptions = {}
  ): Promise<void> {
    const audioBuffer = await this.textToSpeech(text, options);
    
    // Convert to base64 and send
    const base64Audio = audioBuffer.toString('base64');
    const mimeType = options.outputFormat?.startsWith('mp3') ? 'audio/mpeg' : 'audio/wav';
    
    ws.send(JSON.stringify({
      type: 'audio',
      content: `data:${mimeType};base64,${base64Audio}`,
    }));
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Create Conversational AI WebSocket connection
   * Returns WebSocket URL with signature for secure connection
   */
  async getConversationalAgentUrl(agentId?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const agent = agentId || this.SAINTSAL_AGENT_ID;
    
    // Get signed URL from ElevenLabs API
    try {
      const response = await fetch(
        `${this.baseUrl}/convai/conversation/get_signed_url?agent_id=${agent}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get signed URL: ${response.status}`);
      }

      const data = await response.json();
      return data.signed_url;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      // Fallback: construct WebSocket URL directly
      return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agent}`;
    }
  }

  /**
   * Stream conversation with ElevenLabs Conversational AI agent
   * Real-time voice-to-voice with ultra-realistic SaintSal voice
   */
  async streamConversation(
    text: string,
    clientWs: any, // Client WebSocket
    options: ConversationalAgentOptions = {}
  ): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const agentId = options.agentId || this.SAINTSAL_AGENT_ID;
    
    // Get WebSocket URL (with signature if available)
    const wsUrl = await this.getConversationalAgentUrl(agentId);
    
    // Create WebSocket connection to ElevenLabs
    const elevenLabsWs = new WebSocket(wsUrl, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    elevenLabsWs.on('open', () => {
      console.log('[ElevenLabs] Connected to Conversational AI agent:', agentId);
      
      // Send initial message to agent
      elevenLabsWs.send(JSON.stringify({
        type: 'user_message',
        text: text,
      }));
    });

    elevenLabsWs.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle different message types from ElevenLabs
        switch (message.type) {
          case 'audio':
            // Stream audio chunk to client
            if (message.audio) {
              clientWs.send(JSON.stringify({
                type: 'audio_chunk',
                audio: message.audio, // base64 encoded audio
                mimeType: 'audio/mpeg',
              }));
            }
            break;
          
          case 'message':
            // Agent text response (for display)
            if (message.message) {
              clientWs.send(JSON.stringify({
                type: 'chunk',
                content: message.message,
              }));
            }
            break;
          
          case 'conversation_end':
            // Conversation finished
            clientWs.send(JSON.stringify({
              type: 'audio_end',
            }));
            elevenLabsWs.close();
            break;
          
          default:
            // Forward any other messages
            if (options.onMessage) {
              options.onMessage(message);
            }
        }
      } catch (error) {
        console.error('[ElevenLabs] Error parsing message:', error);
      }
    });

    elevenLabsWs.on('error', (error) => {
      console.error('[ElevenLabs] WebSocket error:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'Voice streaming error',
      }));
      if (options.onError) {
        options.onError(error);
      }
    });

    elevenLabsWs.on('close', () => {
      console.log('[ElevenLabs] Connection closed');
      if (options.onClose) {
        options.onClose();
      }
    });
  }
}

export const elevenLabs = new ElevenLabsProvider();