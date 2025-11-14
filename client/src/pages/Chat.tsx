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
  Loader2,
  Paperclip, 
  Code2, 
  Image as ImageIcon, 
  Search, 
  Database, 
  Calculator, 
  Sparkles, 
  Volume2, 
  VolumeX,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Mic,
  Menu,
  X,
  Trash2,
  MoreVertical,
  Home,
  ArrowLeft
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, Conversation, Message } from "@shared/schema";
import { format } from "date-fns";
import { ModeSelector } from "@/components/ModeSelector";
import { WalkieTalkieButton } from "@/components/WalkieTalkieButton";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type ChatMode = 'chat' | 'search' | 'research' | 'code' | 'voice';

export default function ChatFixed() {
  const [, setLocation] = useLocation();
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
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [selectedMode, setSelectedMode] = useState<ChatMode>('chat');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { speak, cancel: cancelSpeech, isSpeaking } = useTextToSpeech({
    rate: 1.1,
    pitch: 1.0,
    volume: 1.0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedConversationId === deleteConversationMutation.variables) {
        setSelectedConversationId(null);
      }
      toast({
        title: "Deleted",
        description: "Conversation deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete conversation",
        variant: "destructive",
      });
    },
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
          description: "Please login to continue...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
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

    // Construct WebSocket URL correctly using origin
    const wsUrl = new URL('/ws', window.location.origin);
    wsUrl.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    console.log('[Chat] Connecting to WebSocket:', wsUrl.href);
    
    const ws = new WebSocket(wsUrl.href);
    wsRef.current = ws;

    ws.onopen = () => {
      // Wait for server connection confirmation before sending
    };

    let fullMessage = "";
    let messageSent = false;
    
    const sendChatMessage = () => {
      if (messageSent) return;
      messageSent = true;
      
      try {
        const payload = JSON.stringify({
          type: "chat",
          conversationId,
          message: messageText,
          model: selectedModel,
          mode: selectedMode,
          imageData: selectedImage,
        });
        ws.send(payload);
      } catch (error) {
        console.error('Failed to send message:', error);
        messageSent = false;
      }
      
      setSelectedImage(null);
    };
    
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "connected") {
        // Connection confirmed, now send the message
        setTimeout(sendChatMessage, 50);
      } else if (data.type === "chunk") {
        setStreamingMessage((prev) => prev + data.content);
        fullMessage += data.content;
      } else if (data.type === "done") {
        // Auto-speak in voice mode OR if auto-speak is enabled
        if ((selectedMode === 'voice' || autoSpeak) && fullMessage) {
          // Use ElevenLabs TTS for high-quality voice
          try {
            const response = await fetch('/api/voice/tts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ text: fullMessage }),
            });
            
            if (response.ok) {
              const audioBlob = await response.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              await audio.play();
            } else {
              // Fallback to browser TTS
              speak(fullMessage);
            }
          } catch (error) {
            console.error('TTS error:', error);
            // Fallback to browser TTS
            speak(fullMessage);
          }
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
    setSelectedImage(null);
    setMobileMenuOpen(false);
  };

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversationMutation.mutate(conversationId);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    handleSendMessage(suggestion);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      toast({
        title: "Image attached",
        description: "Your image is ready to send with your message",
      });
    };
    reader.readAsDataURL(file);
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
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Collapsible Conversations Sidebar */}
      <div 
        className={cn(
          "border-r border-border/50 flex flex-col bg-gradient-to-b from-muted/30 to-muted/10 backdrop-blur-sm transition-all duration-300",
          // Desktop behavior
          "hidden md:flex",
          sidebarCollapsed ? "md:w-16" : "md:w-80",
          // Mobile behavior - overlay
          mobileMenuOpen && "fixed inset-y-0 left-0 z-50 flex w-80 md:relative shadow-2xl"
        )}
      >
        <div className="p-3 border-b border-border/50 bg-gradient-to-b from-background to-muted/20">
          {/* SaintSal Logo & Toggle */}
          <div className="flex items-center justify-between mb-3">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                  <span className="text-primary-foreground font-bold text-lg">SS</span>
                </div>
                <div>
                  <div className="font-bold text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    SaintSal
                  </div>
                  <div className="text-xs text-muted-foreground/70">Your Gotta Guy™</div>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 mx-auto">
                <span className="text-primary-foreground font-bold text-lg">SS</span>
              </div>
            )}
            <div className={cn("flex items-center gap-2", sidebarCollapsed && "hidden")}>
              {/* Close button on mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </Button>
              {/* Desktop collapse toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex hover:bg-muted/50"
                data-testid="button-toggle-sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Collapse toggle when collapsed */}
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(false)}
              className="w-full hover:bg-muted/50 mb-3"
              data-testid="button-expand-sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Back to Dashboard Button */}
          <Button
            onClick={() => setLocation('/dashboard')}
            className={cn(
              "w-full shadow-sm hover:shadow-md transition-all duration-200 rounded-xl mb-2",
              sidebarCollapsed 
                ? "p-2.5 bg-muted/50 hover:bg-muted" 
                : "bg-muted/50 hover:bg-muted font-medium"
            )}
            data-testid="button-back-dashboard"
            variant="ghost"
          >
            <Home className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Button>
          
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className={cn(
              "w-full shadow-sm hover:shadow-md transition-all duration-200 rounded-xl",
              sidebarCollapsed 
                ? "p-2.5 bg-primary/10 hover:bg-primary/20" 
                : "bg-primary hover:bg-primary/90 font-medium"
            )}
            data-testid="button-new-chat"
          >
            <Plus className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
            {!sidebarCollapsed && <span>New Chat</span>}
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {!sidebarCollapsed && (
            <div className="text-xs uppercase tracking-wide text-muted-foreground/70 font-semibold mb-3 px-3">
              Recent Chats
            </div>
          )}
          {conversations?.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "relative group transition-all duration-200",
                sidebarCollapsed ? "mx-auto" : ""
              )}
            >
              <button
                onClick={() => {
                  setSelectedConversationId(conv.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full text-left transition-all duration-200 flex items-center rounded-xl relative",
                  sidebarCollapsed ? "p-2.5 justify-center" : "p-3 pr-11 gap-3",
                  selectedConversationId === conv.id
                    ? "bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
                data-testid={`button-conversation-${conv.id}`}
                title={sidebarCollapsed ? conv.title : undefined}
              >
                {sidebarCollapsed ? (
                  <MessageSquare className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    selectedConversationId === conv.id ? "text-primary" : ""
                  )} />
                ) : (
                  <>
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors shrink-0",
                      selectedConversationId === conv.id
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                    )}>
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className={cn(
                        "font-medium truncate text-sm transition-colors",
                        selectedConversationId === conv.id ? "text-foreground" : ""
                      )}>
                        {conv.title}
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                        {format(new Date(conv.updatedAt!), "MMM d, yyyy")}
                      </div>
                    </div>
                  </>
                )}
              </button>
              {!sidebarCollapsed && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    data-testid={`button-delete-${conv.id}`}
                    title="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {(!conversations || conversations.length === 0) && !sidebarCollapsed && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground/70 text-center">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground/50 text-center mt-1">
                Start a new chat to begin
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Always Visible */}
        
        <header className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Back to Dashboard button - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/dashboard')}
              className="hidden md:flex shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Chat Title - Shows conversation name or "New Chat" */}
            <h2 className="font-semibold text-sm sm:text-lg truncate flex-1">
              {selectedConversationId && conversations?.find(c => c.id === selectedConversationId)?.title
                ? conversations.find(c => c.id === selectedConversationId)?.title
                : "New Chat"}
            </h2>
            
            {/* New Chat Button - Always visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="md:hidden shrink-0"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Model Selector - Hidden on mobile */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[140px] sm:w-[180px] hidden sm:flex">
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
              className={cn("shrink-0", autoSpeak ? "text-primary" : "text-muted-foreground")}
              data-testid="button-auto-speak"
            >
              {autoSpeak ? <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {showEmptyState ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6">
              <div className="max-w-2xl w-full text-center space-y-4 sm:space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl sm:text-3xl font-bold" data-testid="text-welcome-title">
                    Cookin' Knowledge
                  </h1>
                  <p className="text-sm sm:text-base text-accent font-medium">
                    Your Gotta Guy™
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground px-4">
                    AI Chat • Web Search • Voice • Code Agent • Deep Research • Everything
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center px-4">
                  <Button
                    variant="outline"
                    className="rounded-full text-xs sm:text-sm"
                    size="sm"
                    onClick={() => handleSuggestion("Generate code for a React component")}
                    data-testid="button-suggestion-code"
                  >
                    <Code2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Generate Code
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs sm:text-sm"
                    size="sm"
                    onClick={() => handleSuggestion("What can you do?")}
                    data-testid="button-suggestion-help"
                  >
                    What can you do?
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs sm:text-sm"
                    size="sm"
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
            <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
              {messages?.map((message) => (
                <div key={message.id} className="group">
                  {message.role === "user" ? (
                    <div className="flex gap-3 sm:gap-4 items-start">
                      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                        <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || user?.email || "User"} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user?.firstName?.[0] || user?.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">You</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt!), "h:mm a")}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap m-0">
                            {String(message.content)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 sm:gap-4 items-start">
                      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">SaintSal</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt!), "h:mm a")}
                          </span>
                          {message.model && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {message.model}
                            </Badge>
                          )}
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap m-0">
                            {String(message.content)}
                          </p>
                          {/* Display citations if present */}
                          {message.searchResults && Array.isArray(message.searchResults) && message.searchResults.length > 0 && (
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border not-prose">
                              <div className="text-xs font-medium text-muted-foreground mb-2">Sources:</div>
                              <div className="space-y-1.5">
                                {(message.searchResults as any[]).map((citation: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs">
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 shrink-0">
                                      {idx + 1}
                                    </Badge>
                                    <a 
                                      href={String(citation)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline break-all leading-relaxed"
                                      data-testid={`citation-${idx}`}
                                    >
                                      {String(citation)}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && streamingMessage && (
                <div className="group">
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold animate-pulse">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">SaintSal</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          <span className="inline-flex items-center gap-1">
                            <span className="animate-pulse">●</span> Typing
                          </span>
                        </Badge>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap m-0">
                          {streamingMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stop Generation Button - Centered */}
              {isStreaming && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopGeneration}
                    className="gap-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                    Stop generating
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Combined Input & Mode Selector - MOBILE OPTIMIZED */}
        <div className="border-t border-border bg-background backdrop-blur-sm shrink-0 safe-bottom">
          {/* Mode Selector - Hidden on empty state, shown when chatting */}
          {!showEmptyState && (
            <div className="border-b border-border bg-muted/5">
              <div className="max-w-3xl mx-auto px-2 sm:px-6 py-1 sm:py-2">
                <ModeSelector
                  currentMode={selectedMode}
                  onModeChange={setSelectedMode}
                  disabled={isStreaming}
                  className="scale-75 sm:scale-100 origin-center"
                />
              </div>
            </div>
          )}
          
          {/* Modern Message Input Area */}
          <div className="max-w-4xl mx-auto px-2 sm:px-6 py-3 sm:py-4">
            {/* Selected Image Preview */}
            {selectedImage && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={selectedImage} 
                  alt="Selected" 
                  className="max-h-20 rounded-lg border-2 border-primary/20"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  onClick={() => setSelectedImage(null)}
                >
                  ×
                </Button>
              </div>
            )}
            
            {/* Input Container with Modern Shadow */}
            <div className="relative bg-card rounded-2xl shadow-lg border border-border/50 backdrop-blur-sm transition-all hover:shadow-xl">
              <div className="flex items-end gap-2 p-2">
                {/* Attachment Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-primary/10 shrink-0 self-end"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  data-testid="button-attach"
                >
                  {selectedImage ? (
                    <ImageIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>

                {/* Text Input */}
                <div className="flex-1 max-h-32 overflow-y-auto">
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
                      selectedMode === 'chat' ? "Your Gotta Guy™..." :
                      selectedMode === 'search' ? "Search the web..." :
                      selectedMode === 'research' ? "Deep research question..." :
                      selectedMode === 'code' ? "Describe your code needs..." :
                      selectedMode === 'voice' ? "Or press mic to speak 🎤" :
                      "Type a message..."
                    }
                    className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-2 py-2"
                    disabled={isStreaming}
                    data-testid="input-message"
                  />
                </div>

                {/* Voice Button */}
                <WalkieTalkieButton
                  onTranscript={handleVoiceTranscript}
                  className="h-10 w-10 shrink-0 self-end"
                  disabled={isStreaming}
                />

                {/* Send Button */}
                <Button
                  onClick={() => handleSendMessage()}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shrink-0 self-end transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  disabled={(!input.trim() && !selectedImage) || isStreaming}
                  data-testid="button-send"
                >
                  {isStreaming ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                data-testid="input-file"
              />
            </div>

            {/* Hint Text */}
            <div className="hidden sm:flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Press Enter to send</span>
              <span>•</span>
              <span>Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}