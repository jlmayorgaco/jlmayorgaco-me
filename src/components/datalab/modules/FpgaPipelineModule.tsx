'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
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
import './FpgaPipelineModule.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FpgaPipelineModule() {
  const { data, loading, error, lastUpdate } = useDashboardData('fpga-pipeline', {
    useCache: true,
  });

  const theme = CHART_THEMES.fpga;

  if (loading) {
    return (
      <DashboardModule className="fpga-module">
        <div className="module-loading">
          <span className="loading-spinner" />
          <span>Loading FPGA data...</span>
        </div>
      </DashboardModule>
    );
  }

  if (error || !data) {
    return (
      <DashboardModule className="fpga-module">
        <div className="module-error">
          <span>⚠ Error loading data</span>
          <span className="error-detail">{error || 'No data available'}</span>
        </div>
      </DashboardModule>
    );
  }

  const metrics = data.metrics as { latency: number; throughput: number; dsp_utilization: number; bram_utilization: number };
  const pipeline = (data as any).pipeline || { stages: [], total_latency: 0, max_throughput: 0 };
  const resources = (data as any).resources || { dsp: { used: 0, total: 0, percentage: 0 }, bram: { used: 0, total: 0, percentage: 0 }, ff: { used: 0, total: 0, percentage: 0 }, lut: { used: 0, total: 0, percentage: 0 } };
  const optimization = (data as any).optimization || { unroll_factor: 0, pipeline_stages: 0, clock_frequency: 0, data_width: 0 };

  const resourceChartData: ChartData<'bar'> = {
    labels: ['DSP', 'BRAM', 'FF', 'LUT'],
    datasets: [{
      data: [
        resources.dsp.percentage,
        resources.bram.percentage,
        resources.ff.percentage,
        resources.lut.percentage,
      ],
      backgroundColor: [
        resources.dsp.percentage > 80 ? '#f85149' : 
        resources.dsp.percentage > 60 ? '#d29922' : theme.primary,
        resources.bram.percentage > 80 ? '#f85149' : 
        resources.bram.percentage > 60 ? '#d29922' : theme.primary,
        resources.ff.percentage > 80 ? '#f85149' : 
        resources.ff.percentage > 60 ? '#d29922' : theme.primary,
        resources.lut.percentage > 80 ? '#f85149' : 
        resources.lut.percentage > 60 ? '#d29922' : theme.primary,
      ],
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 4,
    }],
  };

  const resourceOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
        max: 100,
        callback: (value) => `${value}%`,
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
      },
    },
  };

  return (
    <DashboardModule className="fpga-module">
      {/* Metrics Row */}
      <div className="metrics-row">
        <MetricCard
          label="Latency"
          value={metrics.latency}
          unit="cycles"
          accent={theme.primary}
        />
        <MetricCard
          label="Throughput"
          value={metrics.throughput}
          unit="MHz"
          accent={theme.primary}
        />
        <MetricCard
          label="DSP Util"
          value={metrics.dsp_utilization}
          unit="%"
          trend={metrics.dsp_utilization > 80 ? 'up' : 'stable'}
          accent={theme.primary}
        />
        <MetricCard
          label="BRAM Util"
          value={metrics.bram_utilization}
          unit="%"
          accent={theme.primary}
        />
      </div>

      {/* Main Content Grid */}
      <div className="module-content-grid">
        <div className="content-main">
          {/* Pipeline Visualization */}
          <ChartPanel title="Pipeline Stages" accent={theme.primary}>
            <div className="pipeline-visualization">
              <div className="pipeline-blocks">
                {pipeline.stages.map((stage: any, i: number) => (
                  <div key={stage.id} className="pipeline-stage">
                    <div 
                      className="stage-block"
                      style={{ 
                        borderColor: stage.utilization > 80 ? '#f85149' : 
                                     stage.utilization > 60 ? '#d29922' : theme.primary 
                      }}
                    >
                      <span className="stage-name">{stage.name}</span>
                      <span className="stage-latency">{stage.latency} cyc</span>
                    </div>
                    {i < pipeline.stages.length - 1 && (
                      <span className="stage-arrow">→</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="pipeline-summary">
                <span>Total Latency: {pipeline.total_latency} cycles</span>
                <span>Max Throughput: {pipeline.max_throughput} MHz</span>
              </div>
            </div>
          </ChartPanel>

          {/* Resource Utilization */}
          <ChartPanel title="Resource Utilization" accent={theme.primary}>
            <div className="chart-container">
              <Bar data={resourceChartData} options={resourceOptions} />
            </div>
          </ChartPanel>
        </div>

        <div className="content-sidebar">
          {/* Status */}
          <div className="status-section">
            <StatusBadge status="active" label="Synthesized" />
            {lastUpdate && (
              <span className="last-update">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Device Info */}
          <ChartPanel title="Device" accent={theme.primary}>
            <div className="device-info">
              <span className="device-name">XC7K325T-FFG900</span>
              <div className="device-params">
                <span>Clock: {optimization.clock_frequency} MHz</span>
                <span>Data Width: {optimization.data_width} bit</span>
                <span>Pipeline: {optimization.pipeline_stages} stages</span>
              </div>
            </div>
          </ChartPanel>

          {/* Controls */}
          <ChartPanel title="Synthesis Options" accent={theme.primary}>
            <ControlsPanel>
              <ControlGroup label="Device">
                <select defaultValue="xc7k325t">
                  <option value="xc7k325t">XC7K325T-FFG900</option>
                  <option value="xc7z020">XC7Z020-CLG484</option>
                  <option value="xc7a100t">XC7A100T-CSG324</option>
                </select>
              </ControlGroup>
              <ControlGroup label="Optimization">
                <select defaultValue="performance">
                  <option value="performance">Performance</option>
                  <option value="area">Area</option>
                  <option value="power">Power</option>
                  <option value="balanced">Balanced</option>
                </select>
              </ControlGroup>
              <ControlGroup label="Unroll Factor">
                <input type="range" min="1" max="16" defaultValue={optimization.unroll_factor} />
              </ControlGroup>
            </ControlsPanel>
          </ChartPanel>
        </div>
      </div>
    </DashboardModule>
  );
}
