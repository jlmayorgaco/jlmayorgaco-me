/**
 * GitHub/Code Intelligence
 * 
 * - Repo relevance scorer
 * - Paper-to-code linker
 * - Release watcher
 * - Repo quality analyzer
 * - Code-demo draft generator
 *
 * @module application/services/GitHubIntelligence
 */

import { logInfo, logWarn } from '../../infrastructure/logging/Logger';
import { GitHubLinker, type GitHubRepo } from '../../infrastructure/external/GitHubLinker';

export interface RepoScore {
  repo: GitHubRepo;
  technicalScore: number;
  relevanceScore: number;
  qualityScore: number;
  finalScore: number;
}

export interface PaperCodeLink {
  paperId: string;
  paperTitle: string;
  repo?: GitHubRepo;
  linkType: 'implements' | 'extends' | 'related' | 'none';
  confidence: number;
}

export interface ReleaseInfo {
  repoFullName: string;
  tag: string;
  date: string;
  notes: string;
}

export class RepoRelevanceScorer {
  private linker: GitHubLinker;

  constructor(token?: string) {
    this.linker = new GitHubLinker(token);
  }

  async scoreRepos(
    paper: { title: string; summary?: string; categories?: string[] },
    repos: GitHubRepo[]
  ): Promise<RepoScore[]> {
    const scored: RepoScore[] = [];

    for (const repo of repos) {
      const technicalScore = this.calculateTechnicalScore(repo);
      const relevanceScore = this.calculateRelevanceScore(repo, paper);
      const qualityScore = this.calculateQualityScore(repo);

      const finalScore = Math.round(
        technicalScore * 0.3 + relevanceScore * 0.4 + qualityScore * 0.3
      );

      scored.push({
        repo,
        technicalScore,
        relevanceScore,
        qualityScore,
        finalScore,
      });
    }

    return scored.sort((a, b) => b.finalScore - a.finalScore);
  }

  private calculateTechnicalScore(repo: GitHubRepo): number {
    let score = 50;

    if (repo.language && ['Python', 'Rust', 'Go', 'C++', 'TypeScript'].includes(repo.language)) {
      score += 20;
    }

    if (repo.topics && repo.topics.length > 3) {
      score += 15;
    }

    score += Math.min(15, Math.log10(repo.stars + 1) * 5);

    return Math.min(100, score);
  }

  private calculateRelevanceScore(repo: GitHubRepo, paper: { title: string; summary?: string }): number {
    const text = `${paper.title} ${paper.summary || ''}`.toLowerCase();
    const repoText = `${repo.name} ${repo.description} ${repo.topics?.join(' ')}`.toLowerCase();

    let score = 30;

    const keywords = text.split(/\s+/).filter(w => w.length > 4);
    let matches = 0;
    for (const kw of keywords.slice(0, 10)) {
      if (repoText.includes(kw)) matches++;
    }

    score += matches * 7;
    return Math.min(100, score);
  }

  private calculateQualityScore(repo: GitHubRepo): number {
    let score = 50;

    if (repo.description && repo.description.length > 50) {
      score += 15;
    }

    if (repo.stars > 100) score += 15;
    else if (repo.stars > 10) score += 10;

    return Math.min(100, score);
  }

  formatForTelegram(scored: RepoScore[]): string {
    if (scored.length === 0) {
      return 'No relevant repositories found.';
    }

    let msg = 'â­ *Top Repositories*\n\n';

    for (const s of scored.slice(0, 5)) {
      msg += `*[${s.repo.name}](${s.repo.url})* (${s.repo.language})\n`;
      msg += `  Score: ${s.finalScore}/100\n`;
      msg += `  â­ ${s.repo.stars} stars\n`;
      if (s.repo.description) {
        msg += `  _${s.repo.description.substring(0, 60)}..._\n`;
      }
      msg += '\n';
    }

    return msg;
  }
}

export class PaperCodeLinker {
  private linker: GitHubLinker;
  private scorer: RepoRelevanceScorer;

  constructor(token?: string) {
    this.linker = new GitHubLinker(token);
    this.scorer = new RepoRelevanceScorer(token);
  }

  async linkPaperToCode(
    paper: { id: string; title: string; summary?: string }
  ): Promise<PaperCodeLink> {
    const repos = await this.linker.findReposForPaper(paper);

    if (repos.length === 0) {
      return {
        paperId: paper.id,
        paperTitle: paper.title,
        linkType: 'none',
        confidence: 0,
      };
    }

    const scored = await this.scorer.scoreRepos(paper, repos);
    const best = scored[0];

    let linkType: PaperCodeLink['linkType'] = 'related';
    if (best.finalScore > 70) linkType = 'implements';
    else if (best.finalScore > 50) linkType = 'extends';

    return {
      paperId: paper.id,
      paperTitle: paper.title,
      repo: best.repo,
      linkType,
      confidence: best.finalScore,
    };
  }

  formatForTelegram(link: PaperCodeLink): string {
    if (link.linkType === 'none') {
      return `No code link found for: ${link.paperTitle}`;
    }

    const emoji = link.linkType === 'implements' ? 'ðŸ› ï¸' : link.linkType === 'extends' ? 'ðŸ“¦' : 'ðŸ”—';
    
    let msg = `${emoji} *Code Link*\n\n`;
    msg += `Paper: ${link.paperTitle}\n`;
    msg += `Link: ${link.linkType} (${link.confidence}% confidence)\n`;
    
    if (link.repo) {
      msg += `\n[*${link.repo.name}*](${link.repo.url})\n`;
      msg += `â­ ${link.repo.stars} stars | ${link.repo.language}`;
    }

    return msg;
  }
}

export class ReleaseWatcher {
  private watchedRepos: Set<string> = new Set();
  private releases: Map<string, ReleaseInfo[]> = new Map();

  watchRepo(fullName: string): void {
    this.watchedRepos.add(fullName);
  }

  unwatchRepo(fullName: string): void {
    this.watchedRepos.delete(fullName);
    this.releases.delete(fullName);
  }

  addRelease(info: ReleaseInfo): void {
    const existing = this.releases.get(info.repoFullName) || [];
    existing.unshift(info);
    this.releases.set(info.repoFullName, existing.slice(0, 10));
  }

  getRecentReleases(): ReleaseInfo[] {
    const all: ReleaseInfo[] = [];
    for (const releases of this.releases.values()) {
      all.push(...releases);
    }
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }

  getWatched(): string[] {
    return Array.from(this.watchedRepos);
  }
}

