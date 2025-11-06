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

export function ModeSelector({ currentMode, onModeChange, disabled, className }: ModeSelectorProps & { className?: string }) {
  return (
    <div className={cn("flex gap-1 justify-center", className)} data-testid="mode-selector">
      {/* Mobile-optimized: Compact pills with icons */}
      <div className="flex gap-0.5 bg-muted/30 rounded-lg p-0.5">
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
                "relative flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-all duration-200",
                "min-w-[50px] sm:min-w-[80px]",
                isActive ? [
                  "bg-primary text-primary-foreground shadow-md",
                  "font-medium"
                ] : [
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/50"
                ],
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Icon */}
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" strokeWidth={2} />
              
              {/* Label - Hidden on mobile, shown on desktop */}
              <span className={cn(
                "text-xs sm:text-sm transition-all",
                "hidden xs:inline"
              )}>
                {mode.label}
              </span>
              
              {/* Mobile: Show only first letter as fallback */}
              <span className="xs:hidden text-xs font-medium">
                {mode.label[0]}
              </span>
              
              {/* Active indicator dot on mobile */}
              {isActive && (
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full sm:hidden animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
