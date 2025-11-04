import { MessageSquare, Search, Brain, Code2, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ChatMode = 'chat' | 'search' | 'research' | 'code' | 'voice';

interface ModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

const modes = [
  {
    id: 'chat' as ChatMode,
    icon: MessageSquare,
    label: 'Chat',
    description: 'Natural conversations',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'search' as ChatMode,
    icon: Search,
    label: 'Search',
    description: 'Web search & citations',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    id: 'research' as ChatMode,
    icon: Brain,
    label: 'Research',
    description: 'Deep analysis',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'code' as ChatMode,
    icon: Code2,
    label: 'Code',
    description: 'Multi-file editing',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    id: 'voice' as ChatMode,
    icon: Mic,
    label: 'Voice',
    description: 'Push-to-talk',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export function ModeSelector({ currentMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap" data-testid="mode-selector">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <button
            key={mode.id}
            onClick={() => !disabled && onModeChange(mode.id)}
            disabled={disabled}
            data-testid={`button-mode-${mode.id}`}
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200",
              "border hover-elevate active-elevate-2",
              isActive ? [
                "bg-card border-primary",
                "shadow-sm"
              ] : [
                "bg-muted/30 border-border/50",
              ],
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Icon */}
            <div className={cn(
              "flex items-center justify-center transition-colors",
              isActive ? mode.color : "text-muted-foreground group-hover:text-foreground"
            )}>
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            
            {/* Label */}
            <div className="flex flex-col items-start gap-0.5">
              <span className={cn(
                "text-sm font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {mode.label}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {mode.description}
              </span>
            </div>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
