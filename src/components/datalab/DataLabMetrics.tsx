'use client';

import './DataLabCharts.css';

interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface DataLabMetricsProps {
  metrics?: Metric[];
}

const defaultMetrics: Metric[] = [
  { label: 'Sample Rate', value: 50000, unit: 'Hz', trend: 'stable' },
  { label: 'Buffer Size', value: 2048, unit: 'samples', trend: 'stable' },
  { label: 'SNR', value: 72.5, unit: 'dB', trend: 'up' },
  { label: 'THD', value: 0.02, unit: '%', trend: 'down' },
];

export default function DataLabMetrics({ metrics = defaultMetrics }: DataLabMetricsProps) {
  const formatValue = (value: string | number): string => {
    if (typeof value === 'number') {
      if (value >= 1000) {
        return value.toLocaleString();
      }
      return value.toFixed(2);
    }
    return value;
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'var(--led-green)';
      case 'down':
        return 'var(--led-amber)';
      default:
        return 'var(--lab-text-muted)';
    }
  };

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-label">{metric.label}</div>
          <div className="metric-value">
            {formatValue(metric.value)}
            {metric.trend && (
              <span 
                className="metric-trend"
                style={{ color: getTrendColor(metric.trend) }}
              >
                {getTrendIcon(metric.trend)}
              </span>
            )}
          </div>
          {metric.unit && <div className="metric-unit">{metric.unit}</div>}
        </div>
      ))}
    </div>
  );
}
