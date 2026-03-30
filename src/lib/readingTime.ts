/**
 * Calculate reading time for content
 * @param content - The text content to analyze
 * @param wordsPerMinute - Reading speed (default: 200)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute = 200): number {
  // Remove code blocks as they take longer to read
  const codeBlockRegex = /```[\s\S]*?```/g;
  const textOnly = content.replace(codeBlockRegex, '');
  
  // Count words
  const words = textOnly.trim().split(/\s+/).length;
  
  // Calculate reading time (minimum 1 minute)
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Format reading time for display
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5 min read")
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
