/**
 * Auto-run daily digest with full error handling
 *
 * @module jobs/AutoDigest
 */

import { loadConfig } from '../config/index';
import { TelegramBot } from '../infrastructure/inbound/TelegramBot';
import { classifyAndSummarizePapers, generateBlogPost } from '../infrastructure/external/GeminiService';
import { scanNewsSources } from '../infrastructure/connectors/RssConnector';
import { saveBlogPost } from '../infrastructure/formatting/BlogGenerator';
import { validateGitSetup } from '../infrastructure/external/GitPublisher';
import { logError, logInfo } from '../infrastructure/logging/Logger';
import { runScanner } from '../../../src/lib/pipeline/arxiv-scanner';

async function autoDigest() {
  const startTime = Date.now();
  logInfo('Starting auto digest...');

  try {
    const config = await loadConfig();
    const bot = new TelegramBot(config);

    const gitStatus = await validateGitSetup();
    if (!gitStatus.valid) {
      logError('Git setup invalid', new Error(gitStatus.errors.join(', ')));
    }

    const connected = await bot.testConnection();
    if (!connected) {
      throw new Error('Cannot connect to Telegram');
    }

    // 1. Scan ArXiv
    logInfo('Scanning ArXiv...');
    const papers = await runScanner();
    const classified = await classifyAndSummarizePapers(config, papers.slice(0, 15));
    const topPapers = classified.filter(c => c.relevance === 'high').slice(0, 3);

    // 2. Scan News
    logInfo('Scanning news...');
    const news = await scanNewsSources(config);
    const topNews = news.slice(0, 5);

    // 3. Build digest
    const today = new Date().toISOString().split('T')[0];
    let digest = `*Daily Lab Digest \\- ${today}*\n\n`;

    if (topPapers.length > 0) {
      digest += `*TOP PAPERS:*\n\n`;
      for (const p of topPapers) {
        digest += `ðŸ“„ *${(p.summary || p.paperId).substring(0, 80)}*\n`;
        digest += `   ${(p.summary || 'No summary').substring(0, 150)}...\n\n`;
      }
    }

    if (topNews.length > 0) {
      digest += `*TOP NEWS:*\n\n`;
      for (const n of topNews.slice(0, 3)) {
        digest += `ðŸ“° *${n.source}*: ${n.title.substring(0, 60)}\n`;
        digest += `   ${(n.description || 'No description').substring(0, 100)}...\n\n`;
      }
    }

    digest += `\n_Reply with commentary to auto\\-generate a blog post_`;

    // 4. Send to Telegram
    await bot.sendMessage(digest);
    logInfo('Digest sent to Telegram');

    // 5. Auto-generate post if there's enough content
    if (topNews.length > 0 && topPapers.length > 0) {
      logInfo('Auto-generating blog post...');

      const combinedCommentary = topNews
        .map(n => `${n.title}: ${n.description || ''}`)
        .join('\n');

      const postData = await generateBlogPost(config, {
        title: 'auto',
        newsItems: [
          ...topPapers.map(p => p.summary || p.paperId),
          ...topNews.map(n => n.title),
        ],
        userComment: combinedCommentary,
        context: `Auto-generated daily digest. Topics: ${config.topics.join(', ')}`,
      });

      const post = {
        title: postData.title,
        description: postData.description,
        category: postData.category,
        tags: postData.tags,
        date: today,
        content: postData.content,
        featured: false,
      };

      const filePath = await saveBlogPost(post);
      logInfo('Draft saved', { path: filePath, title: post.title });

      await bot.sendMessage(
        `*Draft saved:* ${post.title}\n\n` + `Use /publish or reply to publish it.`,
      );
    }

    const duration = Date.now() - startTime;
    logInfo('Auto digest completed', { durationMs: duration });
  } catch (e: any) {
    logError('Auto digest failed', e);

    try {
      const config = await loadConfig();
      const bot = new TelegramBot(config);
      await bot.sendMessage(`âŒ Auto digest error: ${e.message?.substring(0, 200)}`);
    } catch (notifyError) {
      logError('Failed to send error notification', notifyError as Error);
    }

    process.exit(1);
  }
}

autoDigest();

