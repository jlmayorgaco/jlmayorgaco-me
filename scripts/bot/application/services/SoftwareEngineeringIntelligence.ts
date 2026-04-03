/**
 * Software Engineering Intelligence
 * 
 * - Architecture lens generator
 * - Production risk analyzer
 * - System design snippets
 * - Implementation complexity
 * - Theory vs production comparator
 *
 * @module application/services/SoftwareEngineeringIntelligence
 */

export interface ArchitectureAnalysis {
  services: string[];
  dataFlow: string[];
  constraints: string[];
  deployment: string[];
}

export interface RiskAssessment {
  latency: { score: number; concerns: string[] };
  scale: { score: number; concerns: string[] };
  ops: { score: number; concerns: string[] };
  reliability: { score: number; concerns: string[] };
  overall: number;
}

export interface ComplexityScore {
  total: number;
  architecture: number;
  integration: number;
  testing: number;
  deployment: number;
}

export class ArchitectureLens {
  analyze(input: { title: string; description: string }): ArchitectureAnalysis {
    const text = `${input.title} ${input.description}`.toLowerCase();

    const services = this.extractServices(text);
    const dataFlow = this.extractDataFlow(text);
    const constraints = this.extractConstraints(text);
    const deployment = this.extractDeployment(text);

    return { services, dataFlow, constraints, deployment };
  }

  private extractServices(text: string): string[] {
    const patterns = [
      /(?:microservice|service|API|gateway|broker|queue|server|client)/gi,
    ];

    const found = new Set<string>();
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const m of matches) {
          found.add(m);
        }
      }
    }

    return Array.from(found).slice(0, 5);
  }

  private extractDataFlow(text: string): string[] {
    const flow: string[] = [];

    if (text.includes('input') || text.includes('sensor') || text.includes('data')) {
      flow.push('data ingestion');
    }
    if (text.includes('process') || text.includes('compute') || text.includes('model')) {
      flow.push('processing');
    }
    if (text.includes('output') || text.includes('actuator') || text.includes('display')) {
      flow.push('output');
    }
    if (text.includes('store') || text.includes('database') || text.includes('cache')) {
      flow.push('storage');
    }

    return flow;
  }

  private extractConstraints(text: string): string[] {
    const constraints: string[] = [];

    if (text.includes('real-time') || text.includes('latency')) {
      constraints.push('real-time constraint');
    }
    if (text.includes('scalable') || text.includes('scale')) {
      constraints.push('scalability');
    }
    if (text.includes('embedded') || text.includes('resource')) {
      constraints.push('resource constrained');
    }
    if (text.includes('distributed') || text.includes('decentralized')) {
      constraints.push('distributed system');
    }

    return constraints;
  }

  private extractDeployment(text: string): string[] {
    const deployment: string[] = [];

    if (text.includes('cloud') || text.includes('aws') || text.includes('gcp')) {
      deployment.push('cloud deployment');
    }
    if (text.includes('edge') || text.includes('device') || text.includes('embedded')) {
      deployment.push('edge deployment');
    }
    if (text.includes('container') || text.includes('docker') || text.includes('k8s')) {
      deployment.push('containerized');
    }

    return deployment;
  }

  formatForTelegram(analysis: ArchitectureAnalysis): string {
    let msg = '🏗️ *Architecture Analysis*\n\n';

    if (analysis.services.length > 0) {
      msg += `*Services:* ${analysis.services.join(', ')}\n`;
    }
    if (analysis.dataFlow.length > 0) {
      msg += `*Data Flow:* ${analysis.dataFlow.join(' → ')}\n`;
    }
    if (analysis.constraints.length > 0) {
      msg += `*Constraints:* ${analysis.constraints.join(', ')}\n`;
    }
    if (analysis.deployment.length > 0) {
      msg += `*Deployment:* ${analysis.deployment.join(', ')}\n`;
    }

    return msg;
  }
}

export class ProductionRiskAnalyzer {
  analyze(input: { title: string; description: string }): RiskAssessment {
    const text = `${input.title} ${input.description}`.toLowerCase();

    const latency = this.analyzeLatency(text);
    const scale = this.analyzeScale(text);
    const ops = this.analyzeOps(text);
    const reliability = this.analyzeReliability(text);

    const overall = Math.round((latency.score + scale.score + ops.score + reliability.score) / 4);

    return { latency, scale, ops, reliability, overall };
  }

  private analyzeLatency(text: string): { score: number; concerns: string[] } {
    const concerns: string[] = [];
    let score = 50;

    if (text.includes('real-time') || text.includes('low-latency')) {
      concerns.push('Requires low latency');
      score += 20;
    }
    if (text.includes('video') || text.includes('stream')) {
      concerns.push('High bandwidth needs');
      score += 15;
    }
    if (text.includes('distributed') || text.includes('network')) {
      concerns.push('Network dependency');
      score += 10;
    }

    return { score: Math.min(100, score), concerns };
  }

  private analyzeScale(text: string): { score: number; concerns: string[] } {
    const concerns: string[] = [];
    let score = 50;

    if (text.includes('scalable') || text.includes('million')) {
      concerns.push('Scale requirements unclear');
      score += 15;
    }
    if (text.includes('concurrent') || text.includes('parallel')) {
      concerns.push('Concurrency handling needed');
      score += 10;
    }

    return { score: Math.min(100, score), concerns };
  }

  private analyzeOps(text: string): { score: number; concerns: string[] } {
    const concerns: string[] = [];
    let score = 50;

    if (text.includes('monitor') || text.includes('observe')) {
      concerns.push('Monitoring needs');
      score += 10;
    }
    if (text.includes('fail') || text.includes('recover')) {
      concerns.push('Recovery procedures');
      score += 15;
    }

    return { score: Math.min(100, score), concerns };
  }

  private analyzeReliability(text: string): { score: number; concerns: string[] } {
    const concerns: string[] = [];
    let score = 50;

    if (text.includes('safety') || text.includes('critical')) {
      concerns.push('Safety critical');
      score += 25;
    }
    if (text.includes('data') || text.includes('privacy')) {
      concerns.push('Data handling');
      score += 15;
    }

    return { score: Math.min(100, score), concerns };
  }
}

export class ImplementationComplexity {
  estimate(input: { title: string; description: string }): ComplexityScore {
    const text = `${input.title} ${input.description}`.toLowerCase();

    return {
      architecture: this.scoreArchitecture(text),
      integration: this.scoreIntegration(text),
      testing: this.scoreTesting(text),
      deployment: this.scoreDeployment(text),
      total: 0,
    };
  }

  private scoreArchitecture(text: string): number {
    let score = 30;
    if (text.includes('distributed')) score += 20;
    if (text.includes('microservice')) score += 15;
    if (text.includes('real-time')) score += 15;
    return Math.min(100, score);
  }

  private scoreIntegration(text: string): number {
    let score = 30;
    if (text.includes('API') || text.includes('interface')) score += 15;
    if (text.includes('hardware') || text.includes('sensor')) score += 20;
    return Math.min(100, score);
  }

  private scoreTesting(text: string): number {
    let score = 30;
    if (text.includes('simulation')) score += 20;
    if (text.includes('benchmark')) score += 15;
    if (text.includes('validation')) score += 15;
    return Math.min(100, score);
  }

  private scoreDeployment(text: string): number {
    let score = 30;
    if (text.includes('embedded')) score += 20;
    if (text.includes('edge')) score += 15;
    if (text.includes('cloud')) score += 10;
    return Math.min(100, score);
  }
}
