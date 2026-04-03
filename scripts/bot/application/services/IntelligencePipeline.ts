/**
 * Intelligence Pipeline
 * 
 * - Classification: categories (control, ML, distributed, robotics, etc.)
 * - Summary: short technical summary
 * - Reviewer2 Critique: limitations, validations, assumptions
 * - Insight Generator: main insight, why it matters
 * - Engineering Analyzer: how it's implemented, production problems, architecture
 *
 * @module application/services/IntelligencePipeline
 */

import type { BotConfig } from '../../config/index';
import { callGemini } from '../../infrastructure/external/GeminiService';
import type { ScoringInput, ScoreResult } from '../../domain/services/RankingSystem';

export interface ClassificationResult {
  categories: string[];
  primary: string;
  confidence: number;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

export interface CritiqueResult {
  limitations: string[];
  validationGaps: string[];
  assumptions: string[];
  strength: string;
}

export interface InsightResult {
  mainInsight: string;
  whyItMatters: string;
  targetAudience: string;
}

export interface EngineeringAnalysis {
  implementation: string;
  productionIssues: string[];
  architecture: string;
  technologies: string[];
}

export interface IntelligenceOutput {
  classification: ClassificationResult;
  summary: SummaryResult;
  critique: CritiqueResult;
  insight: InsightResult;
  engineering: EngineeringAnalysis;
  scores: ScoreResult;
}

const CATEGORIES = [
  'control-systems',
  'machine-learning',
  'distributed-systems',
  'robotics',
  'embedded-systems',
  'signal-processing',
  'power-systems',
  'computer-vision',
  'natural-language-processing',
  'hardware',
  'software-engineering',
  'data-science',
];

export class IntelligencePipeline {
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  async process(input: ScoringInput): Promise<IntelligenceOutput> {
    const classification = await this.classify(input);
    const summary = await this.summarize(input);
    const critique = await this.critique(input);
    const insight = await this.generateInsight(input, classification);
    const engineering = await this.analyzeEngineering(input);

    return {
      classification,
      summary,
      critique,
      insight,
      engineering,
      scores: {
        research: 0,
        engineering: 0,
        credibility: 0,
        composite: 0,
        contentType: 'hybrid',
        breakdown: {
          novelty: 0,
          topicRelevance: 0,
          technicalDepth: 0,
          implementation: 0,
          architecture: 0,
          production: 0,
        },
      },
    };
  }

  async classify(input: ScoringInput): Promise<ClassificationResult> {
    const prompt = `Classify this paper into categories from this list:
${CATEGORIES.join(', ')}

Title: ${input.title}
Description: ${input.description?.substring(0, 500) || 'N/A'}
Categories: ${input.categories?.join(', ') || 'N/A'}

Return JSON with:
- categories: array of matched categories (max 3)
- primary: main category
- confidence: 0-1 score`;

    try {
      const response = await callGemini(this.config, prompt);
      const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

      return {
        categories: parsed.categories || [],
        primary: parsed.primary || 'unknown',
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      return this.classifyLocally(input);
    }
  }

  private classifyLocally(input: ScoringInput): ClassificationResult {
    const text = `${input.title} ${input.description || ''} ${(input.categories || []).join(' ')}`.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'control-systems': ['control', 'PID', 'MPC', 'LQR', 'Lyapunov', 'stability', 'feedback'],
      'machine-learning': ['machine learning', 'neural', 'deep learning', 'transformer', 'classifier'],
      'distributed-systems': ['distributed', 'consensus', 'multi-agent', 'decentralized', 'coordination'],
      'robotics': ['robot', 'manipulator', 'autonomous', 'motion', 'trajectory'],
      'embedded-systems': ['embedded', 'firmware', 'RTOS', 'microcontroller', 'ESP32'],
      'signal-processing': ['signal', 'filter', 'estimation', 'Kalman', 'DSP', 'spectral'],
      'power-systems': ['power', 'inverter', 'converter', 'grid', 'energy', 'motor'],
      'computer-vision': ['vision', 'image', 'object detection', 'segmentation', 'CNN'],
      'hardware': ['FPGA', 'verilog', 'vhdl', 'hardware', 'asic', 'circuit'],
    };

    const matches: Array<{ category: string; score: number }> = [];

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      if (score > 0) {
        matches.push({ category, score });
      }
    }

