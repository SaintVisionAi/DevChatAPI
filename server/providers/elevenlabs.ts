// ElevenLabs Voice Synthesis API
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

export class ElevenLabsProvider {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

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
}

export const elevenLabs = new ElevenLabsProvider();