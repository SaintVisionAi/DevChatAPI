import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, Sparkles, Download, Trash2, Loader2, ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function ImageGenPage() {
  const { toast } = useToast();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{url: string, prompt: string, timestamp: number}>>([]);
  const [model, setModel] = useState<"dalle" | "grok">("grok");
  const [size, setSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe the image you want to generate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const endpoint = model === "grok" ? "/api/images/grok" : "/api/images/dalle";
      const payload = model === "grok" 
        ? { prompt, aspectRatio }
        : { prompt, size, quality };

      const response = await apiRequest("POST", endpoint, payload);
      const data = await response.json();

      if (data.success && data.imageUrl) {
        setGeneratedImages(prev => [{
          url: data.imageUrl,
          prompt: prompt,
          timestamp: Date.now()
        }, ...prev]);
        
        toast({
          title: "Image generated!",
          description: `Your ${model === "grok" ? "Grok Aurora" : "DALL-E 3"} masterpiece is ready`,
        });
        
        setPrompt("");
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saintsal-${Date.now()}-${index}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Downloaded!",
        description: "Image saved to your device",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download image",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = () => {
    setGeneratedImages([]);
    toast({
      title: "Gallery cleared",
      description: "All images removed",
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6 max-w-md text-center">
          <p className="text-muted-foreground">Please login to generate images</p>
        </Card>
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
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Image Generator</h1>
              <p className="text-xs text-muted-foreground">
                {model === "grok" ? "Powered by Grok Aurora" : "Powered by DALL-E 3"}
              </p>
            </div>
          </div>

          {generatedImages.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              data-testid="button-clear-gallery"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Generator Card */}
          <Card className="p-4 sm:p-6 space-y-4">
            {/* Prompt Input */}
            <div className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your image in detail... (e.g., 'A futuristic cyberpunk cityscape at sunset with neon lights')"
                className="min-h-[120px] resize-none text-base"
                disabled={isGenerating}
                data-testid="input-image-prompt"
              />

              {/* Model Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Model</label>
                <Select value={model} onValueChange={(v: any) => setModel(v)} disabled={isGenerating}>
                  <SelectTrigger data-testid="select-image-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grok">Grok Aurora (Fast)</SelectItem>
                    <SelectItem value="dalle">DALL-E 3 (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Settings - Conditional based on model */}
              {model === "dalle" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size</label>
                    <Select value={size} onValueChange={(v: any) => setSize(v)} disabled={isGenerating}>
                      <SelectTrigger data-testid="select-image-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                        <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                        <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quality</label>
                    <Select value={quality} onValueChange={(v: any) => setQuality(v)} disabled={isGenerating}>
                      <SelectTrigger data-testid="select-image-quality">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="hd">HD (Premium)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)} disabled={isGenerating}>
                    <SelectTrigger data-testid="select-aspect-ratio">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                      <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              size="lg"
              data-testid="button-generate-image"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          </Card>

          {/* Gallery */}
          {generatedImages.length === 0 ? (
            <Card className="p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No images yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Generate your first AI masterpiece above
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((image, index) => (
                <Card key={image.timestamp} className="overflow-hidden group">
                  <div className="relative aspect-square">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                      data-testid={`image-generated-${index}`}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(image.url, index)}
                        data-testid={`button-download-${index}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {image.prompt}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
