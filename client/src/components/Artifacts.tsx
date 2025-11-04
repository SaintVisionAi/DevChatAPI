import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Copy, 
  Download, 
  Check, 
  FileCode2, 
  FileText, 
  Image, 
  File,
  ChevronRight,
  Code2,
  Maximize2,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Artifact {
  id: string;
  type: 'code' | 'text' | 'image' | 'file';
  title: string;
  content: string;
  language?: string;
  mimeType?: string;
  size?: number;
  timestamp: Date;
}

interface ArtifactsProps {
  artifacts: Artifact[];
  onClose?: () => void;
}

export function Artifacts({ artifacts, onClose }: ArtifactsProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    artifacts.length > 0 ? artifacts[0] : null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadArtifact = (artifact: Artifact) => {
    const blob = new Blob([artifact.content], { 
      type: artifact.mimeType || 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '-').toLowerCase()}.${getFileExtension(artifact)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (artifact: Artifact): string => {
    if (artifact.language) {
      const extensions: Record<string, string> = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        csharp: 'cs',
        cpp: 'cpp',
        go: 'go',
        rust: 'rs',
        html: 'html',
        css: 'css',
        json: 'json',
        yaml: 'yaml',
        markdown: 'md',
      };
      return extensions[artifact.language] || 'txt';
    }
    return 'txt';
  };

  const getIcon = (artifact: Artifact) => {
    switch (artifact.type) {
      case 'code':
        return <FileCode2 className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const highlightCode = (code: string, language?: string): string => {
    // Basic syntax highlighting (can be enhanced with a library like Prism.js)
    if (!language) return code;
    
    // Simple keyword highlighting for demonstration
    const keywords = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'async', 'await'],
      python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'for', 'while', 'async', 'await'],
    };

    let highlighted = code;
    const keywordList = keywords[language as keyof typeof keywords] || [];
    
    keywordList.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      highlighted = highlighted.replace(regex, '<span class="text-primary font-bold">$1</span>');
    });
    
    // Highlight strings
    highlighted = highlighted.replace(/(["'`])([^"'`]*)\1/g, '<span class="text-green-600 dark:text-green-400">$1$2$1</span>');
    
    // Highlight comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-muted-foreground italic">$1</span>');
    
    return highlighted;
  };

  if (artifacts.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="py-20 text-center text-muted-foreground">
          <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No artifacts yet</p>
          <p className="text-sm mt-2">Generated code and files will appear here</p>
        </CardContent>
      </Card>
    );
  }

  const ArtifactsContent = () => (
    <div className="flex h-full">
      {/* Sidebar with artifact list */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/20">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Artifacts ({artifacts.length})
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {artifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => setSelectedArtifact(artifact)}
                className={`w-full text-left p-3 rounded-lg transition-colors hover-elevate ${
                  selectedArtifact?.id === artifact.id
                    ? 'bg-accent border border-accent-border'
                    : 'hover:bg-muted'
                }`}
                data-testid={`button-artifact-${artifact.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(artifact)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{artifact.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {artifact.language && (
                        <Badge variant="secondary" className="text-xs">
                          {artifact.language}
                        </Badge>
                      )}
                      {artifact.size && (
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(artifact.size)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 mt-0.5 opacity-50" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {selectedArtifact && (
          <>
            {/* Header with actions */}
            <div className="p-4 border-b border-border bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {getIcon(selectedArtifact)}
                    {selectedArtifact.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(selectedArtifact.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedArtifact.content, selectedArtifact.id)}
                    data-testid={`button-copy-${selectedArtifact.id}`}
                  >
                    {copiedId === selectedArtifact.id ? (
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
                    size="sm"
                    variant="outline"
                    onClick={() => downloadArtifact(selectedArtifact)}
                    data-testid={`button-download-${selectedArtifact.id}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {!isFullscreen && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsFullscreen(true)}
                      data-testid="button-fullscreen"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Content preview */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {selectedArtifact.type === 'code' ? (
                  <pre className="bg-muted p-6 rounded-lg overflow-x-auto">
                    <code 
                      className="text-sm font-mono"
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(selectedArtifact.content, selectedArtifact.language)
                      }}
                      data-testid={`code-preview-${selectedArtifact.id}`}
                    />
                  </pre>
                ) : selectedArtifact.type === 'image' ? (
                  <div className="flex justify-center">
                    <img 
                      src={selectedArtifact.content} 
                      alt={selectedArtifact.title}
                      className="max-w-full h-auto rounded-lg"
                      data-testid={`image-preview-${selectedArtifact.id}`}
                    />
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans" data-testid={`text-preview-${selectedArtifact.id}`}>
                      {selectedArtifact.content}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] h-[90vh]">
          <DialogHeader className="pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Artifacts</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsFullscreen(false)}
                data-testid="button-close-fullscreen"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-hidden -mx-6 -mb-6 mt-4">
            <ArtifactsContent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="h-full border-border">
      <CardHeader className="p-0">
        {onClose && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <CardTitle className="text-base">Artifacts</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              data-testid="button-close-artifacts"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-60px)]">
        <ArtifactsContent />
      </CardContent>
    </Card>
  );
}