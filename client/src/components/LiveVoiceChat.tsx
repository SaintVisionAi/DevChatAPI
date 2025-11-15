import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

interface LiveVoiceChatProps {
  conversationId: string | null;
  onTranscript: (text: string) => void;
  isStreaming: boolean;
  streamingMessage: string;
  selectedModel: string;
  onCreateConversation: () => Promise<void>;
}

export function LiveVoiceChat({
  conversationId,
  onTranscript,
  isStreaming,
  streamingMessage,
  selectedModel,
  onCreateConversation,
}: LiveVoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastStreamingMessageRef = useRef<string>('');
  const hasSpokenRef = useRef<Set<string>>(new Set());
  const conversationInitializedRef = useRef(false);

  const {
    isListening: voiceIsListening,
    transcript: liveTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useVoiceRecognition({
    continuous: true,
    interimResults: true,
    onTranscript: (text, isFinal) => {
      console.log('[LiveVoice] 🎤 Transcript:', text, '| Final:', isFinal, '| Length:', text.length);
      
      // Always show current transcript
      setCurrentTranscript(text);

      // Clear existing silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Start timer on ANY speech (interim or final) to detect when user stops
      if (text.trim().length > 0) {
        console.log('[LiveVoice] ⏱️ Speech detected, starting 1.5s silence timer');
        silenceTimerRef.current = setTimeout(() => {
          console.log('[LiveVoice] ✅ 1.5s silence detected, SENDING:', text);
          
          // Only send if there's actual content
          if (text.trim().length > 0) {
            onTranscript(text);
            setCurrentTranscript('');
            resetTranscript();
            
            // Restart listening after a brief pause
            setTimeout(() => {
              if (isListening) {
                console.log('[LiveVoice] 🔄 Restarting listening...');
                stopListening();
                setTimeout(() => startListening(), 200);
              }
            }, 500);
          }
        }, 1500); // Reduced to 1.5 seconds for faster response
      }
    },
  });

  // Initialize conversation on mount if needed
  useEffect(() => {
    const initConversation = async () => {
      if (!conversationId && !conversationInitializedRef.current) {
        conversationInitializedRef.current = true;
        console.log('[LiveVoice] 🆕 Creating conversation...');
        await onCreateConversation();
      }
    };
    initConversation();
  }, [conversationId, onCreateConversation]);

  // Auto-restart listening after AI finishes speaking
  useEffect(() => {
    if (isListening && !isStreaming && !currentTranscript) {
      // If we're supposed to be listening but recognition stopped, restart it
      const checkAndRestart = setTimeout(() => {
        if (!voiceIsListening && isListening) {
          console.log('[LiveVoice] 🔄 Auto-restarting voice recognition...');
          startListening();
        }
      }, 1000);

      return () => clearTimeout(checkAndRestart);
    }
  }, [isListening, isStreaming, currentTranscript, voiceIsListening, startListening]);

  // Start/stop listening OR send current transcript
  const toggleListening = async () => {
    if (isListening) {
      // If user has spoken something, send it immediately
      if (currentTranscript.trim()) {
        console.log('[LiveVoice] 📤 Manual send triggered:', currentTranscript);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        onTranscript(currentTranscript);
        setCurrentTranscript('');
        resetTranscript();
        
        // Restart listening after brief pause
        setTimeout(() => {
          console.log('[LiveVoice] 🔄 Restarting listening after manual send...');
          stopListening();
          setTimeout(() => startListening(), 200);
        }, 500);
      } else {
        // No transcript, just stop listening
        console.log('[LiveVoice] 🛑 Stopping listening (no transcript)');
        stopListening();
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        setIsListening(false);
      }
    } else {
      console.log('[LiveVoice] ▶️ Starting listening');
      if (!isSupported) {
        alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
      }
      
      // Request microphone permission first
      try {
        console.log('[LiveVoice] Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[LiveVoice] ✅ Microphone permission granted');
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      } catch (error) {
        console.error('[LiveVoice] ❌ Microphone permission denied:', error);
        alert('Microphone permission is required for voice chat. Please allow microphone access and try again.');
        return;
      }
      
      startListening();
      setIsListening(true);
    }
  };

  // Handle AI response with ElevenLabs TTS ONLY
  useEffect(() => {
    const speakResponse = async () => {
      console.log('[LiveVoice] TTS Effect - streamingMessage:', streamingMessage, 'isStreaming:', isStreaming);
      
      // Only process when streaming is complete
      if (isStreaming) {
        console.log('[LiveVoice] Still streaming, waiting...');
        return;
      }

      // Only process new messages
      if (!streamingMessage || streamingMessage === lastStreamingMessageRef.current) {
        console.log('[LiveVoice] No new message to speak');
        return;
      }

      console.log('[LiveVoice] ✅ New AI response received, speaking with ElevenLabs:', streamingMessage);
      lastStreamingMessageRef.current = streamingMessage;

      try {
        // Stop any previous audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }

        // Use ElevenLabs API - speak the ENTIRE response at once
        console.log('[LiveVoice] Calling ElevenLabs TTS API...');
        const response = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: streamingMessage,
          }),
        });

        console.log('[LiveVoice] ElevenLabs API Response:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[LiveVoice] ❌ ElevenLabs API Error:', response.status, errorText);
          alert(`Voice synthesis failed: ${errorText}. Please check ElevenLabs API key.`);
          return;
        }

        const audioBlob = await response.blob();
        console.log('[LiveVoice] ✅ Audio blob received, size:', audioBlob.size, 'bytes');
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onloadeddata = () => {
          console.log('[LiveVoice] ✅ Audio loaded, duration:', audio.duration, 'seconds');
        };
        
        audio.onplay = () => {
          console.log('[LiveVoice] ▶️ Audio playback started');
        };
        
        audio.onerror = (e) => {
          console.error('[LiveVoice] ❌ Audio playback error:', e);
          alert('Failed to play audio. Check console for details.');
        };
        
        audio.onended = () => {
          console.log('[LiveVoice] ✅ Audio playback completed');
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
        console.log('[LiveVoice] ✅ Audio play() called successfully');
        
      } catch (error) {
        console.error('[LiveVoice] ❌ Fatal TTS error:', error);
        alert('Voice synthesis failed. Check console and verify ElevenLabs API key.');
      }
    };

    speakResponse();
  }, [streamingMessage, isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopListening();
    };
  }, [stopListening]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 space-y-8">
      {/* Main orb/circle - ChatGPT style */}
      <div className="relative">
        {/* Animated rings when listening or speaking */}
        {(isListening || isStreaming) && (
          <>
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" style={{ animationDelay: '150ms' }} />
          </>
        )}
        
        {/* Main button */}
        <button
          onClick={toggleListening}
          disabled={isStreaming}
          className={cn(
            "relative w-32 h-32 sm:w-40 sm:h-40 rounded-full transition-all duration-300",
            "flex items-center justify-center",
            "shadow-2xl hover:shadow-primary/50",
            isListening 
              ? "bg-primary text-primary-foreground scale-110" 
              : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:scale-105",
            isStreaming && "opacity-50 cursor-not-allowed"
          )}
        >
          {isStreaming ? (
            <Loader2 className="h-16 w-16 sm:h-20 sm:w-20 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-16 w-16 sm:h-20 sm:w-20" />
          ) : (
            <Mic className="h-16 w-16 sm:h-20 sm:w-20" />
          )}
        </button>
      </div>

      {/* Status text */}
      <div className="text-center space-y-2 max-w-2xl">
        <p className={cn(
          "text-lg sm:text-xl font-medium transition-all",
          isListening ? "text-primary animate-pulse" : "text-muted-foreground"
        )}>
          {isStreaming 
            ? "AI is speaking..." 
            : isListening && currentTranscript
              ? "Tap to send or wait 1.5s"
              : isListening 
                ? "Listening..." 
                : "Tap to talk"}
        </p>
        
        {/* Live transcript - ONLY show what user is saying */}
        {currentTranscript && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/30">
            <p className="text-sm text-primary mb-1">You're saying:</p>
            <p className="text-base font-medium">{currentTranscript}</p>
          </div>
        )}

        {/* AI is responding indicator - NO TEXT shown */}
        {isStreaming && (
          <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/30">
            <p className="text-sm text-accent flex items-center gap-2 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI is thinking...
            </p>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center max-w-md">
        Speak naturally. Pause for 1.5 seconds to send. AI responds with voice only.
      </p>

      {/* Debug info */}
      <div className="text-xs text-muted-foreground/50 text-center space-y-1 border-t border-border/30 pt-4 mt-4">
        <p>Conversation ID: {conversationId || 'Creating...'}</p>
        <p>Voice Supported: {isSupported ? '✓' : '✗'}</p>
        <p>Listening: {isListening ? '✓' : '✗'} | Streaming: {isStreaming ? '✓' : '✗'}</p>
      </div>
    </div>
  );
}
