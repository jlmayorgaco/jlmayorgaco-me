'use client';

import type { DashboardModule, LabEvent } from '../../lib/datalab/types';
import { getPresetsForModule } from '../../lib/datalab/registry';

interface DataLabSidebarProps {
  dashboards: DashboardModule[];
  activeModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  events: LabEvent[];
}

export default function DataLabSidebar({ 
  dashboards, 
  activeModuleId, 
  onSelectModule,
  events 
}: DataLabSidebarProps) {
  const categories = ['signals', 'networks', 'control', 'fpga'] as const;
  
  const presets = activeModuleId 
    ? getPresetsForModule(activeModuleId)
    : [];

  return (
    <aside className="datalab-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Modules</h3>
        <div className="module-list">
          {categories.map(category => {
            const categoryModules = dashboards.filter(d => d.category === category);
            if (categoryModules.length === 0) return null;
            
            return (
              <div key={category} className="category-group">
                <span className="category-label">{category}</span>
                {categoryModules.map(module => (
                  <button
                    key={module.id}
                    className={`module-item ${activeModuleId === module.id ? 'active' : ''}`}
                    onClick={() => onSelectModule(module.id)}
                  >
                    <span 
                      className="module-accent" 
                      style={{ backgroundColor: module.accent }}
                    />
                    <span className="module-name">{module.title}</span>
                    {activeModuleId === module.id && (
                      <span className="module-indicator">●</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {presets.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">Presets</h3>
          <div className="preset-list">
            {presets.map(preset => (
              <button key={preset.id} className="preset-item">
                <span className="preset-name">{preset.name}</span>
                <span className="preset-desc">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <h3 className="sidebar-title">Recent Events</h3>
        <div className="mini-log">
          {events.slice(0, 5).map((event, i) => (
            <div key={i} className={`mini-event ${event.level}`}>
              <span className="event-level">[{event.level.toUpperCase()}]</span>
              <span className="event-msg">{event.message}</span>
            </div>
          ))}
          {events.length === 0 && (
            <span className="no-events">No recent events</span>
          )}
        </div>
      </div>
    </aside>
  );
}
