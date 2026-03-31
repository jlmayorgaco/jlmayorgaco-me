'use client';

import type { DashboardModule, LabStatus, LabMode } from '../../lib/datalab/types';

interface DataLabTopBarProps {
  activeModule: DashboardModule | null | undefined;
  status: LabStatus;
  mode: LabMode;
}

export default function DataLabTopBar({ 
  activeModule, 
  status,
  mode 
}: DataLabTopBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#3fb950';
      case 'loading': return '#d29922';
      case 'error': return '#f85149';
      default: return '#6b7280';
    }
  };

  return (
    <header className="datalab-topbar">
      <div className="topbar-left">
        <div className="lab-brand">
          <svg className="lab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
            <circle cx="12" cy="10" r="3" />
          </svg>
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
        <span className="topbar-timestamp">
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </header>
  );
}
