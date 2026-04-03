/**
 * Gap Detection Engine
 * 
 * Detects missing combinations:
 * - method + scenario
 * - metric + domain
 * - benchmark + condition
 *
 * @module application/services/GapDetector
 */

export interface Gap {
  type: 'method_scenario' | 'metric_domain' | 'benchmark_condition';
  combination: string;
  evidence: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface KnownCombinations {
  methods: string[];
  scenarios: string[];
  metrics: string[];
  domains: string[];
  benchmarks: string[];
  conditions: string[];
}

const COMMON_COMBINATIONS: KnownCombinations = {
  methods: [
    'Kalman filter', 'PID control', 'MPC', 'LQR', 'reinforcement learning',
    'deep learning', 'CNN', 'RNN', 'transformer', 'attention',
    'particle filter', 'SLAM', 'consensus', 'distributed control',
  ],
  scenarios: [
    'autonomous driving', 'robot manipulation', 'navigation', 'tracking',
    'power grid', 'industrial control', 'embedded systems', 'real-time',
    'low-power', 'high-latency', 'wireless', 'multi-agent',
  ],
  metrics: [
    'accuracy', 'precision', 'recall', 'F1', 'mAP', 'IoU',
    'latency', 'throughput', 'jitter', 'energy consumption',
    'convergence time', 'stability', 'robustness',
  ],
  domains: [
    'robotics', 'control', 'computer vision', 'NLP',
    'power systems', 'embedded', 'autonomous vehicles', 'IoT',
  ],
  benchmarks: [
    'ImageNet', 'COCO', 'KITTI', 'MuJoCo', 'Bullet', 'PyBullet',
    'MAVNet', 'CIFAR-10', 'WikiText', 'GLUE',
  ],
  conditions: [
    'low-light', 'occlusion', 'noise', 'disturbance',
    'real-time constraints', 'resource constraints', 'adversarial',
  ],
};

export class GapDetector {
  private known: KnownCombinations;

  constructor(custom?: Partial<KnownCombinations>) {
    this.known = { ...COMMON_COMBINATIONS, ...custom };
  }

  detectGaps(content: { methods?: string[]; metrics?: string[] }[]): Gap[] {
    const gaps: Gap[] = [];

    const methodsInContent = new Set<string>();
    const metricsInContent = new Set<string>();
    const domainsInContent = new Set<string>();
    const scenariosInContent = new Set<string>();

    for (const item of content) {
      if (item.methods) {
        for (const m of item.methods) {
          methodsInContent.add(m.toLowerCase());
        }
      }
      if (item.metrics) {
        for (const m of item.metrics) {
          metricsInContent.add(m.toLowerCase());
        }
      }
    }

    for (const method of this.known.methods) {
      if (!methodsInContent.has(method.toLowerCase())) {
        for (const scenario of this.known.scenarios) {
          if (Math.random() < 0.1) {
            gaps.push({
              type: 'method_scenario',
              combination: `${method} + ${scenario}`,
              evidence: [`${method} not applied to ${scenario} in current content`],
              priority: 'low',
            });
          }
        }
      }
    }

    for (const metric of this.known.metrics) {
      if (!metricsInContent.has(metric.toLowerCase())) {
        for (const domain of this.known.domains) {
          gaps.push({
            type: 'metric_domain',
            combination: `${metric} + ${domain}`,
            evidence: [`${metric} not evaluated for ${domain}`],
            priority: 'medium',
          });
        }
      }
    }

    return gaps.sort((a, b) => {
      const prio = { high: 0, medium: 1, low: 2 };
      return prio[a.priority] - prio[b.priority];
    }).slice(0, 10);
  }

  suggestResearchGaps(): Gap[] {
    const gaps: Gap[] = [];

    const combinations = [
      { method: 'reinforcement learning', scenario: 'safety-critical control', priority: 'high' as const },
      { method: 'Kalman filter', scenario: 'multi-robot coordination', priority: 'high' as const },
      { metric: 'energy consumption', domain: 'edge computing', priority: 'high' as const },
      { metric: 'robustness', domain: 'autonomous vehicles', priority: 'high' as const },
      { benchmark: 'real-world deployment', condition: 'adversarial conditions', priority: 'medium' as const },
    ];

    for (const c of combinations) {
      gaps.push({
        type: 'method_scenario',
        combination: `${c.method} + ${c.scenario}`,
        evidence: ['Research gap identified'],
        priority: c.priority,
      });
    }

    return gaps;
  }

  formatForTelegram(gaps: Gap[]): string {
    if (gaps.length === 0) {
      return '🎯 No significant research gaps identified.';
    }

    let msg = '🎯 *Research Gaps*\n\n';

    const high = gaps.filter(g => g.priority === 'high');
    const medium = gaps.filter(g => g.priority === 'medium');
    const low = gaps.filter(g => g.priority === 'low');

    if (high.length > 0) {
      msg += '*High Priority:*\n';
      msg += high.map(g => `  • ${g.combination}`).join('\n') + '\n\n';
    }

    if (medium.length > 0) {
      msg += '*Medium:*\n';
      msg += medium.slice(0, 3).map(g => `  • ${g.combination}`).join('\n') + '\n\n';
    }

    return msg;
  }
}
