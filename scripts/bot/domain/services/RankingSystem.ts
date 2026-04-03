/**
 * Ranking System - Intelligent Scoring
 * 
 * - ResearchScore: novelty, topic relevance, technical depth
 * - EngineeringScore: realistic implementation, architecture, production
 * - SourceCredibility: configurable weights by source
 * - CompositeScore: combines all scores
 * - ContentType classifier: research/engineering/hybrid/noise
 *
 * @module domain/services/RankingSystem
 */

export interface ScoringInput {
  title: string;
  description?: string;
  source: string;
  categories?: string[];
  metadata?: Record<string, unknown>;
  openAlexData?: {
    citationCount?: number;
    concepts?: Array<{ displayName: string; score: number }>;
    authors?: Array<{ worksCount: number; citedByCount: number }>;
  };
}

export interface ScoreResult {
  research: number;
  engineering: number;
  credibility: number;
  composite: number;
  contentType: 'research' | 'engineering' | 'hybrid' | 'noise';
  breakdown: {
    novelty: number;
    topicRelevance: number;
    technicalDepth: number;
    implementation: number;
    architecture: number;
    production: number;
  };
}

const TOPIC_KEYWORDS = {
  control: ['control', 'control theory', 'PID', 'MPC', 'LQR', 'Lyapunov', 'stability'],
  ml: ['machine learning', 'neural', 'deep learning', 'transformer', 'LLM', 'reinforcement', 'RL'],
  distributed: ['distributed', 'consensus', 'multi-agent', 'decentralized', 'coordination'],
  robotics: ['robotics', 'robot', 'manipulator', 'autonomous', 'motion planning'],
  fpga: ['FPGA', 'verilog', 'vhdl', 'hardware', 'asic', 'soc'],
  embedded: ['embedded', 'firmware', 'RTOS', 'microcontroller', 'ESP32', 'arduino'],
  power: ['power', 'inverter', 'converter', 'grid', 'energy', 'motor', 'drive'],
  signal: ['signal', 'filter', 'estimation', 'Kalman', 'DSP', 'spectral'],
};

const TECH_IMPLEMENTATION_KEYWORDS = [
  'implementation', 'implemented', 'prototype', 'prototype', 'deployed', 'production',
  'system', 'architecture', 'framework', 'platform', 'infrastructure',
  'real-time', 'low-latency', 'high-performance', 'optimized',
  'hardware', 'software', 'firmware', 'embedded',
];

const RESEARCH_KEYWORDS = [
  'theory', 'theoretical', 'analysis', 'model', 'algorithm', 'approach',
  'method', 'proposed', 'novel', 'new', 'performance evaluation',
];

export class ResearchScore {
  static calculate(input: ScoringInput): number {
    const novelty = this.calculateNovelty(input);
    const topicRelevance = this.calculateTopicRelevance(input);
    const technicalDepth = this.calculateTechnicalDepth(input);

    return (novelty * 0.3 + topicRelevance * 0.4 + technicalDepth * 0.3);
  }

  private static calculateNovelty(input: ScoringInput): number {
    const title = input.title.toLowerCase();
    const hasNovelty = title.includes('novel') || title.includes('new') || 
      title.includes('proposed') || title.includes('first');
    
    let score = 0.3;
    if (hasNovelty) score += 0.2;

    if (input.openAlexData?.citationCount) {
      const citations = input.openAlexData.citationCount;
      if (citations < 10) score += 0.3;
      else if (citations < 50) score += 0.2;
      else if (citations < 100) score += 0.1;
    }

    return Math.min(1, score);
  }

  private static calculateTopicRelevance(input: ScoringInput): number {
    const text = `${input.title} ${input.description || ''} ${(input.categories || []).join(' ')}`.toLowerCase();
    
    let matches = 0;
    for (const [, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          matches++;
        }
      }
    }

    return Math.min(1, matches / 3);
  }

  private static calculateTechnicalDepth(input: ScoringInput): number {
    const text = `${input.title} ${input.description || ''}`.toLowerCase();
    
    let depthScore = 0;
    
    const hasMath = /equation|formula|theorem|proof|analysis/i.test(text);
    if (hasMath) depthScore += 0.3;

    const hasDetailedAbstract = input.description && input.description.length > 300;
    if (hasDetailedAbstract) depthScore += 0.2;

    if (input.openAlexData?.concepts) {
      depthScore += Math.min(0.3, input.openAlexData.concepts.length * 0.05);
    }

    return Math.min(1, depthScore);
  }

  static getBreakdown(input: ScoringInput) {
    return {
      novelty: this.calculateNovelty(input),
      topicRelevance: this.calculateTopicRelevance(input),
      technicalDepth: this.calculateTechnicalDepth(input),
    };
  }
}

