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
import { 
  Send, 
  Plus, 
  StopCircle, 
  Paperclip, 
  Code2, 
  Image as ImageIcon, 
  Search, 
  Database, 
  Calculator, 
  Sparkles, 
  Volume2, 
  VolumeX,
  MessageSquare 
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, Conversation, Message } from "@shared/schema";
import { format } from "date-fns";
import { ModeSelector } from "@/components/ModeSelector";
import { WalkieTalkieButton } from "@/components/WalkieTalkieButton";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { 
  SidebarProvider, 
  SidebarTrigger,
  SidebarInset,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

type ChatMode = 'chat' | 'search' | 'research' | 'code' | 'voice';

export default function ChatRedesigned() {
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
  const [selectedMode, setSelectedMode] = useState<ChatMode>('chat');
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  const { speak, cancel: cancelSpeech, isSpeaking } = useTextToSpeech({
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
    mutationFn: async (title: string): Promise<Conversation> => {
      const response = await apiRequest("POST", "/api/conversations", {
        title,
        model: selectedModel,
      });
      return await response.json();
    },
    onSuccess: (newConversation: Conversation) => {
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

    let conversationId = selectedConversationId;
    if (!conversationId) {
      const newConv = await createConversationMutation.mutateAsync(messageText.slice(0, 50));
      conversationId = newConv.id;
    }

    setIsStreaming(true);
    setStreamingMessage("");

    const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "chat",
        conversationId,
        message: messageText,
        model: selectedModel,
        mode: selectedMode,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chunk") {
        setStreamingMessage((prev) => prev + data.content);
      } else if (data.type === "done") {
        if (autoSpeak && streamingMessage) {
          speak(streamingMessage);
        }
        
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
    cancelSpeech();
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (!transcript.trim()) return;
    setInput(transcript);
    setTimeout(() => handleSendMessage(transcript), 100);
  };

  const handleNewChat = () => {
    setSelectedConversationId(null);
    setInput("");
    setSelectedMode('chat');
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

  // Custom sidebar width for chat
  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {/* Left Sidebar - Conversations */}
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="p-4">
            {/* SaintSal Logo */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-lg">SS</span>
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="font-bold text-base text-primary">SaintSal</div>
                <div className="text-xs text-muted-foreground">Your Gotta Guy™</div>
              </div>
            </div>
            
            {/* New Chat Button */}
            <Button
              onClick={handleNewChat}
              className="w-full bg-primary hover:bg-primary/90 group-data-[collapsible=icon]:p-2"
              data-testid="button-new-chat"
            >
              <Plus className="w-4 h-4 group-data-[collapsible=icon]:m-0 group-data-[state=expanded]:mr-2" />
              <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
            </Button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                Conversations
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {!conversations || conversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                      No conversations yet
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <SidebarMenuItem key={conv.id}>
                        <SidebarMenuButton
                          isActive={selectedConversationId === conv.id}
                          onClick={() => setSelectedConversationId(conv.id)}
                          className="group"
                          data-testid={`conversation-${conv.id}`}
                        >
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                            <p className="text-sm font-medium truncate">
                              {conv.title}
                            </p>
                            {conv.updatedAt && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(conv.updatedAt), "MMM d")}
                              </p>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col">
          {/* Header with Sidebar Trigger */}
          <header className="flex items-center gap-4 h-16 px-6 border-b border-border">
            <SidebarTrigger className="-ml-1" data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            {/* Model Selector */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-sonnet-4-5">Claude Sonnet 4.5</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-5">GPT-5</SelectItem>
              </SelectContent>
            </Select>
            {/* Auto-speak Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={autoSpeak ? "text-primary" : "text-muted-foreground"}
              data-testid="button-auto-speak"
            >
              {autoSpeak ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {showEmptyState ? (
              /* Empty State */
              <div className="h-full flex flex-col items-center justify-center px-6">
                <div className="max-w-2xl w-full text-center space-y-8">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-4xl font-bold" data-testid="text-welcome-title">
                      Cookin' Knowledge
                    </h1>
                    <p className="text-lg text-accent font-medium">
                      Your Gotta Guy™
                    </p>
                    <p className="text-base text-muted-foreground">
                      AI Chat • Web Search • Voice • Code Agent • Deep Research • Everything
                    </p>
                  </div>

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
                      data-testid="button-suggestion-help"
                    >
                      What can you do?
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => handleSuggestion("Help me build something")}
                      data-testid="button-suggestion-build"
                    >
                      Help me build something
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {messages?.map((message) => (
                  <div key={message.id} className="flex gap-4">
                    {message.role === "user" ? (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || user?.email || "User"} />
                          <AvatarFallback>
                            {user?.firstName?.[0] || user?.email?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Card className="p-4 bg-accent/10">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </Card>
                          <div className="text-xs text-muted-foreground mt-1 px-1">
                            {format(new Date(message.createdAt!), "h:mm a")}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Card className="p-4">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </Card>
                          <div className="text-xs text-muted-foreground mt-1 px-1 flex items-center gap-2">
                            {format(new Date(message.createdAt!), "h:mm a")}
                            {message.model && (
                              <Badge variant="outline" className="text-xs">
                                {message.model}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {isStreaming && streamingMessage && (
                  <div className="flex gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Card className="p-4">
                        <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                      </Card>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Mode Selector */}
          <div className="border-t border-border bg-muted/10">
            <div className="max-w-3xl mx-auto px-6 py-4">
              <ModeSelector
                currentMode={selectedMode}
                onModeChange={setSelectedMode}
                disabled={isStreaming}
              />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-background">
            <div className="max-w-3xl mx-auto px-6 py-4">
              <div className="flex gap-2">
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
                    placeholder={
                      selectedMode === 'chat' ? "Message Your Gotta Guy™..." :
                      selectedMode === 'search' ? "Search the web... (Perplexity with citations)" :
                      selectedMode === 'research' ? "Deep research question..." :
                      selectedMode === 'code' ? "Describe your code needs..." :
                      selectedMode === 'voice' ? "Click mic or type..." :
                      "Message..."
                    }
                    className="min-h-[60px] pr-20 resize-none"
                    disabled={isStreaming}
                    data-testid="input-message"
                  />
                  {/* Attachment Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    disabled
                    data-testid="button-attach"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>

                {/* Walkie-Talkie Button */}
                <WalkieTalkieButton
                  onTranscript={handleVoiceTranscript}
                  className="h-[60px]"
                />

                {/* Send/Stop Button */}
                {isStreaming ? (
                  <Button
                    onClick={handleStopGeneration}
                    className="h-[60px]"
                    variant="destructive"
                    data-testid="button-stop"
                  >
                    <StopCircle className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSendMessage()}
                    className="h-[60px]"
                    disabled={!input.trim()}
                    data-testid="button-send"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}