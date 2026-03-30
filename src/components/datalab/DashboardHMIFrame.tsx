'use client';

import type { DashboardModule } from '../../lib/datalab/types';

interface DashboardHMIFrameProps {
  module: DashboardModule;
  onRun: () => void;
  onReset: () => void;
  children: React.ReactNode;
}

export default function DashboardHMIFrame({ 
  module, 
  onRun, 
  onReset,
  children 
}: DashboardHMIFrameProps) {
  return (
    <div className="dashboard-hmi-frame">
      <div className="hmi-header">
        <div className="hmi-title-section">
          <h2 className="hmi-title">{module.title}</h2>
          <span className="hmi-subtitle">{module.subtitle}</span>
        </div>
        <div className="hmi-status">
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
      </div>

      <div className="hmi-toolbar">
        <div className="toolbar-tags">
          {module.tags.slice(0, 4).map(tag => (
            <span key={tag} className="toolbar-tag">{tag}</span>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={onRun}>▶ Run</button>
          <button className="toolbar-btn" onClick={onReset}>↺ Reset</button>
          <button className="toolbar-btn">⚙ Presets</button>
          <button className="toolbar-btn">⬇ Export</button>
        </div>
      </div>

      <div className="hmi-viewport">
        {children}
      </div>

      <div className="hmi-footer">
        <span className="footer-info">Module: {module.id}</span>
        <span className="footer-info">Views: {module.supportedViews.join(', ')}</span>
      </div>
    </div>
  );
}
