/**
 * Markdown Formatter - Single source of truth for markdown operations
 * Consolidates all markdown escaping and formatting
 */

import { CONSTANTS } from '../../shared/constants';

export class MarkdownFormatter {
  private static readonly TELEGRAM_ESCAPE_CHARS: Record<string, string> = {
    '\\': '\\\\',
    '_': '\\_',
    '*': '\\*',
    '[': '\\[',
    ']': '\\]',
    '`': '\\`',
  };

  private static readonly TELEGRAM_V2_ESCAPE_CHARS: Record<string, string> = {
    '\\': '\\\\',
    '_': '\\_',
    '*': '\\*',
    '[': '\\[',
    ']': '\\]',
    '(': '\\(',
    ')': '\\)',
    '~': '\\~',
    '`': '\\`',
    '>': '\\>',
    '#': '\\#',
    '+': '\\+',
    '-': '\\-',
    '=': '\\=',
    '|': '\\|',
    '{': '\\{',
    '}': '\\}',
    '.': '\\.',
    '!': '\\!',
  };

  /**
   * Escape HTML characters for Telegram HTML mode
   * @param text - Text to escape
   * @returns Escaped text safe for Telegram HTML
   */
  static escape(text: string, mode: 'v1' | 'v2' | 'html' = 'html'): string {
    if (mode === 'html') {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    const escapeMap = mode === 'v2' 
      ? this.TELEGRAM_V2_ESCAPE_CHARS 
      : this.TELEGRAM_ESCAPE_CHARS;

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let result = '';
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Escape the text before the link
      const preText = text.substring(lastIndex, match.index);
      result += preText.replace(/[\_*\[\]`]/g, char => escapeMap[char] || char);

      // Add the link. The label is escaped, but the url is preserved.
      const label = match[1];
      const url = match[2];
      
      const escapedLabel = label.replace(/[\_*\[\]`]/g, char => escapeMap[char] || char);
      
      // We only escape ) and \ in the URL to prevent breaking the Markdown parser, everything else stays clean
      const safeUrl = url.replace(/\\/g, '\\\\').replace(/\)/g, '\\)');
      
      result += `[${escapedLabel}](${safeUrl})`;
      
      lastIndex = linkRegex.lastIndex;
    }

    // Escape the remaining text
    const remainingText = text.substring(lastIndex);
    result += remainingText.replace(/[\_*\[\]`]/g, char => escapeMap[char] || char);

    return result;
  }

  /**
   * Unescape markdown characters
   * @param text - Escaped text
   * @returns Original text
   */
  static unescape(text: string): string {
    return text
      .replace(/\\_/g, '_')
      .replace(/\\\*/g, '*')
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\~/g, '~')
      .replace(/\\`/g, '`')
      .replace(/\\>/g, '>')
      .replace(/\\#/g, '#')
      .replace(/\\\+/g, '+')
      .replace(/\\-/g, '-')
      .replace(/\\=/g, '=')
      .replace(/\\\|/g, '|')
      .replace(/\\\{/g, '{')
      .replace(/\\\}/g, '}')
      .replace(/\\\./g, '.')
      .replace(/\\!/g, '!')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Split long message into chunks respecting Telegram limits
   * @param text - Long text to split
   * @param maxLength - Maximum chunk length (default: 4096)
   * @returns Array of chunks
   */
  static splitLongMessage(text: string, maxLength: number = CONSTANTS.TELEGRAM.MAX_MESSAGE_LENGTH): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    // Split by lines to keep logical breaks
    const lines = text.split('\n');

    for (const line of lines) {
      // If adding this line would exceed limit
      if (currentChunk.length + line.length + 1 > maxLength) {
        // Save current chunk
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        
        // If single line is longer than limit, split it
        if (line.length > maxLength) {
          for (let i = 0; i < line.length; i += maxLength) {
            chunks.push(line.slice(i, i + maxLength));
          }
          currentChunk = '';
        } else {
          currentChunk = line;
        }
      } else {
        currentChunk += '\n' + line;
      }
    }

    // Don't forget the last chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Truncate text with ellipsis
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text
   */
  static truncate(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text || '';
    }
    // Only safely truncate plain text. If HTML is passed, this could break tags.
    return text.slice(0, maxLength - 3) + '...';
  }

  /**
   * Format a list as markdown
   * @param items - Items to format
   * @param ordered - Whether to use ordered list
   * @returns Markdown list
   */
  static formatList(items: string[], ordered: boolean = false): string {
    return items
      .map((item, index) => {
        const prefix = ordered ? `${index + 1}.` : '•';
        return `${prefix} ${item}`;
      })
      .join('\n');
  }

  /**
   * Format code block
   * @param code - Code content
   * @param language - Language for syntax highlighting
   * @returns Formatted code block
   */
  static formatCodeBlock(code: string, language?: string): string {
    return `<pre><code class="language-${language || ''}">${this.escape(code, 'html')}</code></pre>`;
  }

  /**
   * Format inline code
   * @param text - Text to format
   * @returns Inline code
   */
  static formatInlineCode(text: string): string {
    return `<code>${this.escape(text, 'html')}</code>`;
  }

  /**
   * Format bold text
   * @param text - Text to bold
   * @returns Bold text
   */
  static bold(text: string): string {
    return `<b>${text}</b>`;
  }

  /**
   * Format italic text
   * @param text - Text to italicize
   * @returns Italic text
   */
  static italic(text: string): string {
    return `<i>${text}</i>`;
  }

  /**
   * Format link
   * @param text - Link text
   * @param url - URL
   * @returns Markdown link
   */
  static link(text: string, url: string): string {
    return `<a href="${url}">${text}</a>`;
  }

  /**
   * Format header
   * @param text - Header text
   * @param level - Header level (1-6)
   * @returns Markdown header
   */
  static header(text: string, level: number = 1): string {
    return `<b>${text}</b>\n`;
  }
}

