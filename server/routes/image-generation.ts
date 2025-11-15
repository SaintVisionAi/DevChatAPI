// Image generation routes - DALL-E and Gemini
import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Generate image with DALL-E (OpenAI)
router.post('/dalle', async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if user is authenticated
    if (!(req as any).user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Import OpenAI
    const OpenAI = await import('openai');
    const openai = new OpenAI.default({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'DALL-E service not available. Please configure OPENAI_API_KEY.' });
    }

    console.log('[DALL-E] Generating image:', { prompt: prompt.substring(0, 50), size, quality });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
    });

    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    console.log('[DALL-E] Image generated successfully');

    return res.json({
      success: true,
      imageUrl,
      prompt,
      model: 'dall-e-3',
    });
  } catch (error: any) {
    console.error('[DALL-E] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate image',
      details: error.response?.data || error.toString()
    });
  }
});

// Generate image with Gemini
router.post('/gemini', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if user is authenticated
    if (!(req as any).user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Import Gemini provider
    const { gemini } = await import('../providers/gemini');
    
    if (!gemini.isAvailable()) {
      return res.status(503).json({ error: 'Gemini service not available. Please configure GEMINI_API_KEY.' });
    }

    console.log('[Gemini Image] Generating image:', prompt.substring(0, 50));

    // Note: Gemini image generation via API is not yet available
    // This is a placeholder for when it becomes available
    return res.status(503).json({ 
      error: 'Gemini image generation coming soon! Use DALL-E for now.',
      suggestion: 'Try DALL-E 3 for high-quality image generation'
    });
  } catch (error: any) {
    console.error('[Gemini Image] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate image',
      details: error.toString()
    });
  }
});

export default router;
