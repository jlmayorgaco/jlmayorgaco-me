/**
 * Dashboard Registry
 * Central registry for all Data Lab dashboard modules
 */

import type { DashboardModule, Preset, Dataset } from './types';

export const DASHBOARDS: DashboardModule[] = [
  {
    id: 'openfreqbench',
    slug: 'openfreqbench',
    title: 'OpenFreqBench',
    subtitle: 'Signal Analysis Workbench',
    description: 'Frequency estimation and signal analysis for power systems. Analyze PMU data, detect disturbances, and compare estimation algorithms.',
    category: 'signals',
    accent: '#3fb9a7',
    icon: 'waveform',
    tags: ['signals', 'frequency', 'pmu', 'estimation', 'power-systems'],
    defaultDataset: 'synthetic-grid',
    supportedViews: ['signal', 'table', 'split'],
    status: 'ready',
    component: 'OpenFreqBenchModule',
  },
  {
    id: 'swarm-lab',
    slug: 'swarm-lab',
    title: 'Swarm Lab',
    subtitle: 'Multi-Agent Systems',
    description: 'Visualize multi-agent coordination, consensus algorithms, and network topology in real-time. Explore formation control and graph dynamics.',
    category: 'networks',
    accent: '#50c878',
    icon: 'network',
    tags: ['swarm', 'mas', 'consensus', 'graphs', 'coordination'],
    defaultDataset: 'hex-formation',
    supportedViews: ['network', 'table'],
    status: 'ready',
    component: 'SwarmLabModule',
  },
  {
    id: 'control-workbench',
    slug: 'control',
    title: 'Control Workbench',
    subtitle: 'System Analysis & Design',
    description: 'Control system design and analysis. Step responses, controller tuning, stability margins, and comparative analysis.',
    category: 'control',
    accent: '#d29922',
    icon: 'control',
    tags: ['control', 'lqr', 'mpc', 'tuning', 'response'],
    defaultDataset: 'second-order',
    supportedViews: ['control', 'table'],
    status: 'ready',
    component: 'ControlWorkbenchModule',
  },
  {
    id: 'fpga-pipeline',
    slug: 'fpga-pipeline',
    title: 'FPGA Pipeline',
    subtitle: 'Hardware Architecture',
    description: 'FPGA dataflow visualization and pipeline analysis. Signal processing blocks, routing, latency, and resource utilization.',
    category: 'fpga',
    accent: '#b8956a',
    icon: 'chip',
    tags: ['fpga', 'verilog', 'pipeline', 'dsp', 'hardware'],
    defaultDataset: 'kalman-pipeline',
    supportedViews: ['pipeline', 'table'],
    status: 'ready',
    component: 'FpgaPipelineModule',
  },
];

export const PRESETS: Preset[] = [
  {
    id: 'low-inertia-scenario',
    name: 'Low Inertia Grid',
    description: 'High renewable penetration scenario',
    moduleId: 'openfreqbench',
    parameters: { penetration: 0.3, inertia: 2.4 },
  },
  {
    id: 'high-noise',
    name: 'High Noise',
    description: 'SNR 20dB measurement noise',
    moduleId: 'openfreqbench',
    parameters: { snr: 20, harmonics: true },
  },
  {
    id: 'hex-formation',
    name: 'Hexagonal Formation',
    description: '6-agent hexagon topology',
    moduleId: 'swarm-lab',
    parameters: { agents: 6, topology: 'hexagon' },
  },
  {
    id: 'consensus-demo',
    name: 'Consensus Demo',
    description: 'Average consensus with ring graph',
    moduleId: 'swarm-lab',
    parameters: { algorithm: 'gossip', graph: 'ring' },
  },
  {
    id: 'pid-tuning',
    name: 'PID Tuning',
    description: 'Interactive PID controller',
    moduleId: 'control-workbench',
    parameters: { controller: 'pid', kp: 1, ki: 0.1, kd: 0.01 },
  },
  {
    id: 'lqr-design',
    name: 'LQR Design',
    description: 'Linear quadratic regulator',
    moduleId: 'control-workbench',
    parameters: { controller: 'lqr', q: 10, r: 1 },
  },
];

export const DATASETS: Dataset[] = [
  {
    id: 'synthetic-grid',
    name: 'Synthetic Grid Data',
    description: 'Simulated power system frequency data',
    type: 'signal',
    size: 2457600,
    records: 614400,
    format: 'CSV',
  },
  {
    id: 'pmu-real',
    name: 'PMU Real Data',
    description: 'Real PMU measurements from grid',
    type: 'signal',
    size: 8192000,
    records: 2048000,
    format: 'HDF5',
  },
  {
    id: 'hex-formation',
    name: 'Hex Formation',
    description: '6-agent hexagonal swarm data',
    type: 'network',
    size: 512000,
    records: 1000,
    format: 'JSON',
  },
  {
    id: 'random-graph',
    name: 'Random Graph',
    description: 'Erdős-Rényi random topology',
    type: 'network',
    size: 256000,
    records: 500,
    format: 'JSON',
  },
  {
    id: 'second-order',
    name: 'Second Order System',
    description: 'Standard second-order plant',
    type: 'control',
    size: 128000,
    records: 100,
    format: 'JSON',
  },
  {
    id: 'kalman-pipeline',
    name: 'Kalman Filter Pipeline',
    description: 'FPGA Kalman filter implementation',
    type: 'tabular',
    size: 1048576,
    records: 4096,
    format: 'CSV',
  },
];

export function getDashboardBySlug(slug: string): DashboardModule | undefined {
  return DASHBOARDS.find((d) => d.slug === slug);
}

export function getDashboardsByCategory(category: string): DashboardModule[] {
  return DASHBOARDS.filter((d) => d.category === category);
}

export function getPresetsForModule(moduleId: string): Preset[] {
  return PRESETS.filter((p) => p.moduleId === moduleId);
}

export function getDatasetsForType(type: Dataset['type']): Dataset[] {
  return DATASETS.filter((d) => d.type === type);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
