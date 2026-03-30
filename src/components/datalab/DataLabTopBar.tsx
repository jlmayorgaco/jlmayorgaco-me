'use client';

import type { DashboardModule, LabStatus, LabMode } from '../../lib/datalab/types';

interface DataLabTopBarProps {
  activeModule: DashboardModule | null | undefined;
  status: LabStatus;
  mode: LabMode;
  onRun: () => void;
  onReset: () => void;
}

export default function DataLabTopBar({ 
  activeModule, 
  status, 
  mode,
  onRun,
  onReset 
}: DataLabTopBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#3fb950';
      case 'loading': return '#d29922';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <header className="datalab-topbar">
      <div className="topbar-left">
        <div className="lab-brand">
          <span className="lab-icon">🔬</span>
          <span className="lab-name">DATA LAB</span>
        </div>
        
        {activeModule && (
          <div className="module-info">
            <span className="module-title">{activeModule.title}</span>
            <span className="module-subtitle">{activeModule.subtitle}</span>
          </div>
        )}
      </div>

      <div className="topbar-center">
        <div className="status-indicator">
          <span 
            className="status-dot" 
            style={{ backgroundColor: getStatusColor() }}
          />
          <span className="status-text">{status.toUpperCase()}</span>
        </div>
        
        <div className="mode-badge">
          {mode.toUpperCase()}
        </div>
      </div>

      <div className="topbar-right">
        {activeModule && (
          <>
            <button 
              className="action-btn primary"
              onClick={onRun}
              disabled={status === 'loading'}
            >
              ▶ Run
            </button>
            <button 
              className="action-btn"
              onClick={onReset}
              disabled={status === 'loading'}
            >
              ↺ Reset
            </button>
            <button className="action-btn">
              ⬇ Export
            </button>
          </>
        )}
      </div>
    </header>
  );
}
