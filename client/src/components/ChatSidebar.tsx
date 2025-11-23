import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
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
import { Conversation } from "@shared/schema";
import { format } from "date-fns";

interface ChatSidebarProps {
  conversations: Conversation[] | undefined;
  selectedConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  selectedConversationId,
  onNewChat,
  onSelectConversation,
}: ChatSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        {/* SaintSal Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-lg">SS</span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="font-bold text-base text-primary">SaintSal</div>
            <div className="text-xs text-muted-foreground">Responsible Intelligence</div>
          </div>
        </div>
        
        {/* New Chat Button */}
        <Button
          onClick={onNewChat}
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
                      onClick={() => onSelectConversation(conv.id)}
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

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
          {conversations ? `${conversations.length} conversations` : "Loading..."}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}