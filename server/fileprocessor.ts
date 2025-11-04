// File Processor - Handle file uploads and extract content
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

interface ProcessedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  content?: string;
  base64?: string;
  metadata?: Record<string, any>;
}

export class FileProcessor {
  private uploadDir: string = '/tmp/uploads';

  constructor() {
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Process uploaded file based on type
   */
  async processFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<ProcessedFile> {
    const fileId = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(fileName);
    const savedPath = path.join(this.uploadDir, `${fileId}${extension}`);

    // Save file temporarily
    await fs.writeFile(savedPath, fileBuffer);

    const processedFile: ProcessedFile = {
      id: fileId,
      originalName: fileName,
      mimeType,
      size: fileBuffer.length,
    };

    try {
      // Process based on file type
      if (this.isImage(mimeType)) {
        processedFile.base64 = fileBuffer.toString('base64');
        processedFile.metadata = {
          type: 'image',
          canAnalyze: true,
        };
      } else if (this.isPDF(mimeType)) {
        // For PDFs, we'll extract text (simplified for now)
        processedFile.content = await this.extractPDFText(savedPath);
        processedFile.metadata = {
          type: 'pdf',
          pageCount: 1, // Simplified
        };
      } else if (this.isTextDocument(mimeType, fileName)) {
        // Read text content directly
        processedFile.content = fileBuffer.toString('utf-8');
        processedFile.metadata = {
          type: 'text',
          encoding: 'utf-8',
        };
      } else if (this.isCodeFile(fileName)) {
        // Read code content
        processedFile.content = fileBuffer.toString('utf-8');
        processedFile.metadata = {
          type: 'code',
          language: this.detectCodeLanguage(fileName),
        };
      } else {
        // Unknown file type
        processedFile.metadata = {
          type: 'binary',
          canProcess: false,
        };
      }
    } catch (error) {
      console.error('Error processing file:', error);
      processedFile.metadata = {
        error: 'Failed to process file',
      };
    }

    // Clean up temp file after processing (in production, might want to keep for a while)
    setTimeout(() => {
      fs.unlink(savedPath).catch(console.error);
    }, 60000); // Delete after 1 minute

    return processedFile;
  }

  /**
   * Extract text from multiple files
   */
  async processMultipleFiles(
    files: Array<{ buffer: Buffer; name: string; mimeType: string }>
  ): Promise<ProcessedFile[]> {
    const processed = await Promise.all(
      files.map(file => this.processFile(file.buffer, file.name, file.mimeType))
    );
    return processed;
  }

  /**
   * Check if file is an image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file is a PDF
   */
  private isPDF(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  /**
   * Check if file is a text document
   */
  private isTextDocument(mimeType: string, fileName: string): boolean {
    const textMimes = [
      'text/plain',
      'text/html',
      'text/css',
      'text/csv',
      'text/markdown',
      'application/json',
      'application/xml',
      'text/xml',
    ];
    
    const textExtensions = ['.txt', '.md', '.csv', '.log', '.ini', '.cfg'];
    const ext = path.extname(fileName).toLowerCase();
    
    return textMimes.includes(mimeType) || textExtensions.includes(ext);
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(fileName: string): boolean {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
      '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.scala', '.sh',
      '.bash', '.ps1', '.sql', '.r', '.m', '.lua', '.dart', '.vue',
      '.svelte', '.elm', '.clj', '.ex', '.exs', '.erl', '.hs', '.ml',
      '.fs', '.pas', '.pl', '.asm', '.v', '.vhd', '.vhdl',
    ];
    
    const ext = path.extname(fileName).toLowerCase();
    return codeExtensions.includes(ext);
  }

  /**
   * Detect programming language from file extension
   */
  private detectCodeLanguage(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase().slice(1);
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
      'bash': 'bash',
      'ps1': 'powershell',
      'sql': 'sql',
      'r': 'r',
      'lua': 'lua',
      'dart': 'dart',
      'vue': 'vue',
      'svelte': 'svelte',
    };
    
    return languageMap[ext] || ext;
  }

  /**
   * Extract text from PDF (simplified version)
   * In production, you'd use a library like pdf-parse or pdfjs-dist
   */
  private async extractPDFText(filePath: string): Promise<string> {
    // This is a placeholder - in production, use a proper PDF parsing library
    // For now, we'll just return a message indicating PDF processing
    return `[PDF Document: ${path.basename(filePath)}]\n\nPDF text extraction would be implemented here with a library like pdf-parse.`;
  }

  /**
   * Get file statistics
   */
  async getFileStats(fileId: string): Promise<any> {
    const files = await fs.readdir(this.uploadDir);
    const targetFile = files.find(f => f.startsWith(fileId));
    
    if (!targetFile) {
      throw new Error('File not found');
    }

    const filePath = path.join(this.uploadDir, targetFile);
    const stats = await fs.stat(filePath);
    
    return {
      id: fileId,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  }

  /**
   * Clean up old files
   */
  async cleanupOldFiles(maxAgeMs: number = 3600000) {
    // Clean up files older than maxAgeMs (default: 1 hour)
    const files = await fs.readdir(this.uploadDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(this.uploadDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAgeMs) {
        await fs.unlink(filePath).catch(console.error);
      }
    }
  }
}

export const fileProcessor = new FileProcessor();