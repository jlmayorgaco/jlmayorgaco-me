/**
 * Paper to Repository Linking
 * 
 * - Simple GitHub search
 * - Find repositories from paper content
 *
 * @module infrastructure/external/GitHubLinker
 */

import { logError, logInfo, logWarn } from '../logging/Logger';
import { withRetry, withTimeout } from '../../shared/utils';

export interface GitHubRepo {
  name: string;
  fullName: string;
  url: string;
  description: string;
  stars: number;
  language: string;
  topics: string[];
}

export interface RepoLinkResult {
  paperId: string;
  repos: GitHubRepo[];
}

const GITHUB_API = 'https://api.github.com';
const RATE_LIMIT_MS = 1000;
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

export class GitHubLinker {
  private lastRequestTime = 0;
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  async findReposForPaper(paper: {
    title: string;
    summary?: string;
    categories?: string[];
  }): Promise<GitHubRepo[]> {
    const keywords = this.extractKeywords(paper);
    
    if (keywords.length === 0) {
      return [];
    }

    const query = keywords.slice(0, 4).join(' ');
    return this.searchRepos(query);
  }

  private extractKeywords(paper: { title: string; summary?: string; categories?: string[] }): string[] {
    const text = `${paper.title} ${paper.summary || ''} ${(paper.categories || []).join(' ')}`;
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    const frameworks = [
      'ros', 'ros2', 'python', 'c++', 'matlab', 'tensorflow', 'pytorch',
      'esp32', 'arduino', 'fpga', 'verilog', 'vhdl', 'linux', 'kernel',
      'robotics', 'control', 'navigation', 'perception', 'planning',
    ];

    const techWords = words.filter(w => frameworks.some(f => w.includes(f) || f.includes(w)));
    const uniqueWords = [...new Set(techWords)];

    return uniqueWords.slice(0, 6);
  }

  async searchRepos(query: string, limit = 5): Promise<GitHubRepo[]> {
    const searchQuery = encodeURIComponent(`${query} language:python OR language:c++ OR language:matlab`);
    const url = `${GITHUB_API}/search/repositories?q=${searchQuery}&sort=stars&order=desc&per_page=${limit}`;

    try {
      const text = await withTimeout(
        () => this.fetchWithRetry(url),
        TIMEOUT_MS,
        'GitHub search timeout'
      );

      const data = JSON.parse(text);
      const items = data.items || [];

      return items.slice(0, limit).map((repo: any) => ({
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        description: repo.description || '',
        stars: repo.stargazers_count,
        language: repo.language || 'Unknown',
        topics: repo.topics?.slice(0, 5) || [],
      }));
    } catch (error) {
      logWarn('GitHub search failed', { query, error: (error as Error).message });
      return [];
    }
  }

  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async fetchWithRetry(url: string): Promise<string> {
    return withRetry(
      async () => {
        await this.applyRateLimit();

        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'JLMT-Bot/1.0',
        };

        if (this.token) {
          headers['Authorization'] = `token ${this.token}`;
        }

        const res = await fetch(url, { headers });

        if (res.status === 403) {
          const reset = res.headers.get('X-RateLimit-Reset');
          if (reset) {
            const waitTime = parseInt(reset, 10) * 1000 - Date.now();
            if (waitTime > 0) {
              await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 60000)));
              return this.fetchWithRetry(url);
            }
          }
        }

        if (!res.ok) {
          throw new Error(`GitHub API error: ${res.status}`);
        }

        return res.text();
      },
      {
        maxRetries: MAX_RETRIES,
        baseDelay: 500,
        onRetry: (error, attempt) => {
          logWarn(`Retrying GitHub request (attempt ${attempt})`, { error: error.message });
        },
      }
    )();
  }

  static formatForTelegram(repos: GitHubRepo[]): string {
    if (repos.length === 0) {
      return 'No related repositories found.';
    }

    let msg = `🔗 *Related Repos*\n\n`;

    for (const repo of repos.slice(0, 5)) {
      const lang = repo.language !== 'Unknown' ? `(${repo.language})` : '';
      msg += `*[${repo.name}](${repo.url})* ${lang}\n`;
      msg += `  ⭐ ${repo.stars} stars\n`;
      if (repo.description) {
        msg += `  _${repo.description.substring(0, 80)}..._\n`;
      }
      msg += '\n';
    }

    return msg;
  }
}
