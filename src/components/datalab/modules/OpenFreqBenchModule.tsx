'use client';

import { useDashboardData } from '../../../hooks/useDashboardData';
import { CHART_THEMES } from '../../../lib/datalab/chartConfigs';
import {
  DashboardModule,
  MetricCard,
  ChartPanel,
  WaveformChart,
  SpectrumChart,
  ControlsPanel,
  ControlGroup,
  StatusBadge,
} from '../DashboardModule';
import './OpenFreqBenchModule.css';

export default function OpenFreqBenchModule() {
  const { data, loading, error, lastUpdate } = useDashboardData('openfreqbench', {
    useCache: true,
  });

  const theme = CHART_THEMES.signals;

  if (loading) {
    return (
      <DashboardModule className="openfreqbench-module">
        <div className="module-loading">
          <span className="loading-spinner" />
          <span>Loading signal data...</span>
        </div>
      </DashboardModule>
    );
  }

  if (error || !data) {
    return (
      <DashboardModule className="openfreqbench-module">
        <div className="module-error">
          <span>⚠ Error loading data</span>
          <span className="error-detail">{error || 'No data available'}</span>
        </div>
      </DashboardModule>
    );
  }

  const metrics = data.metrics as { frequency: number; rocof: number; snr: number; thd: number };
  const waveformData = (data as any).waveform?.data || [];
  const spectrumData = (data as any).spectrum || { frequencies: [], magnitudes: [] };
  const alerts = (data as any).alerts || [];

  return (
    <DashboardModule className="openfreqbench-module">
      {/* Metrics Row */}
      <div className="metrics-row">
        <MetricCard
          label="Frequency"
          value={metrics.frequency.toFixed(3)}
          unit="Hz"
          accent={theme.primary}
        />
        <MetricCard
          label="RoCoF"
          value={(metrics.rocof * 1000).toFixed(1)}
          unit="mHz/s"
          trend="stable"
          accent={theme.primary}
        />
        <MetricCard
          label="SNR"
          value={metrics.snr.toFixed(1)}
          unit="dB"
          trend="up"
          accent={theme.primary}
        />
        <MetricCard
          label="THD"
          value={metrics.thd.toFixed(2)}
          unit="%"
          accent={theme.primary}
        />
      </div>

      {/* Main Content Grid */}
      <div className="module-content-grid">
        <div className="content-main">
          {/* Waveform Chart */}
          <ChartPanel title="Signal Waveform" accent={theme.primary}>
            <WaveformChart
              data={waveformData}
              accent={theme.primary}
              height={200}
            />
          </ChartPanel>

          {/* FFT Spectrum */}
          <ChartPanel title="Frequency Spectrum" accent={theme.primary}>
            <SpectrumChart
              frequencies={spectrumData.frequencies}
              magnitudes={spectrumData.magnitudes}
              accent={theme.primary}
              height={180}
            />
          </ChartPanel>
        </div>

        <div className="content-sidebar">
          {/* Status */}
          <div className="status-section">
            <StatusBadge status="active" label="Live" />
            {lastUpdate && (
              <span className="last-update">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Controls */}
          <ChartPanel title="Analysis Parameters" accent={theme.primary}>
            <ControlsPanel>
              <ControlGroup label="Algorithm">
                <select defaultValue="dft">
                  <option value="dft">DFT (4-cycle)</option>
                  <option value="pll">PLL-SOGI</option>
                  <option value="ekf">EKF (8-state)</option>
                  <option value="nn">Neural Network</option>
                </select>
              </ControlGroup>
              <ControlGroup label="Window Size">
                <input type="range" min="1" max="10" defaultValue="4" />
              </ControlGroup>
              <ControlGroup label="Sample Rate">
                <select defaultValue="1000">
                  <option value="500">500 Hz</option>
                  <option value="1000">1000 Hz</option>
                  <option value="2000">2000 Hz</option>
                </select>
              </ControlGroup>
            </ControlsPanel>
          </ChartPanel>

          {/* Alerts */}
          <ChartPanel title="System Alerts" accent={theme.primary}>
            <div className="alerts-list">
              {alerts.length === 0 ? (
                <span className="no-alerts">No active alerts</span>
              ) : (
                alerts.map((alert: any, i: number) => (
                  <div key={i} className={`alert-item ${alert.level}`}>
                    <span className="alert-icon">
                      {alert.level === 'warn' ? '⚠' : 'ℹ'}
                    </span>
                    <span className="alert-message">{alert.message}</span>
                  </div>
                ))
              )}
            </div>
          </ChartPanel>
        </div>
      </div>
    </DashboardModule>
  );
}
