/**
 * Whisper Voice Transcription Service
 * Uses OpenAI Whisper API to transcribe voice messages
 */

import { 
  IVoiceTranscriptionService, 
  TranscriptionResult,
  ICommentaryFormatter,
  StructuredCommentary 
} from '../../application/ports/VoiceTranscriptionPort';
import { Result } from '../../shared/Result';
import { ExternalServiceError } from '../../shared/errors/AppError';
import { logDebug, logError, logInfo } from '../../infrastructure/logging/Logger';
import { withRetry } from '../../shared/retry/RetryPolicy';
import FormData from 'form-data';

export class WhisperTranscriptionService implements IVoiceTranscriptionService {
  private readonly apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async transcribe(
    audioBuffer: Buffer, 
    mimeType: string
  ): Promise<Result<TranscriptionResult, Error>> {
    if (!this.isAvailable()) {
      return Result.err(new Error('Whisper API not configured'));
    }

    try {
      logDebug('Transcribing voice message', { size: audioBuffer.length, mimeType });

      const result = await withRetry(async () => {
        const formData = new FormData();
        
        // Map MIME type to file extension
        const ext = this.getFileExtension(mimeType);
        formData.append('file', audioBuffer, `audio.${ext}`);
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        formData.append('response_format', 'json');

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders(),
          },
          body: formData as any,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Whisper API error: ${error}`);
        }

        return response.json();
      }, 'EXTERNAL_API');

      const transcription: TranscriptionResult = {
        text: result.text,
        confidence: 0.95, // Whisper doesn't provide confidence, assume high
        duration: result.duration || 0,
        language: result.language,
      };

      logInfo('Voice transcription successful', { 
        duration: transcription.duration,
        textLength: transcription.text.length 
      });

      return Result.ok(transcription);

    } catch (error) {
      logError('Voice transcription failed', error as Error);
      return Result.err(
        new ExternalServiceError(
          'Failed to transcribe voice message',
          'Whisper API',
          undefined,
          { mimeType }
        )
      );
    }
  }

  private getFileExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
    };
    return map[mimeType] || 'ogg';
  }
}

/**
 * Commentary Formatter
 * Structures raw transcription into formatted commentary
 */
export class CommentaryFormatter implements ICommentaryFormatter {
  async format(transcription: TranscriptionResult): Promise<StructuredCommentary> {
    const text = transcription.text.trim();
    
    // Simple formatting: extract key points, format as markdown
    const formatted = this.formatAsCommentary(text);
    const keyPoints = this.extractKeyPoints(text);
    const tags = this.extractTags(text);

    return {
      rawText: text,
      formattedText: formatted,
      keyPoints,
      suggestedTags: tags,
      confidence: transcription.confidence,
    };
  }

  private formatAsCommentary(text: string): string {
    // Add markdown formatting
    let formatted = text;
    
    // Convert spoken "quote" or "quotation" to markdown quotes
    formatted = formatted.replace(/\bquote\b/gi, '> ');
    
    // Convert "new paragraph" or "paragraph" to actual paragraphs
    formatted = formatted.replace(/\b(new paragraph|paragraph)\b/gi, '\n\n');
    
    // Convert "bullet point" or "point" to list items
    formatted = formatted.replace(/\b(bullet point|point)\b/gi, '\n- ');
    
    // Clean up multiple spaces and newlines
    formatted = formatted.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n');
    
    return formatted.trim();
  }

  private extractKeyPoints(text: string): string[] {
    // Simple extraction: sentences with key indicators
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    const indicators = ['important', 'key', 'critical', 'essential', 'main', 'primary', 'fundamental'];
    
    return sentences
      .filter(sentence => 
        indicators.some(ind => sentence.toLowerCase().includes(ind))
      )
      .map(s => s.trim())
      .slice(0, 5); // Max 5 key points
  }

  private extractTags(text: string): string[] {
    // Extract potential tags (capitalized terms, technical terms)
    const words = text.split(/\s+/);
    const tags = new Set<string>();
    
    // Find technical/academic terms (heuristic)
    const technicalPatterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,  // Capitalized phrases
      /\b(?:algorithm|model|system|framework|method|approach|technique)\b/gi,
      /\b(?:neural|network|learning|optimization|distributed|control)\b/gi,
    ];
    
    for (const pattern of technicalPatterns) {
      const matches = text.match(pattern) || [];
      matches.forEach(match => tags.add(match.toLowerCase()));
    }
    
    return Array.from(tags).slice(0, 10);
  }
}

