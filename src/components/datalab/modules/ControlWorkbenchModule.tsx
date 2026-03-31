'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { CHART_THEMES } from '../../../lib/datalab/chartConfigs';
import {
  DashboardModule,
  MetricCard,
  ChartPanel,
  ControlsPanel,
  ControlGroup,
  StatusBadge,
} from '../DashboardModule';
import './ControlWorkbenchModule.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ControlWorkbenchModule() {
  const { data, loading, error, lastUpdate } = useDashboardData('control-workbench', {
    useCache: true,
  });

  const theme = CHART_THEMES.control;

  if (loading) {
    return (
      <DashboardModule className="control-module">
        <div className="module-loading">
          <span className="loading-spinner" />
          <span>Loading control data...</span>
        </div>
      </DashboardModule>
    );
  }

  if (error || !data) {
    return (
      <DashboardModule className="control-module">
        <div className="module-error">
          <span>⚠ Error loading data</span>
          <span className="error-detail">{error || 'No data available'}</span>
        </div>
      </DashboardModule>
    );
  }

  const metrics = data.metrics as { overshoot: number; settling_time: number; rise_time: number; steady_state_error: number };
  const stepResponse = (data as any).step_response || { time: [], response: [], reference: [] };
  const controller = (data as any).controller || { type: 'PID', kp: 0, ki: 0, kd: 0 };
  const stability = (data as any).stability || { gain_margin: 0, phase_margin: 0, crossover_freq: 0 };

  const responseChartData: ChartData<'line'> = {
    labels: stepResponse.time.map((t: number) => t.toFixed(2)),
    datasets: [
      {
        label: 'Response',
        data: stepResponse.response,
        borderColor: theme.primary,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: 'Reference',
        data: stepResponse.reference,
        borderColor: theme.secondary,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };

  const responseOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
        title: { display: true, text: 'Time (s)', font: { family: "'IBM Plex Mono'", size: 10 }, color: '#7a807c' },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
        min: 0,
        max: 1.3,
      },
    },
  };

  return (
    <DashboardModule className="control-module">
      {/* Metrics Row */}
      <div className="metrics-row">
        <MetricCard
          label="Overshoot"
          value={metrics.overshoot.toFixed(1)}
          unit="%"
          trend="stable"
          accent={theme.primary}
        />
        <MetricCard
          label="Settling Time"
          value={metrics.settling_time.toFixed(2)}
          unit="s"
          accent={theme.primary}
        />
        <MetricCard
          label="Rise Time"
          value={metrics.rise_time.toFixed(2)}
          unit="s"
          accent={theme.primary}
        />
        <MetricCard
          label="Steady Error"
          value={(metrics.steady_state_error * 100).toFixed(2)}
          unit="%"
          trend="down"
          accent={theme.primary}
        />
      </div>

      {/* Main Content Grid */}
      <div className="module-content-grid">
        <div className="content-main">
          {/* Step Response Chart */}
          <ChartPanel title="Step Response" accent={theme.primary}>
            <div className="chart-container">
              <Line data={responseChartData} options={responseOptions} />
            </div>
          </ChartPanel>

          {/* Stability Margins */}
          <ChartPanel title="Stability Analysis" accent={theme.primary}>
            <div className="stability-metrics">
              <div className="stability-item">
                <span className="stability-label">Gain Margin</span>
                <span className="stability-value" style={{ color: theme.primary }}>
                  {stability.gain_margin.toFixed(1)} dB
                </span>
              </div>
              <div className="stability-item">
                <span className="stability-label">Phase Margin</span>
                <span className="stability-value" style={{ color: theme.primary }}>
                  {stability.phase_margin.toFixed(1)}°
                </span>
              </div>
              <div className="stability-item">
                <span className="stability-label">Crossover Freq</span>
                <span className="stability-value" style={{ color: theme.primary }}>
                  {stability.crossover_freq.toFixed(1)} rad/s
                </span>
              </div>
            </div>
          </ChartPanel>
        </div>

        <div className="content-sidebar">
          {/* Status */}
          <div className="status-section">
            <StatusBadge status="active" label="Simulating" />
            {lastUpdate && (
              <span className="last-update">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Controller Info */}
          <ChartPanel title="Controller" accent={theme.primary}>
            <div className="controller-info">
              <span className="controller-type">{controller.type}</span>
              <div className="controller-params">
                <span>Kp: {controller.kp}</span>
                <span>Ki: {controller.ki}</span>
                <span>Kd: {controller.kd}</span>
              </div>
            </div>
          </ChartPanel>

          {/* Controls */}
          <ChartPanel title="Tuning Parameters" accent={theme.primary}>
            <ControlsPanel>
              <ControlGroup label="Controller">
                <select defaultValue="pid">
                  <option value="pid">PID</option>
                  <option value="lqr">LQR</option>
                  <option value="mpc">MPC</option>
                </select>
              </ControlGroup>
              <ControlGroup label="Kp">
                <input type="range" min="0" max="5" step="0.1" defaultValue={controller.kp} />
              </ControlGroup>
              <ControlGroup label="Ki">
                <input type="range" min="0" max="2" step="0.05" defaultValue={controller.ki} />
              </ControlGroup>
              <ControlGroup label="Kd">
                <input type="range" min="0" max="0.5" step="0.01" defaultValue={controller.kd} />
              </ControlGroup>
            </ControlsPanel>
          </ChartPanel>
        </div>
      </div>
    </DashboardModule>
  );
}
