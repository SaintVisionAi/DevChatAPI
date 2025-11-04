// Web Speech API hook for voice recognition (walkie-talkie style)
import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
  const {
    continuous = false,
    interimResults = true,
    lang = 'en-US',
    onTranscript,
    onError,
  } = options;

  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    isSupported: typeof window !== 'undefined' && 
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (!state.isSupported) {
      console.warn('Speech Recognition API not supported');
      return;
    }

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;

      setState(prev => ({
        ...prev,
        transcript: finalTranscript.trim(),
        interimTranscript: interimTranscript.trim(),
      }));

      // Callback with transcript
      if (onTranscript) {
        const isFinal = event.results[event.results.length - 1].isFinal;
        onTranscript(finalTranscript.trim() || interimTranscript.trim(), isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      const errorMsg = `Speech recognition error: ${event.error}`;
      console.error(errorMsg);
      setState(prev => ({ ...prev, error: errorMsg, isListening: false }));
      if (onError) onError(errorMsg);
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, interimResults, lang, onTranscript, onError, state.isSupported]);

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      const errorMsg = 'Speech recognition not supported in this browser';
      setState(prev => ({ ...prev, error: errorMsg }));
      if (onError) onError(errorMsg);
      return;
    }

    if (recognitionRef.current && !state.isListening) {
      finalTranscriptRef.current = '';
      setState(prev => ({ ...prev, transcript: '', interimTranscript: '', error: null }));
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  }, [state.isSupported, state.isListening, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setState(prev => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}
