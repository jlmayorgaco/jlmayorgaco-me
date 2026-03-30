/**
 * In-Memory Research Context Repository
 * For personal use - stores research interests and learns from interactions
 */

import { 
  IResearchContextRepository,
  ResearchContext,
  WeightedInterest,
  PaperInteraction,
  ContextUpdate
} from '../../application/ports/ResearchContextPort';
import { logDebug, logInfo } from '../../logger';

export class InMemoryResearchContextRepository implements IResearchContextRepository {
  private contexts = new Map<string, ResearchContext>();
  private interactions = new Map<string, PaperInteraction[]>();
  private interestWeights = new Map<string, Map<string, number>>();

  async getContext(userId: string): Promise<ResearchContext> {
    let context = this.contexts.get(userId);
    
    if (!context) {
      // Initialize with defaults
      context = {
        userId,
        researchAreas: [
          'distributed control systems',
          'robotics',
          'FPGA',
          'embedded systems',
          'machine learning',
        ],
        preferredTopics: [],
        avoidedTopics: [],
        preferredJournals: [],
        keyResearchers: [],
        methodologyPreferences: ['experimental', 'theoretical'],
        lastUpdated: new Date(),
      };
      this.contexts.set(userId, context);
    }
    
    return context;
  }

  async updateContext(userId: string, update: ContextUpdate): Promise<void> {
    const context = await this.getContext(userId);
    
    if (update.researchAreas) {
      context.researchAreas = update.researchAreas;
    }
    
    if (update.addTopics) {
      context.preferredTopics = [...new Set([...context.preferredTopics, ...update.addTopics])];
    }
    
    if (update.removeTopics) {
      context.preferredTopics = context.preferredTopics.filter(
        t => !update.removeTopics?.includes(t)
      );
    }
    
    if (update.addAvoidedTopics) {
      context.avoidedTopics = [...new Set([...context.avoidedTopics, ...update.addAvoidedTopics])];
    }
    
    if (update.addJournals) {
      context.preferredJournals = [...new Set([...context.preferredJournals, ...update.addJournals])];
    }
    
    if (update.addResearchers) {
      context.keyResearchers = [...new Set([...context.keyResearchers, ...update.addResearchers])];
    }
    
    context.lastUpdated = new Date();
    
    logInfo('Research context updated', { userId, update });
  }

  async getInterests(userId: string): Promise<WeightedInterest[]> {
    const weights = this.interestWeights.get(userId);
    
    if (!weights) {
      // Return default interests from context
      const context = await this.getContext(userId);
      return context.researchAreas.map(area => ({
        term: area,
        weight: 0.7,
        category: 'topic',
      }));
    }
    
    const interests: WeightedInterest[] = [];
    
    for (const [term, weight] of weights.entries()) {
      // Determine category based on term
      let category: WeightedInterest['category'] = 'topic';
      if (term.includes('@') || term.includes('university')) {
        category = 'author';
      } else if (term.includes('journal') || term.includes('transactions')) {
        category = 'journal';
      } else if (['algorithm', 'method', 'approach', 'technique'].some(m => term.includes(m))) {
        category = 'method';
      }
      
      interests.push({ term, weight, category });
    }
    
    // Sort by weight descending
    return interests.sort((a, b) => b.weight - a.weight);
  }

  async recordInteraction(userId: string, interaction: PaperInteraction): Promise<void> {
    if (!this.interactions.has(userId)) {
      this.interactions.set(userId, []);
    }
    
    const userInteractions = this.interactions.get(userId)!;
    userInteractions.push(interaction);
    
    // Update interest weights based on interaction
    await this.updateInterestWeights(userId, interaction);
    
    logDebug('Interaction recorded', { userId, action: interaction.action, paperId: interaction.paperId });
  }

  async getClassificationPrompt(userId: string): Promise<string> {
    const context = await this.getContext(userId);
    const interests = await this.getInterests(userId);
    
    // Build personalized prompt
    const prompt = `You are an expert research assistant specializing in:
${context.researchAreas.map(a => `- ${a}`).join('\n')}

Classification Criteria:
🔴 MUST READ: Directly relevant to your core research areas, introduces novel methods you can apply, or by key researchers
🟡 WORTH SCANNING: Related to your interests, good background/context, or interesting methodology
🟢 BACKGROUND: Peripheral interest, might provide context but not directly applicable
⚪ SKIP: Not relevant to your research focus

${context.preferredTopics.length > 0 ? `\nPreferred Topics: ${context.preferredTopics.join(', ')}` : ''}
${context.avoidedTopics.length > 0 ? `\nAvoid Topics: ${context.avoidedTopics.join(', ')}` : ''}

Top Research Interests (weighted):
${interests.slice(0, 10).map(i => `- ${i.term}: ${(i.weight * 100).toFixed(0)}%`).join('\n')}

For each paper, provide:
1. Relevance tier (MUST_READ/WORTH_SCANNING/BACKGROUND/SKIP)
2. Relevance score (0-100)
3. One-sentence summary
4. Reasoning for the tier
5. Key insights relevant to your research
6. Suggested action (e.g., "Read immediately", "Skim methods section", "Save for background", "Skip")`;

    return prompt;
  }

  private async updateInterestWeights(userId: string, interaction: PaperInteraction): Promise<void> {
    if (!this.interestWeights.has(userId)) {
      this.interestWeights.set(userId, new Map());
    }
    
    const weights = this.interestWeights.get(userId)!;
    
    // Weight adjustment based on action
    const weightAdjustments: Record<PaperInteraction['action'], number> = {
      'opened': 0.05,
      'read': 0.1,
      'saved': 0.2,
      'shared': 0.25,
      'cited': 0.3,
      'dismissed': -0.1,
    };
    
    const adjustment = weightAdjustments[interaction.action];
    
    // Extract terms from notes if available
    if (interaction.notes) {
      const terms = this.extractTerms(interaction.notes);
      
      for (const term of terms) {
        const current = weights.get(term) || 0.5;
        const updated = Math.max(0, Math.min(1, current + adjustment));
        weights.set(term, updated);
      }
    }
  }

  private extractTerms(text: string): string[] {
    // Extract meaningful terms (simplified)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !['this', 'that', 'with', 'from', 'they', 'have', 'were', 'been'].includes(w));
    
    return [...new Set(words)];
  }

  getLearningStats(userId: string): { interactions: number; topInterests: string[] } {
    const userInteractions = this.interactions.get(userId) || [];
    const weights = this.interestWeights.get(userId);
    
    const topInterests = weights 
      ? Array.from(weights.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([term]) => term)
      : [];
    
    return {
      interactions: userInteractions.length,
      topInterests,
    };
  }
}
