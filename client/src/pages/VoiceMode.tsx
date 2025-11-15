import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  Trash2,
  Waves,
  MessageSquare,
  Wand2,
  Search,
  Code2,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, Conversation, Message } from "@shared/schema";
import { format } from "date-fns";
import { WalkieTalkieButton } from "@/components/WalkieTalkieButton";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export default function VoiceMode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
  } = useAuth() as {
    user: User | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
  };

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("grok-2-latest");
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
  } = useTextToSpeech({
    rate: 1.1,
    pitch: 1.0,
    volume: 1.0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please login to continue...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: "Voice Conversation",
        mode: "voice",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(data.id);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(null);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  // Auto-create first conversation
  useEffect(() => {
    if (isAuthenticated && conversations && conversations.length === 0) {
      createConversationMutation.mutate();
    } else if (conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [isAuthenticated, conversations, selectedConversationId]);

  // WebSocket management
  useEffect(() => {
    if (!isAuthenticated || !selectedConversationId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Voice] WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "delta") {
          setStreamingMessage((prev) => prev + data.content);
        } else if (data.type === "done") {
          setIsStreaming(false);
          queryClient.invalidateQueries({
            queryKey: ["/api/conversations", selectedConversationId, "messages"],
          });
          
          if (autoSpeak && streamingMessage) {
            speak(streamingMessage);
          }
          
          setStreamingMessage("");
        } else if (data.type === "error") {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          setIsStreaming(false);
          setStreamingMessage("");
        }
      } catch (error) {
        console.error("[Voice] WebSocket message parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[Voice] WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Voice connection failed",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      console.log("[Voice] WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated, selectedConversationId, queryClient, toast, autoSpeak, speak, streamingMessage]);

  const handleVoiceInput = async (transcript: string) => {
    if (!selectedConversationId || !wsRef.current || !transcript.trim()) return;

    setIsStreaming(true);
    setStreamingMessage("");

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        conversationId: selectedConversationId,
        content: transcript,
        mode: "voice",
        model: selectedModel,
      })
    );
  };

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Voice Mode</h1>
              <p className="text-xs text-muted-foreground">
                Talk naturally with AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[140px]" data-testid="select-voice-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grok-2-latest">Grok 2</SelectItem>
                <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAutoSpeak(!autoSpeak)}
              data-testid="button-toggle-autospeak"
            >
              {autoSpeak ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleNewConversation}
              disabled={createConversationMutation.isPending}
              data-testid="button-new-voice-conversation"
            >
              New Chat
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Mode Switcher */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm px-3 sm:px-6 py-2">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <Link href="/chat">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 hover-elevate active-elevate-2"
              data-testid="link-chat-mode"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Chat
            </Button>
          </Link>
          <Link href="/voice">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 hover-elevate active-elevate-2 bg-primary/10 text-primary"
              data-testid="link-voice-mode"
            >
              <Mic className="h-4 w-4 mr-1.5" />
              Voice
            </Button>
          </Link>
          <Link href="/images">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 hover-elevate active-elevate-2"
              data-testid="link-images-mode"
            >
              <Wand2 className="h-4 w-4 mr-1.5" />
              Images
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="shrink-0 opacity-50"
            data-testid="button-search-mode-soon"
          >
            <Search className="h-4 w-4 mr-1.5" />
            Search
            <Badge variant="outline" className="ml-1.5 text-xs">Soon</Badge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="shrink-0 opacity-50"
            data-testid="button-code-mode-soon"
          >
            <Code2 className="h-4 w-4 mr-1.5" />
            Code
            <Badge variant="outline" className="ml-1.5 text-xs">Soon</Badge>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages?.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  SS
                </AvatarFallback>
              </Avatar>
            )}

            <Card
              className={`max-w-[80%] p-4 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : ""
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div
                className={`text-xs mt-2 ${
                  message.role === "user"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {format(new Date(message.createdAt), "h:mm a")}
              </div>
            </Card>

            {message.role === "user" && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {streamingMessage && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                SS
              </AvatarFallback>
            </Avatar>
            <Card className="max-w-[80%] p-4">
              <div className="text-sm whitespace-pre-wrap">{streamingMessage}</div>
              <Badge variant="outline" className="mt-2 text-xs">
                <Waves className="h-3 w-3 mr-1 animate-pulse" />
                Speaking...
              </Badge>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                {isStreaming ? "AI is responding..." : "Hold to speak"}
              </p>
              <WalkieTalkieButton
                onTranscript={handleVoiceInput}
                disabled={isStreaming}
                className="h-16 w-16"
              />
            </div>
          </div>

          {selectedConversationId && (
            <div className="flex justify-center mt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteConversationMutation.mutate(selectedConversationId)}
                disabled={deleteConversationMutation.isPending}
                data-testid="button-delete-conversation"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
