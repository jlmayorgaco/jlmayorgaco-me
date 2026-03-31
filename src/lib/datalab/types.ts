/**
 * Data Lab Types
 * Type definitions for the Data Lab system
 */

// Dashboard Data Types
export interface DashboardData {
  id: string;
  title: string;
  updated_at: string;
  status: 'active' | 'idle' | 'error';
  metrics: Record<string, number>;
}

export interface OpenFreqBenchData extends DashboardData {
  waveform: {
    sample_rate: number;
    duration: number;
    data: Array<{ t: number; v: number }>;
  };
  spectrum: {
    frequencies: number[];
    magnitudes: number[];
  };
  history: Array<{
    timestamp: string;
    frequency: number;
    rocof: number;
    event: string;
  }>;
  alerts: Array<{
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
  }>;
}

export interface SwarmLabData extends DashboardData {
  topology: {
    nodes: Array<{ id: number; x: number; y: number; label: string }>;
    edges: Array<{ source: number; target: number }>;
  };
  positions: Array<{
    agent: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
  }>;
  consensus_history: Array<{ iteration: number; error: number }>;
  formation: string;
  algorithm: string;
}

export interface ControlWorkbenchData extends DashboardData {
  step_response: {
    time: number[];
    response: number[];
    reference: number[];
  };
  bode: {
    frequency: number[];
    magnitude: number[];
    phase: number[];
  };
  controller: {
    type: string;
    kp: number;
    ki: number;
    kd: number;
  };
  plant: {
    type: string;
    omega_n: number;
    zeta: number;
  };
  stability: {
    gain_margin: number;
    phase_margin: number;
    crossover_freq: number;
  };
}

export interface FpgaPipelineData extends DashboardData {
  pipeline: {
    stages: Array<{
      id: number;
      name: string;
      latency: number;
      utilization: number;
    }>;
    total_latency: number;
    max_throughput: number;
  };
  resources: {
    dsp: { used: number; total: number; percentage: number };
    bram: { used: number; total: number; percentage: number };
    ff: { used: number; total: number; percentage: number };
    lut: { used: number; total: number; percentage: number };
  };
  dataflow: Array<{
    stage: string;
    cycles: number;
    status: 'active' | 'idle' | 'processing';
  }>;
  optimization: {
    unroll_factor: number;
    pipeline_stages: number;
    clock_frequency: number;
    data_width: number;
  };
}

export interface DashboardModule {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: DashboardCategory;
  accent: string;
  icon?: string;
  tags: string[];
  defaultDataset?: string;
  supportedViews: ViewMode[];
  status: ModuleStatus;
  component: string; // Component name to lazy load
}

export type DashboardCategory = 
  | 'signals'
  | 'networks'
  | 'control'
  | 'fpga'
  | 'experiments';

export type ModuleStatus = 
  | 'ready'
  | 'running'
  | 'sim'
  | 'online'
  | 'idle'
  | 'loading';

export type ViewMode = 
  | 'signal'
  | 'network'
  | 'control'
  | 'pipeline'
  | 'table'
  | 'split';

export interface Dataset {
  id: string;
  name: string;
  description: string;
  type: 'signal' | 'network' | 'control' | 'tabular';
  size: number;
  records: number;
  format: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  parameters: Record<string, unknown>;
}

export interface LabEvent {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'alert';
  source: string;
  message: string;
}

export interface LabState {
  activeModule: string | null;
  activeDataset: string | null;
  activePreset: string | null;
  mode: LabMode;
  status: LabStatus;
  events: LabEvent[];
}

export type LabMode = 'analysis' | 'simulation' | 'comparison' | 'exploration';

export type LabStatus = 'idle' | 'loading' | 'active' | 'error';

export interface ControlAction {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface HMIFrameProps {
  module: DashboardModule;
  onRun?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  onPresetSelect?: (preset: Preset) => void;
  presets?: Preset[];
  isRunning?: boolean;
  children: React.ReactNode;
}
