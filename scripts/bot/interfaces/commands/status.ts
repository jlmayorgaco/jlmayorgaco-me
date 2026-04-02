/**
 * Status command - show bot health and metrics
 */

import type { CommandHandler, CommandContext } from '../types/commands';
import { getGeminiCircuitStatus } from '../../infrastructure/external/GeminiService';

export const statusCommand: CommandHandler = {
  name: 'status',
  description: 'Show bot status and health',
  aliases: ['health', 'stats'],
  
  async execute(context: CommandContext): Promise<void> {
    const { bot, sessionManager } = context;
    
    const sessionMetrics = sessionManager.getMetrics();
    const geminiStatus = getGeminiCircuitStatus();
    
    const uptime = process.uptime();
    const uptimeStr = formatUptime(uptime);
    
    const memory = process.memoryUsage();
    const memoryMB = Math.round(memory.heapUsed / 1024 / 1024);
    
    let msg = `*Bot Status*\n━━━━━━━━━━━━\n\n`;
    msg += `✅ Running: ${uptimeStr}\n`;
    msg += `💾 Memory: ${memoryMB}MB\n`;
    msg += `👥 Sessions: ${sessionMetrics.activeSessions} active\n`;
    msg += `🤖 Gemini: ${geminiStatus.state.toUpperCase()}\n`;
    msg += `⏱️ Time: ${new Date().toISOString()}`;
    
    await bot.sendMessage(msg);
  },
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