    matches.sort((a, b) => b.score - a.score);

    return {
      categories: matches.slice(0, 3).map(m => m.category),
      primary: matches[0]?.category || 'unknown',
      confidence: matches.length > 0 ? Math.min(1, matches[0].score / 2) : 0.3,
    };
  }

  async summarize(input: ScoringInput): Promise<SummaryResult> {
    const prompt = `Provide a short technical summary of this paper (2-3 sentences max).

Title: ${input.title}
Abstract: ${input.description?.substring(0, 1000) || 'N/A'}

Requirements:
- Be specific, not generic
- Focus on what was done, not just "proposed a method"
- Include technical details when available
- No marketing language

Return JSON with:
- summary: 2-3 sentence technical summary
- keyPoints: array of 3 specific findings`;

    try {
      const response = await callGemini(this.config, prompt);
      const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

      return {
        summary: parsed.summary || '',
        keyPoints: parsed.keyPoints || [],
      };
    } catch {
      return {
        summary: input.description?.substring(0, 200) || 'No summary available',
        keyPoints: [],
      };
    }
  }

  async critique(input: ScoringInput): Promise<CritiqueResult> {
    const prompt = `Analyze this paper critically. Identify weaknesses and gaps.

Title: ${input.title}
Abstract: ${input.description?.substring(0, 1000) || 'N/A'}

Return JSON with:
- limitations: array of key limitations (max 3)
- validationGaps: what's not validated
- assumptions: unstated assumptions
- strength: one strength`;

    try {
      const response = await callGemini(this.config, prompt);
      const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

      return {
        limitations: parsed.limitations || [],
        validationGaps: parsed.validationGaps || [],
        assumptions: parsed.assumptions || [],
        strength: parsed.strength || 'Unknown',
      };
    } catch {
      return {
        limitations: ['Unable to analyze'],
        validationGaps: [],
        assumptions: [],
        strength: 'Unknown',
      };
    }
  }

  async generateInsight(input: ScoringInput, classification: ClassificationResult): Promise<InsightResult> {
    const prompt = `Generate insight about this research.

Title: ${input.title}
Category: ${classification.primary}
Summary: ${input.description?.substring(0, 500) || 'N/A'}

Return JSON with:
- mainInsight: one sentence insight about why this matters
- whyItMatters: 1-2 sentences on significance
- targetAudience: who would care about this`;

    try {
      const response = await callGemini(this.config, prompt);
      const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

      return {
        mainInsight: parsed.mainInsight || '',
        whyItMatters: parsed.whyItMatters || '',
        targetAudience: parsed.targetAudience || '',
      };
    } catch {
      return {
        mainInsight: 'Novel research in ' + classification.primary,
        whyItMatters: 'This advances the field of ' + classification.primary,
        targetAudience: 'Researchers and engineers in ' + classification.primary,
      };
    }
  }

  async analyzeEngineering(input: ScoringInput): Promise<EngineeringAnalysis> {
    const prompt = `Extract engineering details from this paper.

Title: ${input.title}
Description: ${input.description?.substring(0, 1000) || 'N/A'}

Return JSON with:
- implementation: how it's implemented (hardware/software)
- productionIssues: potential production problems (max 2)
- architecture: system architecture if described
- technologies: technologies/frameworks used (array)`;

    try {
      const response = await callGemini(this.config, prompt);
      const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

      return {
        implementation: parsed.implementation || '',
        productionIssues: parsed.productionIssues || [],
        architecture: parsed.architecture || '',
        technologies: parsed.technologies || [],
      };
    } catch {
      return {
        implementation: 'Implementation details not available',
        productionIssues: [],
        architecture: '',
        technologies: [],
      };
    }
  }
}
