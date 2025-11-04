// Code Agent - Advanced multi-file code editing and analysis
import type { WebSocket } from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

interface FileContext {
  path: string;
  content: string;
  language?: string;
  size?: number;
  lastModified?: Date;
}

interface CodeOperation {
  type: 'analyze' | 'edit' | 'create' | 'delete' | 'refactor';
  files: FileContext[];
  description?: string;
}

interface CodeAgentContext {
  projectType?: string;
  files: Map<string, FileContext>;
  operations: CodeOperation[];
  suggestions: string[];
}

export class CodeAgent {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private context: CodeAgentContext;

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

    this.context = {
      files: new Map(),
      operations: [],
      suggestions: [],
    };
  }

  /**
   * Process a code-related request with multi-file context
   */
  async processCodeRequest(
    request: string,
    files: FileContext[],
    ws: WebSocket,
    options: {
      model?: string;
      temperature?: number;
      operation?: string;
    } = {}
  ): Promise<string> {
    const { 
      model = 'claude-3-sonnet-20240229',
      temperature = 0.3, // Lower temperature for code
      operation = 'analyze'
    } = options;

    // Update context with provided files
    files.forEach(file => {
      this.context.files.set(file.path, file);
    });

    ws.send(JSON.stringify({
      type: 'status',
      message: '🔧 Code Agent analyzing your request...',
    }));

    // Determine the type of operation
    const operationType = this.determineOperation(request, operation);
    
    switch (operationType) {
      case 'analyze':
        return this.analyzeCode(request, ws, model, temperature);
      case 'edit':
        return this.editCode(request, ws, model, temperature);
      case 'create':
        return this.createCode(request, ws, model, temperature);
      case 'refactor':
        return this.refactorCode(request, ws, model, temperature);
      default:
        return this.generalCodeAssist(request, ws, model, temperature);
    }
  }

  private determineOperation(request: string, hint?: string): string {
    if (hint) return hint;

    const lowerRequest = request.toLowerCase();
    if (lowerRequest.includes('analyze') || lowerRequest.includes('review')) {
      return 'analyze';
    }
    if (lowerRequest.includes('edit') || lowerRequest.includes('modify') || lowerRequest.includes('fix')) {
      return 'edit';
    }
    if (lowerRequest.includes('create') || lowerRequest.includes('new') || lowerRequest.includes('add')) {
      return 'create';
    }
    if (lowerRequest.includes('refactor') || lowerRequest.includes('improve') || lowerRequest.includes('optimize')) {
      return 'refactor';
    }
    return 'analyze';
  }

  /**
   * Analyze code with multi-file context
   */
  private async analyzeCode(
    request: string,
    ws: WebSocket,
    model: string,
    temperature: number
  ): Promise<string> {
    ws.send(JSON.stringify({
      type: 'code_step',
      step: 'analysis',
      message: '📊 Analyzing code structure and patterns...',
    }));

    const filesList = Array.from(this.context.files.values());
    const codeContext = this.buildCodeContext(filesList);

    const prompt = `Analyze the following code and respond to this request: "${request}"

Code Context:
${codeContext}

Provide:
1. Code structure analysis
2. Potential issues or improvements
3. Best practices recommendations
4. Security considerations if relevant
5. Performance insights`;

    const analysis = await this.callAI(prompt, model, temperature, ws);

    // Send analysis results
    ws.send(JSON.stringify({
      type: 'code_analysis',
      content: analysis,
      files: filesList.map(f => f.path),
    }));

    return this.formatCodeResponse('analysis', analysis, filesList);
  }

  /**
   * Edit existing code with intelligent suggestions
   */
  private async editCode(
    request: string,
    ws: WebSocket,
    model: string,
    temperature: number
  ): Promise<string> {
    ws.send(JSON.stringify({
      type: 'code_step',
      step: 'editing',
      message: '✏️ Generating code edits...',
    }));

    const filesList = Array.from(this.context.files.values());
    const codeContext = this.buildCodeContext(filesList);

    const prompt = `Edit the following code based on this request: "${request}"

Current Code:
${codeContext}

Provide:
1. The modified code with clear markers for changes
2. Explanation of each change
3. Any additional files that need modification
4. Testing recommendations

Format the response with:
- Clear file paths
- Before/after comparisons for significant changes
- Inline comments for complex modifications`;

    const edits = await this.callAI(prompt, model, temperature, ws);

    // Parse and send individual file edits
    const editedFiles = this.parseFileEdits(edits);
    
    for (const file of editedFiles) {
      ws.send(JSON.stringify({
        type: 'file_edit',
        path: file.path,
        content: file.content,
        language: this.detectLanguage(file.path),
      }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.formatCodeResponse('edit', edits, editedFiles);
  }

  /**
   * Create new code files based on requirements
   */
  private async createCode(
    request: string,
    ws: WebSocket,
    model: string,
    temperature: number
  ): Promise<string> {
    ws.send(JSON.stringify({
      type: 'code_step',
      step: 'creating',
      message: '🚀 Creating new code files...',
    }));

    const existingFiles = Array.from(this.context.files.values());
    const contextSummary = this.summarizeContext(existingFiles);

    const prompt = `Create new code based on this request: "${request}"

Existing Project Context:
${contextSummary}

Generate:
1. Complete, production-ready code
2. Proper imports and dependencies
3. Error handling and validation
4. Documentation and comments
5. Unit test suggestions

Ensure the code:
- Follows the project's existing patterns
- Is properly typed (if applicable)
- Includes necessary configuration
- Is secure and performant`;

    const newCode = await this.callAI(prompt, model, temperature, ws);

    // Parse created files
    const newFiles = this.parseFileCreation(newCode);
    
    // Send each new file
    for (const file of newFiles) {
      ws.send(JSON.stringify({
        type: 'file_create',
        path: file.path,
        content: file.content,
        language: this.detectLanguage(file.path),
      }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.formatCodeResponse('create', newCode, newFiles);
  }

  /**
   * Refactor code for better structure and performance
   */
  private async refactorCode(
    request: string,
    ws: WebSocket,
    model: string,
    temperature: number
  ): Promise<string> {
    ws.send(JSON.stringify({
      type: 'code_step',
      step: 'refactoring',
      message: '🔨 Refactoring code structure...',
    }));

    const filesList = Array.from(this.context.files.values());
    const codeContext = this.buildCodeContext(filesList);

    const prompt = `Refactor the following code based on this request: "${request}"

Current Code:
${codeContext}

Refactoring Goals:
1. Improve code organization and readability
2. Reduce duplication (DRY principle)
3. Enhance performance where possible
4. Apply design patterns appropriately
5. Improve type safety and error handling

Provide:
- Step-by-step refactoring plan
- Refactored code with explanations
- Migration guide if breaking changes
- Performance impact analysis`;

    const refactored = await this.callAI(prompt, model, temperature, ws);

    // Send refactoring plan
    ws.send(JSON.stringify({
      type: 'refactor_plan',
      content: refactored,
    }));

    return this.formatCodeResponse('refactor', refactored, filesList);
  }

  /**
   * General code assistance
   */
  private async generalCodeAssist(
    request: string,
    ws: WebSocket,
    model: string,
    temperature: number
  ): Promise<string> {
    const filesList = Array.from(this.context.files.values());
    const codeContext = filesList.length > 0 ? this.buildCodeContext(filesList) : '';

    const prompt = `Assist with this code-related request: "${request}"
    
${codeContext ? `Code Context:\n${codeContext}\n\n` : ''}
Provide comprehensive assistance including:
- Direct answer to the request
- Code examples if relevant
- Best practices and recommendations
- Additional resources or considerations`;

    const response = await this.callAI(prompt, model, temperature, ws);
    return response;
  }

  /**
   * Build context string from files
   */
  private buildCodeContext(files: FileContext[]): string {
    if (files.length === 0) return 'No files provided';

    return files.map(file => `
File: ${file.path}
Language: ${file.language || this.detectLanguage(file.path)}
---
${file.content}
---
`).join('\n\n');
  }

  /**
   * Summarize context for better AI understanding
   */
  private summarizeContext(files: FileContext[]): string {
    if (files.length === 0) return 'New project - no existing files';

    const languages = new Set(files.map(f => this.detectLanguage(f.path)));
    const totalLines = files.reduce((sum, f) => sum + (f.content.split('\n').length || 0), 0);

    return `
Project has ${files.length} files
Languages: ${Array.from(languages).join(', ')}
Total lines: ${totalLines}
File structure:
${files.map(f => `  - ${f.path}`).join('\n')}`;
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filepath: string): string {
    const ext = filepath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'bash',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
    };

    return languageMap[ext || ''] || 'text';
  }

  /**
   * Parse file edits from AI response
   */
  private parseFileEdits(response: string): FileContext[] {
    const files: FileContext[] = [];
    const filePattern = /File:\s*(.*?)\n([\s\S]*?)(?=File:|$)/g;
    let match;

    while ((match = filePattern.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[2].trim(),
        language: this.detectLanguage(match[1]),
      });
    }

    // If no file markers found, treat entire response as single file edit
    if (files.length === 0 && this.context.files.size === 1) {
      const firstFile = Array.from(this.context.files.values())[0];
      files.push({
        ...firstFile,
        content: response,
      });
    }

    return files;
  }

  /**
   * Parse newly created files from AI response
   */
  private parseFileCreation(response: string): FileContext[] {
    const files: FileContext[] = [];
    
    // Look for code blocks with file paths
    const codeBlockPattern = /```(\w+)?\s*(?:\/\/|#|--)?.*?(?:File:|Path:)?\s*([\w\/.]+\.\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockPattern.exec(response)) !== null) {
      const language = match[1];
      const filepath = match[2] || `new_file_${files.length + 1}.${language || 'txt'}`;
      files.push({
        path: filepath,
        content: match[3].trim(),
        language: language || this.detectLanguage(filepath),
      });
    }

    return files;
  }

  /**
   * Call AI provider
   */
  private async callAI(
    prompt: string,
    model: string,
    temperature: number,
    ws?: WebSocket
  ): Promise<string> {
    let fullResponse = '';
    
    if (model.includes('claude') && this.anthropic) {
      const stream = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', // Use valid model name
        max_tokens: 4000,
        temperature,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullResponse += text;
          if (ws) {
            ws.send(JSON.stringify({ type: 'chunk', content: text }));
          }
        }
      }
      
      return fullResponse;
    } else if (this.openai) {
      const stream = await this.openai.chat.completions.create({
        model: model.includes('gpt') ? 'gpt-4-turbo-preview' : 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: 4000,
        stream: true,
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          if (ws) {
            ws.send(JSON.stringify({ type: 'chunk', content }));
          }
        }
      }
      
      return fullResponse;
    }

    return 'Code Agent unavailable - no AI provider configured';
  }

  /**
   * Format the final response
   */
  private formatCodeResponse(
    operation: string,
    content: string,
    files: FileContext[]
  ): string {
    const header = `## Code Agent - ${operation.charAt(0).toUpperCase() + operation.slice(1)}

**Files Processed**: ${files.length}
${files.map(f => `- ${f.path} (${f.language || 'unknown'})`).join('\n')}

---

`;

    return header + content;
  }

  /**
   * Clear context
   */
  clearContext() {
    this.context.files.clear();
    this.context.operations = [];
    this.context.suggestions = [];
  }
}

export const codeAgent = new CodeAgent();