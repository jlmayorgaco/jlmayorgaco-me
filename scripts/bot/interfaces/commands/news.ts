/**
 * News command - scan RSS feeds for relevant news
 */

import type { CommandHandler, CommandContext } from '../types/commands';
import { scanNewsSources, formatNewsForTelegram } from '../../infrastructure/connectors/RssConnector';
import { logError, logWarn } from '../../infrastructure/logging/Logger';

export const newsCommand: CommandHandler = {
  name: 'news',
  description: 'Scan tech news RSS feeds',
  aliases: ['n'],
  
  async execute(context: CommandContext): Promise<void> {
    const { bot, config, sessionManager, chatId } = context;
    
    await bot.sendTyping();
    await bot.sendMessage('_Scanning news sources..._');
    
    try {
      const news = await scanNewsSources(config);
      const session = sessionManager.getSession(chatId);
      
      if (news.length === 0) {
        await bot.sendMessage(
          '_No news found with current topics. Try /daily for broader scan or /status to check feed health._'
        );
        return;
      }
      
      session.news = news.slice(0, 10);
      session.state = 'collecting_comment';
      
      const msg = formatNewsForTelegram(session.news, 5);
      
      await bot.sendMessage(msg);
      await bot.sendMessage(
        '_Reply with your commentary on any of these to generate a blog post_'
      );
      
      sessionManager.updateSession(chatId, session);
      
    } catch (e: any) {
      logError('News command failed', e);
      await bot.sendMessage(`❌ News scan error: ${e.message}`);
    }
  },
};
