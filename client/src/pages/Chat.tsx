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
import { Send, Plus, StopCircle, Loader2, Sparkles } from "lucide-react";
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

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const messageText = input;
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

  return (
    <div className="flex h-screen">
      {/* Conversation Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/30">
        <div className="p-4 border-b border-border">
          <Button
            className="w-full"
            onClick={() => {
              setSelectedConversationId(null);
              setInput("");
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
              className={`w-full text-left p-3 rounded-lg hover-elevate active-elevate-2 ${
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="font-semibold" data-testid="text-chat-title">AI Chat</h1>
          </div>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48" data-testid="select-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet-4-5" data-testid="option-claude-sonnet">Claude Sonnet 4.5</SelectItem>
              <SelectItem value="claude-opus-4-1" data-testid="option-claude-opus">Claude Opus 4.1</SelectItem>
              <SelectItem value="gpt-5" data-testid="option-gpt-5">GPT-5</SelectItem>
              <SelectItem value="gpt-4.1" data-testid="option-gpt-4">GPT-4.1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
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
                    <div className="prose prose-sm dark:prose-invert max-w-none">
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
                    <div className="prose prose-sm dark:prose-invert max-w-none">
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

        {/* Input Area */}
        <div className="border-t border-border p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="min-h-[56px] max-h-[200px] resize-none"
                disabled={isStreaming}
                data-testid="input-message"
              />
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
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="flex-shrink-0"
                  data-testid="button-send"
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
