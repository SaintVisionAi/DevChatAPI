import { useState } from "react";
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
import { Wand2, Sparkles, Download, X, Loader2, ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
  className?: string;
}

export function ImageGenerator({ onImageGenerated, className }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [size, setSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const { toast } = useToast();

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
      const response = await apiRequest<{
        success: boolean;
        imageUrl: string;
        prompt: string;
        model: string;
      }>("/api/images/dalle", {
        method: "POST",
        body: JSON.stringify({ prompt, size, quality }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.success && response.imageUrl) {
        setGeneratedImage(response.imageUrl);
        onImageGenerated?.(response.imageUrl);
        
        toast({
          title: "Image generated!",
          description: "Your masterpiece is ready",
        });
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

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saintsal-${Date.now()}.png`;
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

  return (
    <div className={className}>
      <Card className="p-4 sm:p-6 space-y-4 animate-slide-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Image Generator</h3>
            <p className="text-sm text-muted-foreground">Create stunning visuals with DALL-E 3</p>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image in detail... (e.g., 'A futuristic cyberpunk cityscape at sunset with neon lights')"
            className="min-h-[100px] resize-none text-base"
            disabled={isGenerating}
            data-testid="input-image-prompt"
          />

          {/* Settings */}
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

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-12 text-base gap-2 animate-pulse-glow"
            data-testid="button-generate-image"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating magic...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Generated Image Preview */}
        {generatedImage && (
          <div className="space-y-3 animate-fade-in">
            <div className="relative group rounded-xl overflow-hidden border border-border/50 shadow-lg">
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Image Overlay Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleDownload}
                  className="gap-2"
                  data-testid="button-download-image"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setGeneratedImage(null)}
                  className="gap-2"
                  data-testid="button-clear-image"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Download Button - Mobile Visible Always */}
            <div className="flex gap-2 sm:hidden">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex-1 gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => setGeneratedImage(null)}
                className="flex-1 gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Loading State with Shimmer */}
        {isGenerating && (
          <div className="space-y-3 animate-fade-in">
            <div className="aspect-square rounded-xl bg-muted/50 animate-shimmer relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-bounce-subtle">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Crafting your masterpiece...</p>
                  <p className="text-xs text-muted-foreground">This may take 15-30 seconds</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
