'use client';

import type { Preset } from '../../lib/datalab/types';
import './HMIControls.css';

interface HMIControlsProps {
  onRun: () => void;
  onReset: () => void;
  onExport?: () => void;
  onPresetSelect?: (preset: Preset) => void;
  presets?: Preset[];
  isRunning?: boolean;
  showPresets?: boolean;
  accent?: string;
}

export default function HMIControls({
  onRun,
  onReset,
  onExport,
  onPresetSelect,
  presets = [],
  isRunning = false,
  showPresets = true,
  accent = '#3fb9a7',
}: HMIControlsProps) {
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      console.log('Export triggered - no handler');
    }
  };

  const handlePresetClick = () => {
    if (presets.length > 0 && onPresetSelect) {
      onPresetSelect(presets[0]);
    }
  };

  return (
    <div className="hmi-controls">
      <button
        className="hmi-btn hmi-btn-primary"
        onClick={onRun}
        disabled={isRunning}
        style={{ '--accent': accent } as React.CSSProperties}
      >
        <span className="hmi-btn-icon">▶</span>
        <span className="hmi-btn-label">Run</span>
      </button>

      <button
        className="hmi-btn hmi-btn-secondary"
        onClick={onReset}
        disabled={isRunning}
      >
        <span className="hmi-btn-icon">↺</span>
        <span className="hmi-btn-label">Reset</span>
      </button>

      {showPresets && (
        <button
          className="hmi-btn hmi-btn-secondary"
          onClick={handlePresetClick}
          disabled={presets.length === 0}
        >
          <span className="hmi-btn-icon">⚙</span>
          <span className="hmi-btn-label">Presets</span>
        </button>
      )}

      <button
        className="hmi-btn hmi-btn-secondary"
        onClick={handleExport}
      >
        <span className="hmi-btn-icon">⬇</span>
        <span className="hmi-btn-label">Export</span>
      </button>
    </div>
  );
}
