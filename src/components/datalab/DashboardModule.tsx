'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ReactNode } from 'react';
import './DashboardModule.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface DashboardModuleProps {
  children?: ReactNode;
  className?: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  accent?: string;
}

export function MetricCard({ label, value, unit, trend, accent = '#3fb9a7' }: MetricCardProps) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <div className="metric-value-row">
        <span className="metric-value" style={{ color: accent }}>{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
        {trend && (
          <span className={`metric-trend trend-${trend}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}

interface ChartPanelProps {
  title: string;
  children: ReactNode;
  accent?: string;
}

export function ChartPanel({ title, children, accent = '#3fb9a7' }: ChartPanelProps) {
  return (
    <div className="chart-panel">
      <div className="chart-panel-header">
        <span className="chart-panel-title">{title}</span>
        <span className="chart-panel-dot" style={{ backgroundColor: accent }} />
      </div>
      <div className="chart-panel-body">
        {children}
      </div>
    </div>
  );
}

interface ControlsPanelProps {
  children: ReactNode;
}

export function ControlsPanel({ children }: ControlsPanelProps) {
  return (
    <div className="controls-panel">
      {children}
    </div>
  );
}

interface ControlGroupProps {
  label: string;
  children: ReactNode;
}

export function ControlGroup({ label, children }: ControlGroupProps) {
  return (
    <div className="control-group">
      <label className="control-label">{label}</label>
      {children}
    </div>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'idle' | 'error' | 'warning';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colors = {
    active: '#3fb950',
    idle: '#6b7280',
    error: '#ef4444',
    warning: '#d29922',
  };

  return (
    <span 
      className="status-badge-inline"
      style={{ 
        backgroundColor: `${colors[status]}20`,
        color: colors[status],
        borderColor: colors[status],
      }}
    >
      <span className="status-dot-inline" style={{ backgroundColor: colors[status] }} />
      {label || status.toUpperCase()}
    </span>
  );
}

interface WaveformChartProps {
  data: Array<{ t: number; v: number }>;
  accent?: string;
  height?: number;
}

export function WaveformChart({ data, accent = '#3fb9a7', height = 200 }: WaveformChartProps) {
  const chartData: ChartData<'line'> = {
    labels: data.map(d => d.t.toFixed(2)),
    datasets: [{
      data: data.map(d => d.v),
      borderColor: accent,
      backgroundColor: `${accent}20`,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 1.5,
    }],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(26, 31, 29, 0.9)',
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toFixed(4)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
      },
    },
  };

  return (
    <div className="chart-container" style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

interface SpectrumChartProps {
  frequencies: number[];
  magnitudes: number[];
  accent?: string;
  height?: number;
}

export function SpectrumChart({ frequencies, magnitudes, accent = '#3fb9a7', height = 200 }: SpectrumChartProps) {
  const chartData: ChartData<'bar'> = {
    labels: frequencies.map(f => `${f}`),
    datasets: [{
      data: magnitudes,
      backgroundColor: frequencies.map((_, i) => i === 1 ? accent : `${accent}60`),
      borderColor: accent,
      borderWidth: 1,
      borderRadius: 2,
    }],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(26, 31, 29, 0.9)',
        callbacks: {
          title: (ctx) => `${ctx[0].label} Hz`,
          label: (ctx) => `${ctx.raw.toFixed(3)} pu`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="chart-container" style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function DashboardModule({ children, className = '' }: DashboardModuleProps) {
  return (
    <div className={`dashboard-module ${className}`}>
      {children}
    </div>
  );
}

export default DashboardModule;
