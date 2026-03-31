'use client';

import { useDataLab } from '../../hooks/useDataLab';
import { DASHBOARDS, getPresetsForModule } from '../../lib/datalab/registry';
import DataLabTopBar from './DataLabTopBar';
import DataLabSidebar from './DataLabSidebar';
import DataLabLogPanel from './DataLabLogPanel';
import DashboardHMIFrame from './DashboardHMIFrame';
import OpenFreqBenchModule from './modules/OpenFreqBenchModule';
import SwarmLabModule from './modules/SwarmLabModule';
import ControlWorkbenchModule from './modules/ControlWorkbenchModule';
import FpgaPipelineModule from './modules/FpgaPipelineModule';
import './datalab-styles.css';

const MODULE_COMPONENTS: Record<string, React.ComponentType> = {
  OpenFreqBenchModule,
  SwarmLabModule,
  ControlWorkbenchModule,
  FpgaPipelineModule,
};

export default function DataLabShell() {
  const lab = useDataLab();
  
  const activeDashboard = lab.activeModule 
    ? DASHBOARDS.find(d => d.id === lab.activeModule) 
    : null;

  const ActiveModuleComponent = activeDashboard 
    ? MODULE_COMPONENTS[activeDashboard.component]
    : null;

  const presets = activeDashboard 
    ? getPresetsForModule(activeDashboard.id) 
    : [];

  return (
    <div className="datalab-container">
      {/* Top Bar - Brand + Status only */}
      <DataLabTopBar 
        activeModule={activeDashboard}
        status={lab.status}
        mode={lab.mode}
      />

      {/* Main Content */}
      <div className="datalab-main">
        {/* Sidebar */}
        <DataLabSidebar 
          dashboards={DASHBOARDS}
          activeModuleId={lab.activeModule}
          onSelectModule={lab.setActiveModule}
          events={lab.events}
        />

        {/* Viewport */}
        <div className="datalab-viewport">
          {activeDashboard && ActiveModuleComponent ? (
            <DashboardHMIFrame 
              module={activeDashboard}
              onRun={lab.runSimulation}
              onReset={lab.resetModule}
              presets={presets}
              isRunning={lab.status === 'loading'}
            >
              <ActiveModuleComponent />
            </DashboardHMIFrame>
          ) : (
            <div className="datalab-empty">
              <div className="empty-content">
                <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h2 className="empty-title">Welcome to Data Lab</h2>
                <p className="empty-description">
                  Select a module from the sidebar to begin your experiment.
                </p>
                <div className="empty-modules">
                  {DASHBOARDS.slice(0, 3).map(dashboard => (
                    <button
                      key={dashboard.id}
                      className="empty-module-btn"
                      onClick={() => lab.setActiveModule(dashboard.id)}
                    >
                      <span className="module-color" style={{ backgroundColor: dashboard.accent }} />
                      <span className="module-name">{dashboard.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Log */}
      <DataLabLogPanel 
        events={lab.events}
        onClear={lab.clearEvents}
      />
    </div>
  );
}
