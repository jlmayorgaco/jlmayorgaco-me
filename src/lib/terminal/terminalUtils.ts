/**
 * Terminal Utilities
 * Shared utilities for terminal commands and output formatting
 */

import { TERMINAL_CONFIG } from '../config';

const { dividerChar, dividerLength, promptSymbol } = TERMINAL_CONFIG;

/**
 * Create a divider line
 */
export function createDivider(length: number = dividerLength): string {
  return dividerChar.repeat(length);
}

/**
 * Create a terminal header with title and divider
 */
export function createHeader(title: string): string {
  return `${title}\n${createDivider()}`;
}

/**
 * Format a list of items with indices
 */
export function formatList(items: string[]): string {
  return items.map((item, i) => `  ${i + 1}. ${item}`).join('\n');
}

/**
 * Format key-value pairs
 */
export function formatKeyValue(pairs: Record<string, string>): string {
  return Object.entries(pairs)
    .map(([key, value]) => `  ${key.padEnd(12)} ${value}`)
    .join('\n');
}

/**
 * Create a progress bar
 */
export function createProgressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Create a status indicator
 */
export function statusIndicator(status: boolean, label?: string): string {
  const indicator = status ? '●' : '○';
  const color = status ? 'green' : 'gray';
  return label ? `[${indicator}] ${label}` : indicator;
}

/**
 * Pad text to a specific width
 */
export function padText(text: string, width: number): string {
  return text.length > width ? text.slice(0, width - 3) + '...' : text.padEnd(width);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date for terminal display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Wrap text at a specific width
 */
export function wrapText(text: string, width: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > width) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  lines.push(currentLine.trim());
  return lines.join('\n');
}

/**
 * Simulate file permissions string
 */
export function formatPermissions(isDir: boolean = false): string {
  return isDir ? 'drwxr-xr-x' : '-rw-r--r--';
}

/**
 * Generate a fake timestamp
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
