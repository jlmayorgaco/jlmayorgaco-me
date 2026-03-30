/**
 * Cancel command - reset current session
 */

import type { CommandHandler, CommandContext } from '../types/commands';

export const cancelCommand: CommandHandler = {
  name: 'cancel',
  description: 'Reset current session',
  aliases: ['reset', 'stop'],
  
  async execute(context: CommandContext): Promise<void> {
    const { bot, sessionManager, chatId } = context;
    
    const session = sessionManager.getSession(chatId);
    session.state = 'idle';
    session.selectedItems = [];
    session.userComment = '';
    session.pendingPost = null;
    
    sessionManager.updateSession(chatId, session);
    
    await bot.sendMessage('✅ Session reset. You can start fresh with /daily or /papers');
  },
};
