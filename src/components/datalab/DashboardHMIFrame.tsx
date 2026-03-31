'use client';

import type { DashboardModule, Preset } from '../../lib/datalab/types';
import HMIControls from './HMIControls';
import './DashboardHMIFrame.css';

interface DashboardHMIFrameProps {
  module: DashboardModule;
  onRun: () => void;
  onReset: () => void;
  onExport?: () => void;
  onPresetSelect?: (preset: Preset) => void;
  presets?: Preset[];
  isRunning?: boolean;
  children: React.ReactNode;
}

export default function DashboardHMIFrame({ 
  module, 
  onRun, 
  onReset,
  onExport,
  onPresetSelect,
  presets = [],
  isRunning = false,
  children 
}: DashboardHMIFrameProps) {
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      const data = { module: module.id, timestamp: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module.id}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="dashboard-hmi-frame" style={{ '--module-accent': module.accent } as React.CSSProperties}>
      <div className="hmi-header">
        <div className="hmi-title-section">
          <div className="hmi-title-row">
            <h2 className="hmi-title">{module.title}</h2>
            <span 
              className="status-badge"
              style={{ 
                backgroundColor: `${module.accent}20`,
                color: module.accent,
                borderColor: module.accent
              }}
            >
              {module.status.toUpperCase()}
            </span>
          </div>
          <span className="hmi-subtitle">{module.subtitle}</span>
        </div>
        
        <HMIControls
          onRun={onRun}
          onReset={onReset}
          onExport={handleExport}
          onPresetSelect={onPresetSelect}
          presets={presets}
          isRunning={isRunning}
          accent={module.accent}
        />
      </div>

      <div className="hmi-toolbar">
        <div className="toolbar-tags">
          {module.tags.slice(0, 5).map(tag => (
            <span key={tag} className="toolbar-tag">{tag}</span>
          ))}
        </div>
        <div className="toolbar-meta">
          <span className="meta-item">
            <span className="meta-label">Module:</span>
            <span className="meta-value">{module.id}</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">Views:</span>
            <span className="meta-value">{module.supportedViews.join(', ')}</span>
          </span>
        </div>
      </div>

      <div className="hmi-viewport">
        {children}
      </div>
    </div>
  );
}
