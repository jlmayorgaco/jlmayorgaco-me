/**
 * Gemini Service Adapter
 * Implements IGeminiService port using legacy gemini.ts
 */

import type { 
  IGeminiService, 
  PaperInput, 
  TieredClassification, 
  BlogPostInput, 
  GeneratedBlogPost,
  CircuitStatus 
} from '../../application/ports';
import type { Result } from '../../shared/Result';
import { logDebug, logError, logInfo } from '../../logger';

// Import legacy functions
import { 
  classifyPapers as legacyClassifyPapers, 
  generateBlogPost as legacyGenerateBlogPost 
} from '../../gemini';

export class GeminiServiceAdapter implements IGeminiService {
  private contextPrompt: string = '';

  async classifyPapers(
    papers: PaperInput[]
  ): Promise<Result<TieredClassification[], Error>> {
    try {
      logDebug('Classifying papers via Gemini', { count: papers.length });

      // Call legacy function
      const result = await legacyClassifyPapers(papers as any);

      if (!result.success) {
        return result as any;
      }

      // Transform to tiered classification
      const classified = result.data || [];
      const tiered: TieredClassification[] = classified.map((c: any) => ({
        paperId: c.paperId,
        tier: this.mapRelevanceToTier(c.relevance),
        relevanceScore: this.calculateScore(c.relevance),
        summary: c.summary || '',
        reasoning: c.classification || '',
        keyInsights: [],
        suggestedAction: this.getSuggestedAction(c.relevance),
      }));

      return { success: true, data: tiered } as any;

    } catch (error) {
      logError('Gemini classifyPapers failed', error as Error);
      return { 
        success: false, 
        error: error as Error 
      } as any;
    }
  }

  async generateBlogPost(
    input: BlogPostInput
  ): Promise<Result<GeneratedBlogPost, Error>> {
    try {
      logDebug('Generating blog post via Gemini', { 
        title: input.title 
      });

      const result = await legacyGenerateBlogPost(
        {} as any, // config - will use global
        input
      );

      return result as any;

    } catch (error) {
      logError('Gemini generateBlogPost failed', error as Error);
      return { 
        success: false, 
        error: error as Error 
      } as any;
    }
  }

  getCircuitStatus(): CircuitStatus {
    // Return default status
    return {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: undefined,
    };
  }

  setContextPrompt(prompt: string): void {
    this.contextPrompt = prompt;
  }

  private mapRelevanceToTier(
    relevance: string
  ): 'must_read' | 'worth_scanning' | 'background' | 'skip' {
    const map: Record<string, any> = {
      'high': 'must_read',
      'medium': 'worth_scanning',
      'low': 'background',
    };
    return map[relevance] || 'background';
  }

  private calculateScore(relevance: string): number {
    const map: Record<string, number> = {
      'high': 90,
      'medium': 70,
      'low': 50,
    };
    return map[relevance] || 50;
  }

  private getSuggestedAction(relevance: string): string {
    const map: Record<string, string> = {
      'high': 'Read immediately',
      'medium': 'Skim methods section',
      'low': 'Save for background',
    };
    return map[relevance] || 'Review when available';
  }
}
