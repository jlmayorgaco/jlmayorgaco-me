/**
 * Voice Command Handler
 * Handles voice messages for commentary input
 * Requires OpenAI Whisper API
 */

import { logError, logInfo, logDebug } from '../../infrastructure/logging/Logger';

interface CommandContext {
  bot: any;
  config: any;
  sessionManager: any;
  chatId: number;
  transcriptionService?: any;
  commentaryFormatter?: any;
}

/**
 * Process voice message
 * Called when user sends audio file
 */
export async function handleVoiceMessage(
  ctx: CommandContext,
  fileId: string
): Promise<string | null> {
  const { bot, chatId, transcriptionService } = ctx;
  
  if (!transcriptionService) {
    await bot.sendMessage(
      'âŒ Voice transcription not configured. Please send text commentary instead.\n' +
      'To enable voice, set OPENAI_API_KEY in your environment.'
    );
    return null;
  }
  
  try {
    // Send typing indicator
    await bot.sendTyping();
    await bot.sendMessage('_Transcribing voice message..._');
    
    // Download the voice file from Telegram
    const audioBuffer = await downloadTelegramFile(ctx, fileId);
    
    if (!audioBuffer) {
      await bot.sendMessage('âŒ Could not download voice message.');
      return null;
    }
    
    // Transcribe using Whisper API
    const result = await transcriptionService.transcribe(audioBuffer, 'audio/ogg');
    
    if (!result.success) {
      await bot.sendMessage(`âŒ Transcription failed: ${result.error?.message}`);
      return null;
    }
    
    const transcription = result.data;
    
    // Format if commentary formatter available
    let formattedText = transcription.text;
    if (ctx.commentaryFormatter) {
      const formatted = await ctx.commentaryFormatter.format(transcription);
      formattedText = formatted.formattedText;
      
      // Show key points if any
      if (formatted.keyPoints.length > 0) {
        let keyPointsMsg = `\n\n*Key Points:*\n`;
        for (const point of formatted.keyPoints.slice(0, 3)) {
          keyPointsMsg += `â€¢ ${point}\n`;
        }
      }
    }
    
    logInfo('Voice transcription successful', {
      duration: transcription.duration,
      textLength: formattedText.length,
    });
    
    return formattedText;
    
  } catch (e: any) {
    logError('Voice processing failed', e);
    await bot.sendMessage(`âŒ Voice processing error: ${e.message}`);
    return null;
  }
}

/**
 * Download file from Telegram
 */
async function downloadTelegramFile(
  ctx: CommandContext,
  fileId: string
): Promise<Buffer | null> {
  const { bot, config } = ctx;
  
  try {
    // Get file path from Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${config.telegram.botToken}/getFile?file_id=${fileId}`
    );
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.description || 'Failed to get file info');
    }
    
    // Download the file
    const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${data.result.file_path}`;
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      throw new Error('Failed to download file');
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
    
  } catch (e: any) {
    logError('File download failed', e);
    return null;
  }
}

/**
 * Check if message contains voice/audio
 */
export function isVoiceMessage(message: any): boolean {
  return !!(message.voice || message.audio || message.video_note);
}

/**
 * Extract file ID from message
 */
export function getFileId(message: any): string | null {
  if (message.voice) return message.voice.file_id;
  if (message.audio) return message.audio.file_id;
  if (message.video_note) return message.video_note.file_id;
  return null;
}

