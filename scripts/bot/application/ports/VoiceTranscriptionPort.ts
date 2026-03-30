/**
 * Voice Transcription Port
 * For converting voice messages to text commentary
 */

import { Result } from '../../shared/Result';

export interface IVoiceTranscriptionService {
  /**
   * Transcribe audio file to text
   * @param audioBuffer Audio file buffer
   * @param mimeType MIME type (e.g., 'audio/ogg', 'audio/mp4')
   * @returns Transcribed text
   */
  transcribe(audioBuffer: Buffer, mimeType: string): Promise<Result<TranscriptionResult, Error>>;
  
  /**
   * Check if service is available/configured
   */
  isAvailable(): boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;  // seconds
  language?: string;
}

export interface ICommentaryFormatter {
  /**
   * Format raw transcription into structured commentary
   * Adds sections, bullet points, formatting
   */
  format(transcription: TranscriptionResult): Promise<StructuredCommentary>;
}

export interface StructuredCommentary {
  rawText: string;
  formattedText: string;
  keyPoints: string[];
  suggestedTags: string[];
  confidence: number;
}
