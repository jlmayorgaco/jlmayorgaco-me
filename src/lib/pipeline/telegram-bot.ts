import { promises as fs } from 'fs';
import path from 'path';

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface Paper {
  id: string;
  title: string;
  summaryShort: string;
  authors: string[];
  published: string;
  keywords: string[];
  relevance: string;
  url: string;
}

const TELEGRAM_API = 'https://api.telegram.org/bot';

async function sendTelegramMessage(
  config: TelegramConfig,
  message: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
): Promise<boolean> {
  const url = `${TELEGRAM_API}${config.botToken}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

function formatPaperForTelegram(paper: Paper): string {
  const relevanceEmoji = paper.relevance === 'high' ? '🔴' : paper.relevance === 'medium' ? '🟡' : '⚪';
  
  let message = `${relevanceEmoji} *${paper.title}*\n\n`;
  message += `_${paper.authors.join(', ')}_\n`;
  message += `📅 ${new Date(paper.published).toLocaleDateString()}\n\n`;
  message += `${paper.summaryShort}\n\n`;
  
  if (paper.keywords.length > 0) {
    message += `🏷️ ${paper.keywords.join(', ')}\n`;
  }
  
  message += `\n🔗 [Read on ArXiv](${paper.url})`;
  
  return message;
}

function formatNewPapersMessage(papers: Paper[], count: number = 5): string {
  const header = `🧪 *JLMT Lab — New Research Papers*\n`;
  const subheader = `_Found ${papers.length} relevant papers_\n\n`;
  
  let message = header + subheader;
  
  const topPapers = papers.slice(0, count);
  for (const paper of topPapers) {
    message += formatPaperForTelegram(paper);
    message += '\n\n─────────────────────\n\n';
  }
  
  if (papers.length > count) {
    message += `_And ${papers.length - count} more..._`;
  }
  
  return message;
}

async function notifyNewPapers(papers: Paper[]): Promise<void> {
  const configPath = path.join(process.cwd(), '.env.json');
  
  let config: TelegramConfig | null = null;
  
  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(configData);
  } catch {
    console.log('Telegram config not found. Skipping notification.');
    return;
  }
  
  if (!config?.botToken || !config?.chatId) {
    console.log('Telegram credentials not configured. Skipping notification.');
    return;
  }
  
  const message = formatNewPapersMessage(papers);
  const success = await sendTelegramMessage(config, message);
  
  if (success) {
    console.log('Telegram notification sent!');
  } else {
    console.log('Failed to send Telegram notification.');
  }
}

async function testTelegramConnection(config: TelegramConfig): Promise<boolean> {
  const url = `${TELEGRAM_API}${config.botToken}/getMe`;
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    return result.ok;
  } catch {
    return false;
  }
}

async function main(action: string = 'notify') {
  const inputPath = path.join(process.cwd(), 'data', 'relevant-papers.json');
  
  if (action === 'notify') {
    const data = await fs.readFile(inputPath, 'utf-8');
    const { papers } = JSON.parse(data);
    await notifyNewPapers(papers);
  } else if (action === 'test') {
    const configPath = path.join(process.cwd(), '.env.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    if (await testTelegramConnection(config)) {
      console.log('✅ Telegram bot connection successful!');
    } else {
      console.log('❌ Telegram bot connection failed.');
    }
  }
}

export { 
  TelegramConfig, 
  Paper,
  sendTelegramMessage, 
  formatPaperForTelegram,
  formatNewPapersMessage,
  notifyNewPapers,
  testTelegramConnection,
  main 
};

if (require.main === module) {
  main(process.argv[2]).catch(console.error);
}
