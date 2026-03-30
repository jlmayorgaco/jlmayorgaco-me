'use client';

import type { LabEvent } from '../../lib/datalab/types';

interface DataLabLogPanelProps {
  events: LabEvent[];
  onClear: () => void;
}

export default function DataLabLogPanel({ events, onClear }: DataLabLogPanelProps) {
  const getLevelColor = (level: LabEvent['level']) => {
    switch (level) {
      case 'info': return '#3fb9a7';
      case 'warn': return '#d29922';
      case 'error': return '#ef4444';
      case 'alert': return '#9d7cbf';
      default: return '#6b7280';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="datalab-log-panel">
      <div className="log-header">
        <span className="log-title">Lab Events</span>
        <div className="log-actions">
          <span className="log-count">{events.length} events</span>
          <button className="log-clear" onClick={onClear}>Clear</button>
        </div>
      </div>
      <div className="log-content">
        {events.length === 0 ? (
          <div className="log-empty">
            <span className="empty-hint">Lab events will appear here...</span>
          </div>
        ) : (
          events.map((event, index) => (
            <div key={index} className="log-entry">
              <span className="log-timestamp">{formatTime(event.timestamp)}</span>
              <span 
                className="log-level"
                style={{ color: getLevelColor(event.level) }}
              >
                [{event.level.toUpperCase()}]
              </span>
              <span className="log-source">{event.source}:</span>
              <span className="log-message">{event.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
