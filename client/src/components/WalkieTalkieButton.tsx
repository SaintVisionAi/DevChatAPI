// Premium walkie-talkie style voice button with push-to-talk
import { useState, useCallback, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

interface WalkieTalkieButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function WalkieTalkieButton({ 
  onTranscript, 
  disabled = false,
  className = '' 
}: WalkieTalkieButtonProps) {
  const [isPressing, setIsPressing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const hasSentRef = useRef(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    continuous: true,
    interimResults: true,
    onTranscript: (text, isFinal) => {
      console.log('[Voice] Transcript update:', text, 'isFinal:', isFinal);
      latestTranscriptRef.current = text;
      
      if (isFinal && text) {
        setShowTranscript(true);
        
        // Clear existing timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        // Set new timer for 3 seconds of silence
        silenceTimerRef.current = setTimeout(() => {
          console.log('[Voice] 3 seconds of silence, auto-sending:', text);
          if (text && !hasSentRef.current) {
            hasSentRef.current = true;
            stopListening();
            onTranscript(text);
            resetTranscript();
            setShowTranscript(false);
            setIsPressing(false);
          }
        }, 3000);
      }
    },
  });

  // Handle press start
  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default only for mouse events, not touch (to avoid passive listener warning)
    if (e.type === 'mousedown') {
      e.preventDefault();
    }
    if (disabled || !isSupported) return;
    
    console.log('[Voice] Starting listening...');
    setIsPressing(true);
    setShowTranscript(false);
    hasSentRef.current = false;
    latestTranscriptRef.current = '';
    resetTranscript();
    startListening();
  }, [disabled, isSupported, startListening, resetTranscript]);

  // Handle press end
  const handlePressEnd = useCallback(() => {
    if (!isPressing) return;
    
    console.log('[Voice] Button released');
    setIsPressing(false);
    stopListening();
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Send transcript immediately when button is released
    setTimeout(() => {
      const finalText = latestTranscriptRef.current;
      console.log('[Voice] Sending on release:', finalText);
      if (finalText && !hasSentRef.current) {
        hasSentRef.current = true;
        onTranscript(finalText);
        resetTranscript();
      }
      setShowTranscript(false);
      latestTranscriptRef.current = '';
    }, 500);
  }, [isPressing, stopListening, onTranscript, resetTranscript]);

  // Global listeners for mouse/touch release
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPressing) {
        handlePressEnd();
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isPressing) {
        handlePressEnd();
      }
    };

    if (isPressing) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalTouchEnd);
      document.addEventListener('touchcancel', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [isPressing, handlePressEnd]);

  // Cleanup silence timer on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <Button
        size="icon"
        variant="ghost"
        disabled
        className={className}
        data-testid="button-voice-unsupported"
      >
        <MicOff className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  return (
    <div className="relative">
      {/* Walkie-Talkie Button - CLEAN MOBILE GLASS */}
      <Button
        size="icon"
        variant={isPressing ? "default" : "ghost"}
        onMouseDown={handlePressStart}
        onTouchStart={handlePressStart}
        disabled={disabled}
        className={`
          ${className}
          ${isPressing ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/50' : 'bg-background/50 backdrop-blur-sm border border-border/30'}
          transition-all duration-200
          select-none touch-none
          rounded-full
        `}
        data-testid="button-voice-walkie-talkie"
      >
        <Mic className={`h-5 w-5 ${isPressing ? 'animate-pulse' : ''}`} />
      </Button>

      {/* Live Transcript Display - GLASS EFFECT */}
      {(isListening || showTranscript) && (
        <div 
          className="absolute bottom-full mb-2 right-0 min-w-[200px] max-w-[300px]"
          data-testid="voice-transcript-display"
        >
          <div className="bg-background/90 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-xl">
            {isListening && (
              <Badge variant="default" className="mb-2 text-xs">
                🎙️ Listening...
              </Badge>
            )}
            
            <div className="text-sm space-y-1">
              {transcript && (
                <div className="text-foreground font-medium" data-testid="voice-transcript-final">
                  {transcript}
                </div>
              )}
              {interimTranscript && (
                <div className="text-muted-foreground italic" data-testid="voice-transcript-interim">
                  {interimTranscript}
                </div>
              )}
            </div>

            {error && (
              <div className="text-xs text-destructive mt-2" data-testid="voice-error">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions tooltip (shown when not pressing) */}
      {!isPressing && !isListening && (
        <div className="absolute bottom-full mb-1 right-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            Hold to talk 🎙️
          </Badge>
        </div>
      )}
    </div>
  );
}
