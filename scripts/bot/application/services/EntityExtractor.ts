/**
 * Entity Extraction
 * 
 * Extract from content:
 * - methods
 * - tools
 * - metrics
 * - scenarios
 * - domains
 *
 * @module application/services/EntityExtractor
 */

export interface ExtractedEntity {
  type: 'method' | 'tool' | 'metric' | 'scenario' | 'domain';
  value: string;
  confidence: number;
  context: string;
}

const METHOD_PATTERNS = [
  'Kalman filter', 'PID control', 'MPC', 'LQR', 'reinforcement learning',
  'backpropagation', 'gradient descent', 'attention mechanism', 'transformer',
  'consensus', 'distributed control', 'particle filter', 'SLAM',
  'CNN', 'RNN', 'LSTM', 'GRU', 'embedding', 'attention',
  'SVM', 'random forest', 'gradient boosting', 'PCA', 'SVD',
];

const TOOL_PATTERNS = [
  'Python', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
  'ROS', 'ROS2', 'Gazebo', 'Matlab', 'Simulink',
  'Docker', 'Kubernetes', 'GitHub', 'GitLab', 'Jenkins',
  'ESP32', 'Arduino', 'Raspberry Pi', 'Jetson', 'FPGA',
  'Verilog', 'VHDL', 'Vivado', 'Quartus',
  'PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'RabbitMQ',
  'AWS', 'GCP', 'Azure', 'Terraform', 'Ansible',
];

const METRIC_PATTERNS = [
  'accuracy', 'precision', 'recall', 'F1 score', 'AUC-ROC',
  'mAP', 'IoU', 'PSNR', 'SSIM', 'MSE', 'RMSE', 'MAE',
  'latency', 'throughput', 'latency', 'jitter', 'packet loss',
  'MAPE', 'RMSE', 'convergence time', 'energy consumption',
];

const DOMAIN_PATTERNS = [
  'robotics', 'control systems', 'embedded systems', 'computer vision',
  'natural language processing', 'reinforcement learning', 'autonomous vehicles',
  'industrial IoT', 'smart grid', 'power electronics', 'signal processing',
  'distributed systems', 'edge computing', 'cloud computing',
  'machine learning', 'deep learning', 'optimization',
];

export class EntityExtractor {
  extract(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const lowerText = text.toLowerCase();

    for (const method of METHOD_PATTERNS) {
      if (lowerText.includes(method.toLowerCase())) {
        entities.push({
          type: 'method',
          value: method,
          confidence: 0.9,
          context: this.extractContext(text, method),
        });
      }
    }

    for (const tool of TOOL_PATTERNS) {
      if (lowerText.includes(tool.toLowerCase())) {
        entities.push({
          type: 'tool',
          value: tool,
          confidence: 0.85,
          context: this.extractContext(text, tool),
        });
      }
    }

    for (const metric of METRIC_PATTERNS) {
      if (lowerText.includes(metric.toLowerCase())) {
        entities.push({
          type: 'metric',
          value: metric,
          confidence: 0.8,
          context: this.extractContext(text, metric),
        });
      }
    }

    for (const domain of DOMAIN_PATTERNS) {
      if (lowerText.includes(domain.toLowerCase())) {
        entities.push({
          type: 'domain',
          value: domain,
          confidence: 0.75,
          context: this.extractContext(text, domain),
        });
      }
    }

    const scenarioPatterns = /scenario|use case|application|when (.*?) is used|condition/i;
    let match;
    while ((match = scenarioPatterns.exec(text)) !== null) {
      entities.push({
        type: 'scenario',
        value: match[0].substring(0, 100),
        confidence: 0.6,
        context: match[0],
      });
    }

    return this.deduplicate(entities);
  }

  private extractContext(text: string, term: string): string {
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return '';

    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + term.length + 30);
    return text.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  private deduplicate(entities: ExtractedEntity[]): ExtractedEntity[] {
    const seen = new Map<string, ExtractedEntity>();
    
    for (const entity of entities) {
      const key = `${entity.type}:${entity.value.toLowerCase()}`;
      if (!seen.has(key) || seen.get(key)!.confidence < entity.confidence) {
        seen.set(key, entity);
      }
    }

    return Array.from(seen.values());
  }

  extractByType(text: string, type: ExtractedEntity['type']): ExtractedEntity[] {
    return this.extract(text).filter(e => e.type === type);
  }

  formatForTelegram(entities: ExtractedEntity[]): string {
    if (entities.length === 0) {
      return 'No entities extracted.';
    }

    const byType = new Map<string, ExtractedEntity[]>();
    for (const e of entities) {
      const list = byType.get(e.type) || [];
      list.push(e);
      byType.set(e.type, list);
    }

    let msg = '*Extracted Entities*\n\n';

    const labels: Record<string, string> = {
      method: 'ðŸ”§ Methods',
      tool: 'ðŸ› ï¸ Tools',
      metric: 'ðŸ“Š Metrics',
      scenario: 'ðŸ“ Scenarios',
      domain: 'ðŸŒ Domains',
    };

    for (const [type, list] of byType.entries()) {
      msg += `${labels[type]}:\n`;
      msg += list.map(e => `  â€¢ ${e.value}`).join('\n');
      msg += '\n';
    }

    return msg;
  }
}

