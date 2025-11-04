import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Send, Plus, StopCircle, Paperclip, Mic, Code2, Image as ImageIcon, Search, Database, Calculator, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, Conversation, Message } from "@shared/schema";
import { format } from "date-fns";

export default function Chat() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth() as {
    user: User | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
  };

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-5");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
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
    mutationFn: async (title: string) => {
      return await apiRequest("POST", "/api/conversations", {
        title,
        model: selectedModel,
      });
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(newConversation.id);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSendMessage = async (messageOverride?: string) => {
    const messageText = messageOverride || input;
    if (!messageText.trim() || isStreaming) return;

    setInput("");

    // Create conversation if none selected
    let conversationId = selectedConversationId;
    if (!conversationId) {
      const newConv = await createConversationMutation.mutateAsync(messageText.slice(0, 50));
      conversationId = newConv.id;
    }

    setIsStreaming(true);
    setStreamingMessage("");

    // Connect to WebSocket for streaming
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "chat",
        conversationId,
        message: messageText,
        model: selectedModel,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chunk") {
        setStreamingMessage((prev) => prev + data.content);
      } else if (data.type === "done") {
        setIsStreaming(false);
        setStreamingMessage("");
        queryClient.invalidateQueries({
          queryKey: ["/api/conversations", conversationId, "messages"],
        });
        ws.close();
      } else if (data.type === "error") {
        toast({
          title: "Error",
          description: data.message || "Failed to send message",
          variant: "destructive",
        });
        setIsStreaming(false);
        setStreamingMessage("");
        ws.close();
      }
    };

    ws.onerror = () => {
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat service",
        variant: "destructive",
      });
      setIsStreaming(false);
      setStreamingMessage("");
    };
  };

  const handleStopGeneration = () => {
    if (wsRef.current) {
      wsRef.current.close();
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    handleSendMessage(suggestion);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const showEmptyState = !selectedConversationId || !messages || messages.length === 0;

  return (
    <div className="flex h-screen bg-background">
      {/* Conversation Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/20">
        <div className="p-4 border-b border-border">
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => {
              setSelectedConversationId(null);
              setInput("");
              setSelectedMode(null);
            }}
            data-testid="button-new-chat"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              className={`w-full text-left p-3 rounded-lg transition-all hover-elevate active-elevate-2 ${
                selectedConversationId === conv.id ? "bg-accent" : ""
              }`}
              data-testid={`button-conversation-${conv.id}`}
            >
              <div className="font-medium truncate text-sm">{conv.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(conv.updatedAt!), "MMM d, h:mm a")}
              </div>
            </button>
          ))}
          {(!conversations || conversations.length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages or Empty State */}
        <div className="flex-1 overflow-y-auto">
          {showEmptyState ? (
            /* Empty State - Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center px-6">
              <div className="max-w-2xl w-full text-center space-y-8">
                {/* Logo/Icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold" data-testid="text-welcome-title">
                    Welcome to SaintSal
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Your divine AI co-founder with Code Agent, Voice, and File Processing
                  </p>
                </div>

                {/* Suggestion Buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleSuggestion("Generate code for a React component")}
                    data-testid="button-suggestion-code"
                  >
                    <Code2 className="h-4 w-4 mr-2" />
                    Generate Code
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleSuggestion("What can you do?")}
                    data-testid="button-suggestion-capabilities"
                  >
                    What can you do?
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleSuggestion("Help me build something amazing")}
                    data-testid="button-suggestion-build"
                  >
                    Help me build something
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Messages View */
            <div className="p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}
                    data-testid={`message-${message.id}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`${message.role === "user" ? "max-w-[80%]" : "flex-1"}`}>
                      <Card
                        className={`p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card"
                        }`}
                      >
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </Card>
                      <div className="text-xs text-muted-foreground mt-1 px-1">
                        {format(new Date(message.createdAt!), "h:mm a")}
                        {message.model && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {message.model}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {message.role === "user" && user && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {user.firstName?.[0] || user.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {/* Streaming Message */}
                {isStreaming && streamingMessage && (
                  <div className="flex gap-4" data-testid="message-streaming">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Card className="p-4 bg-card">
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {streamingMessage}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Typing Indicator */}
                {isStreaming && !streamingMessage && (
                  <div className="flex gap-4" data-testid="indicator-typing">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Mode Toggle Bar */}
        <div className="border-t border-border bg-muted/10">
          <div className="max-w-3xl mx-auto px-6 py-3">
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                variant={selectedMode === "code" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedMode(selectedMode === "code" ? null : "code")}
                data-testid="button-mode-code"
                className="rounded-full"
              >
                <Code2 className="h-4 w-4 mr-2" />
                Code
              </Button>
              <Button
                variant={selectedMode === "image" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedMode(selectedMode === "image" ? null : "image")}
                data-testid="button-mode-image"
                className="rounded-full"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Image
              </Button>
              <Button
                variant={selectedMode === "search" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedMode(selectedMode === "search" ? null : "search")}
                data-testid="button-mode-search"
                className="rounded-full"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                variant={selectedMode === "data" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedMode(selectedMode === "data" ? null : "data")}
                data-testid="button-mode-data"
                className="rounded-full"
              >
                <Database className="h-4 w-4 mr-2" />
                Data
              </Button>
              <Button
                variant={selectedMode === "calculate" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedMode(selectedMode === "calculate" ? null : "calculate")}
                data-testid="button-mode-calculate"
                className="rounded-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </Button>
              <Button
                variant={selectedMode === "create" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedMode(selectedMode === "create" ? null : "create")}
                data-testid="button-mode-create"
                className="rounded-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Message SaintSal... (try '/code' for code generation)"
                  className="min-h-[56px] max-h-[200px] resize-none pr-10"
                  disabled={isStreaming}
                  data-testid="input-message"
                />
                <div className="absolute right-3 bottom-3 flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    data-testid="button-attach"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    data-testid="button-voice"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {isStreaming ? (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={handleStopGeneration}
                  className="flex-shrink-0"
                  data-testid="button-stop"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isStreaming}
                  className="flex-shrink-0"
                  data-testid="button-send"
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              SaintSal can make mistakes. Please verify important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
