import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated?: (imageUrl: string) => void;
}

export function ImageGenerationDialog({ open, onOpenChange, onImageGenerated }: ImageGenerationDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<"dalle" | "gemini">("dalle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const endpoint = provider === "dalle" ? "/api/images/dalle" : "/api/images/gemini";
      const response: any = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ prompt, size: "1024x1024", quality: "standard" }),
      }).then(res => res.json());

      if (response.success) {
        const imageUrl = provider === "dalle" ? response.imageUrl : `data:image/png;base64,${response.imageData}`;
        setGeneratedImage(imageUrl);
        onImageGenerated?.(imageUrl);
        
        toast({
          title: "Success",
          description: `Image generated with ${provider === "dalle" ? "DALL-E" : "Gemini"}!`,
        });
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Image
          </DialogTitle>
          <DialogDescription>
            Create stunning images with AI using DALL-E or Gemini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your image</Label>
            <Textarea
              id="prompt"
              data-testid="input-image-prompt"
              placeholder="A serene landscape with mountains at sunset..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label>AI Provider</Label>
            <RadioGroup value={provider} onValueChange={(value: any) => setProvider(value)} disabled={isGenerating}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dalle" id="dalle" data-testid="radio-dalle" />
                <Label htmlFor="dalle" className="font-normal cursor-pointer">
                  DALL-E 3 (OpenAI) - Photorealistic & detailed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gemini" id="gemini" data-testid="radio-gemini" />
                <Label htmlFor="gemini" className="font-normal cursor-pointer">
                  Gemini Imagen - Creative & artistic
                </Label>
              </div>
            </RadioGroup>
          </div>

          {generatedImage && (
            <div className="space-y-2">
              <Label>Generated Image</Label>
              <div className="border rounded-md overflow-hidden">
                <img src={generatedImage} alt="Generated" className="w-full" data-testid="img-generated" />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
