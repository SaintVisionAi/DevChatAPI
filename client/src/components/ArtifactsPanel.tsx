import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, FileText, Code, Image, Download, Copy, Check, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Artifact {
  id: string;
  type: 'code' | 'document' | 'image' | 'file';
  title: string;
  content: string;
  language?: string;
  createdAt: Date;
}

interface ArtifactsPanelProps {
  artifacts: Artifact[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ArtifactsPanel({ artifacts, isOpen, onClose, className }: ArtifactsPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    artifacts.length > 0 ? artifacts[0] : null
  );
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (selectedArtifact) {
      navigator.clipboard.writeText(selectedArtifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "The artifact content has been copied.",
      });
    }
  };

  const handleDownload = () => {
    if (selectedArtifact) {
      const blob = new Blob([selectedArtifact.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedArtifact.title}.${selectedArtifact.language || 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getIcon = (type: Artifact['type']) => {
    switch (type) {
      case 'code': return <Code className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn(
      "fixed right-0 top-0 h-screen bg-background border-l border-border shadow-xl transition-all duration-300 z-40",
      isExpanded ? "w-full md:w-3/4" : "w-full md:w-1/2 lg:w-1/3",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Artifacts</h2>
          <Badge variant="secondary">{artifacts.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-toggle-expand"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-artifacts"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Artifacts List */}
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-48 border-r border-border overflow-y-auto p-2 space-y-1">
          {artifacts.map((artifact) => (
            <button
              key={artifact.id}
              onClick={() => setSelectedArtifact(artifact)}
              className={cn(
                "w-full text-left p-2 rounded-lg transition-colors hover-elevate",
                selectedArtifact?.id === artifact.id ? "bg-accent" : "hover:bg-muted/50"
              )}
              data-testid={`artifact-${artifact.id}`}
            >
              <div className="flex items-start gap-2">
                {getIcon(artifact.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{artifact.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {artifact.type} • {artifact.language || 'text'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedArtifact ? (
            <>
              {/* Artifact Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
                <div>
                  <h3 className="font-semibold">{selectedArtifact.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {selectedArtifact.type}
                    </Badge>
                    {selectedArtifact.language && (
                      <Badge variant="outline">
                        {selectedArtifact.language}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    data-testid="button-copy-artifact"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    data-testid="button-download-artifact"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Content Display */}
              <div className="flex-1 overflow-auto p-4">
                <Card className="h-full p-4 bg-muted/5">
                  {selectedArtifact.type === 'code' ? (
                    <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                      <code>{selectedArtifact.content}</code>
                    </pre>
                  ) : selectedArtifact.type === 'image' ? (
                    <img 
                      src={selectedArtifact.content} 
                      alt={selectedArtifact.title}
                      className="max-w-full h-auto"
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {selectedArtifact.content}
                    </div>
                  )}
                </Card>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              No artifact selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}