export class EngineeringScore {
  static calculate(input: ScoringInput): number {
    const implementation = this.calculateImplementation(input);
    const architecture = this.calculateArchitecture(input);
    const production = this.calculateProduction(input);

    return (implementation * 0.3 + architecture * 0.3 + production * 0.4);
  }

  private static calculateImplementation(input: ScoringInput): number {
    const text = `${input.title} ${input.description || ''}`.toLowerCase();
    
    let matches = 0;
    for (const kw of TECH_IMPLEMENTATION_KEYWORDS) {
      if (text.includes(kw)) {
        matches++;
      }
    }

    return Math.min(1, matches / 3);
  }

  private static calculateArchitecture(input: ScoringInput): number {
    const title = input.title.toLowerCase();
    
    const hasArch = title.includes('system') || title.includes('architecture') || 
      title.includes('framework') || title.includes('platform');
    
    let score = hasArch ? 0.4 : 0.1;

    const hasDetailedDesc = input.description && input.description.length > 200;
    if (hasDetailedDesc) score += 0.3;

    if (input.metadata?.domain) score += 0.2;

    return Math.min(1, score);
  }

  private static calculateProduction(input: ScoringInput): number {
    const title = input.title.toLowerCase();
    const desc = input.description?.toLowerCase() || '';
    
    let score = 0.1;

    const productionTerms = ['production', 'deployed', 'real-world', 'industrial', 'commercial'];
    for (const term of productionTerms) {
      if (title.includes(term) || desc.includes(term)) {
        score += 0.2;
      }
    }

    const codeTerms = ['code', 'github', 'implementation', 'library', 'api'];
    for (const term of codeTerms) {
      if (title.includes(term) || desc.includes(term)) {
        score += 0.15;
      }
    }

    return Math.min(1, score);
  }

  static getBreakdown(input: ScoringInput) {
    return {
      implementation: this.calculateImplementation(input),
      architecture: this.calculateArchitecture(input),
      production: this.calculateProduction(input),
    };
  }
}

export class SourceCredibility {
  private static WEIGHTS: Record<string, number> = {
    'ArXiv': 0.9,
    'IEEE': 0.95,
    'ACM': 0.95,
    'Springer': 0.85,
    'Elsevier': 0.85,
    'nature': 0.9,
    'science': 0.9,
    'HackerNews': 0.5,
    'Reddit': 0.4,
    'default': 0.6,
  };

  static calculate(source: string, metadata?: Record<string, unknown>): number {
    const sourceName = source.toLowerCase();
    
    for (const [key, weight] of Object.entries(this.WEIGHTS)) {
      if (sourceName.includes(key.toLowerCase())) {
        let score = weight;
        
        if (metadata?.score && typeof metadata.score === 'number') {
          const engagementScore = Math.min(1, metadata.score / 100);
          score = score * 0.7 + engagementScore * 0.3;
        }
        
        return score;
      }
    }

    return this.WEIGHTS.default;
  }

  static setWeight(source: string, weight: number): void {
    this.WEIGHTS[source] = weight;
  }
}

export class CompositeScore {
  static calculate(
    input: ScoringInput,
    weights: { research?: number; engineering?: number; credibility?: number } = {}
  ): ScoreResult {
    const researchWeight = weights.research ?? 0.35;
    const engineeringWeight = weights.engineering ?? 0.35;
    const credibilityWeight = weights.credibility ?? 0.3;

    const researchScore = ResearchScore.calculate(input);
    const engineeringScore = EngineeringScore.calculate(input);
    const credibilityScore = SourceCredibility.calculate(input.source, input.metadata);

    const composite = 
      researchScore * researchWeight +
      engineeringScore * engineeringWeight +
      credibilityScore * credibilityWeight;

    const contentType = this.classifyContentType(input, researchScore, engineeringScore);

    return {
      research: researchScore,
      engineering: engineeringScore,
      credibility: credibilityScore,
      composite,
      contentType,
      breakdown: {
        ...ResearchScore.getBreakdown(input),
        ...EngineeringScore.getBreakdown(input),
      },
    };
  }

  static classifyContentType(
    input: ScoringInput,
    researchScore: number,
    engineeringScore: number
  ): 'research' | 'engineering' | 'hybrid' | 'noise' {
    if (researchScore > 0.5 && engineeringScore < 0.3) {
      return 'research';
    }
    
    if (engineeringScore > 0.5 && researchScore < 0.3) {
      return 'engineering';
    }
    
    if (researchScore > 0.3 && engineeringScore > 0.3) {
      return 'hybrid';
    }

    if (researchScore < 0.2 && engineeringScore < 0.2) {
      return 'noise';
    }

    return 'hybrid';
  }
}
