// Perplexity API integration for web search with citations
// Reference: blueprint:perplexity_v0

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexitySearchOptions {
  model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro';
  temperature?: number;
  max_tokens?: number;
  searchDomainFilter?: string[];
  searchRecencyFilter?: 'day' | 'week' | 'month' | 'year';
  returnRelatedQuestions?: boolean;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  citations: string[];
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SearchResult {
  answer: string;
  citations: string[];
  relatedQuestions?: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class PerplexityClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  PERPLEXITY_API_KEY not set - web search will not work');
    }
  }

  /**
   * Search the web with Perplexity AI and get cited, factual answers
   */
  async search(
    messages: PerplexityMessage[],
    options: PerplexitySearchOptions = {}
  ): Promise<SearchResult> {
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required for web search');
    }

    const {
      model = 'sonar-pro', // Use sonar-pro for better quality (2025 model)
      temperature = 0.2,
      max_tokens = 2000,
      searchDomainFilter,
      searchRecencyFilter = 'month',
      returnRelatedQuestions = true,
    } = options;

    // Validate messages format (must alternate user/assistant after system)
    this.validateMessages(messages);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
        top_p: 0.9,
        stream: false,
        return_related_questions: returnRelatedQuestions,
        search_recency_filter: searchRecencyFilter,
        ...(searchDomainFilter && { search_domain_filter: searchDomainFilter }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${error}`);
    }

    const data: PerplexityResponse = await response.json();
    
    return {
      answer: data.choices[0].message.content,
      citations: data.citations || [],
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  /**
   * Validate message format for Perplexity API
   * After optional system message, roles must alternate user/assistant ending with user
   */
  private validateMessages(messages: PerplexityMessage[]): void {
    if (messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    let startIdx = 0;
    
    // Skip system message if present
    if (messages[0].role === 'system') {
      startIdx = 1;
    }

    // Check alternating pattern and ending with user
    for (let i = startIdx; i < messages.length; i++) {
      const expectedRole = (i - startIdx) % 2 === 0 ? 'user' : 'assistant';
      if (messages[i].role !== expectedRole) {
        throw new Error(
          `Invalid message sequence: expected ${expectedRole} at position ${i}, got ${messages[i].role}`
        );
      }
    }

    // Last message must be user
    if (messages[messages.length - 1].role !== 'user') {
      throw new Error('Last message must be from user');
    }
  }

  /**
   * Format search results with citations for display
   */
  formatWithCitations(result: SearchResult): string {
    let formatted = result.answer;

    if (result.citations.length > 0) {
      formatted += '\n\n**Sources:**\n';
      result.citations.forEach((citation, idx) => {
        formatted += `${idx + 1}. ${citation}\n`;
      });
    }

    if (result.relatedQuestions && result.relatedQuestions.length > 0) {
      formatted += '\n**Related Questions:**\n';
      result.relatedQuestions.forEach((q) => {
        formatted += `- ${q}\n`;
      });
    }

    return formatted;
  }
}

// Singleton instance
export const perplexity = new PerplexityClient();
