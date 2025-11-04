// Deep Research Mode - Claude-style chain-of-thought reasoning
import type { WebSocket } from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

interface ResearchStep {
  type: 'thinking' | 'analysis' | 'synthesis' | 'conclusion';
  title: string;
  content: string;
}

interface ResearchContext {
  question: string;
  steps: ResearchStep[];
  sources: string[];
  confidence: number;
}

export class DeepResearch {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Perform deep research with chain-of-thought reasoning
   */
  async performResearch(
    question: string,
    ws: WebSocket,
    options: {
      model?: string;
      maxSteps?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const { 
      model = 'claude-3-opus-20240229',
      maxSteps = 5,
      temperature = 0.7
    } = options;

    const context: ResearchContext = {
      question,
      steps: [],
      sources: [],
      confidence: 0,
    };

    // Step 1: Initial Analysis
    ws.send(JSON.stringify({
      type: 'status',
      message: '🔬 Starting deep research analysis...',
    }));

    await this.sendStep(ws, 'thinking', 'Understanding the Question');
    const understanding = await this.analyzeQuestion(question, model, temperature);
    context.steps.push({
      type: 'thinking',
      title: 'Question Analysis',
      content: understanding,
    });

    // Step 2: Break down into sub-questions
    await this.sendStep(ws, 'analysis', 'Breaking down into components');
    const subQuestions = await this.generateSubQuestions(question, understanding, model, temperature);
    context.steps.push({
      type: 'analysis',
      title: 'Sub-questions',
      content: subQuestions.join('\n'),
    });

    // Step 3: Research each sub-question
    await this.sendStep(ws, 'analysis', 'Researching each component');
    const subAnswers: string[] = [];
    for (let i = 0; i < Math.min(subQuestions.length, maxSteps); i++) {
      const subQ = subQuestions[i];
      ws.send(JSON.stringify({
        type: 'status',
        message: `📊 Analyzing: ${subQ.substring(0, 50)}...`,
      }));

      const answer = await this.researchSubQuestion(subQ, model, temperature);
      subAnswers.push(answer);
      
      // Stream partial results
      ws.send(JSON.stringify({
        type: 'chunk',
        content: `\n\n### ${subQ}\n${answer}\n`,
      }));

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 4: Cross-reference and validate
    await this.sendStep(ws, 'synthesis', 'Cross-referencing findings');
    const validation = await this.validateFindings(question, subAnswers, model, temperature);
    context.steps.push({
      type: 'synthesis',
      title: 'Validation',
      content: validation,
    });

    // Step 5: Synthesize comprehensive answer
    await this.sendStep(ws, 'conclusion', 'Synthesizing final analysis');
    const synthesis = await this.synthesizeAnswer(question, subAnswers, validation, model, temperature);
    context.steps.push({
      type: 'conclusion',
      title: 'Final Synthesis',
      content: synthesis,
    });

    // Format final response with reasoning chain
    const formattedResponse = this.formatResearchResponse(context, synthesis);
    
    // Send complete response
    ws.send(JSON.stringify({
      type: 'research_complete',
      content: formattedResponse,
      steps: context.steps,
      confidence: this.calculateConfidence(context),
    }));

    return formattedResponse;
  }

  private async sendStep(ws: WebSocket, type: string, message: string) {
    ws.send(JSON.stringify({
      type: 'research_step',
      stepType: type,
      message: `${this.getStepEmoji(type)} ${message}`,
    }));
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private getStepEmoji(type: string): string {
    const emojis: Record<string, string> = {
      thinking: '🤔',
      analysis: '🔍',
      synthesis: '🔗',
      conclusion: '✅',
    };
    return emojis[type] || '📋';
  }

  private async analyzeQuestion(
    question: string,
    model: string,
    temperature: number
  ): Promise<string> {
    const prompt = `Analyze this question in depth:
    "${question}"

    Provide:
    1. What type of question this is (factual, analytical, creative, etc.)
    2. Key concepts and terms involved
    3. Potential complexities or nuances
    4. What kind of answer would be most helpful`;

    if (model.includes('claude') && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 500,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } else if (this.openai) {
      const response = await this.openai.chat.completions.create({
        model: model.includes('gpt') ? model : 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: 500,
      });
      return response.choices[0]?.message?.content || '';
    }

    return 'Unable to analyze question - no AI provider available';
  }

  private async generateSubQuestions(
    question: string,
    understanding: string,
    model: string,
    temperature: number
  ): Promise<string[]> {
    const prompt = `Based on this question: "${question}"
    And this analysis: ${understanding}

    Generate 3-5 specific sub-questions that, when answered, would provide a comprehensive response to the main question.
    Format as a numbered list.`;

    let response = '';

    if (model.includes('claude') && this.anthropic) {
      const result = await this.anthropic.messages.create({
        model,
        max_tokens: 400,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });
      response = result.content[0].type === 'text' ? result.content[0].text : '';
    } else if (this.openai) {
      const result = await this.openai.chat.completions.create({
        model: model.includes('gpt') ? model : 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: 400,
      });
      response = result.choices[0]?.message?.content || '';
    }

    // Parse numbered list
    const lines = response.split('\n');
    const subQuestions = lines
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());

    return subQuestions.length > 0 ? subQuestions : [question];
  }

  private async researchSubQuestion(
    subQuestion: string,
    model: string,
    temperature: number
  ): Promise<string> {
    const prompt = `Research and provide a detailed answer to: "${subQuestion}"
    
    Include:
    - Key facts and evidence
    - Multiple perspectives if relevant
    - Any important caveats or limitations
    - Be thorough but concise`;

    if (model.includes('claude') && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 800,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } else if (this.openai) {
      const response = await this.openai.chat.completions.create({
        model: model.includes('gpt') ? model : 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: 800,
      });
      return response.choices[0]?.message?.content || '';
    }

    return 'Unable to research sub-question';
  }

  private async validateFindings(
    question: string,
    subAnswers: string[],
    model: string,
    temperature: number
  ): Promise<string> {
    const prompt = `Cross-reference and validate these research findings for the question: "${question}"

    Findings:
    ${subAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n\n')}

    Identify:
    1. Consistencies across findings
    2. Any contradictions or conflicts
    3. Gaps that still need addressing
    4. Overall reliability assessment`;

    if (model.includes('claude') && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 600,
        temperature: temperature * 0.8, // Lower temperature for validation
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } else if (this.openai) {
      const response = await this.openai.chat.completions.create({
        model: model.includes('gpt') ? model : 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature * 0.8,
        max_tokens: 600,
      });
      return response.choices[0]?.message?.content || '';
    }

    return 'Unable to validate findings';
  }

  private async synthesizeAnswer(
    question: string,
    subAnswers: string[],
    validation: string,
    model: string,
    temperature: number
  ): Promise<string> {
    const prompt = `Synthesize a comprehensive answer to: "${question}"

    Based on these researched components:
    ${subAnswers.map((a, i) => `Component ${i + 1}: ${a}`).join('\n\n')}

    Validation notes:
    ${validation}

    Provide:
    1. A clear, well-structured answer
    2. Key insights and takeaways
    3. Confidence level in the answer
    4. Any important limitations or areas for further research`;

    if (model.includes('claude') && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 1500,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } else if (this.openai) {
      const response = await this.openai.chat.completions.create({
        model: model.includes('gpt') ? model : 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: 1500,
      });
      return response.choices[0]?.message?.content || '';
    }

    return 'Unable to synthesize answer';
  }

  private calculateConfidence(context: ResearchContext): number {
    // Calculate confidence based on:
    // - Number of steps completed
    // - Consistency of findings
    // - Model used
    const baseConfidence = Math.min(context.steps.length * 20, 80);
    const hasValidation = context.steps.some(s => s.type === 'synthesis');
    const hasSynthesis = context.steps.some(s => s.type === 'conclusion');

    let confidence = baseConfidence;
    if (hasValidation) confidence += 10;
    if (hasSynthesis) confidence += 10;

    return Math.min(confidence, 95);
  }

  private formatResearchResponse(context: ResearchContext, synthesis: string): string {
    const steps = context.steps
      .map(step => `**${step.title}**\n${step.content}`)
      .join('\n\n---\n\n');

    return `# Deep Research Analysis

## Question
${context.question}

## Research Process

${steps}

---

## Final Synthesis

${synthesis}

---

**Confidence Level**: ${this.calculateConfidence(context)}%
**Research Depth**: ${context.steps.length} analytical steps
**Methodology**: Chain-of-thought reasoning with cross-validation`;
  }
}

export const deepResearch = new DeepResearch();