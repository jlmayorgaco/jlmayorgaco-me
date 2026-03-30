/**
 * Data Lab Types
 * Type definitions for the Data Lab system
 */

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
  children: React.ReactNode;
}
