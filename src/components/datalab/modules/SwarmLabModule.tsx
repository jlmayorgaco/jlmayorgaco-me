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
import './SwarmLabModule.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SwarmLabModule() {
  const { data, loading, error, lastUpdate } = useDashboardData('swarm-lab', {
    useCache: true,
  });

  const theme = CHART_THEMES.networks;

  if (loading) {
    return (
      <DashboardModule className="swarmlab-module">
        <div className="module-loading">
          <span className="loading-spinner" />
          <span>Loading swarm data...</span>
        </div>
      </DashboardModule>
    );
  }

  if (error || !data) {
    return (
      <DashboardModule className="swarmlab-module">
        <div className="module-error">
          <span>⚠ Error loading data</span>
          <span className="error-detail">{error || 'No data available'}</span>
        </div>
      </DashboardModule>
    );
  }

  const metrics = data.metrics as { agents: number; consensus_error: number; iteration: number; connectivity: number };
  const topology = (data as any).topology || { nodes: [], edges: [] };
  const consensusHistory = (data as any).consensus_history || [];

  const consensusChartData: ChartData<'line'> = {
    labels: consensusHistory.map((h: any) => h.iteration.toString()),
    datasets: [{
      data: consensusHistory.map((h: any) => h.error),
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}20`,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 1.5,
    }],
  };

  const consensusOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
        title: { display: true, text: 'Iteration', font: { family: "'IBM Plex Mono'", size: 10 }, color: '#7a807c' },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#7a807c' },
        title: { display: true, text: 'Error', font: { family: "'IBM Plex Mono'", size: 10 }, color: '#7a807c' },
      },
    },
  };

  return (
    <DashboardModule className="swarmlab-module">
      {/* Metrics Row */}
      <div className="metrics-row">
        <MetricCard
          label="Agents"
          value={metrics.agents}
          accent={theme.primary}
        />
        <MetricCard
          label="Consensus Error"
          value={metrics.consensus_error.toFixed(4)}
          trend="down"
          accent={theme.primary}
        />
        <MetricCard
          label="Iteration"
          value={metrics.iteration}
          accent={theme.primary}
        />
        <MetricCard
          label="Connectivity"
          value={(metrics.connectivity * 100).toFixed(0)}
          unit="%"
          trend="stable"
          accent={theme.primary}
        />
      </div>

      {/* Main Content Grid */}
      <div className="module-content-grid">
        <div className="content-main">
          {/* Network Visualization */}
          <ChartPanel title="Network Topology" accent={theme.primary}>
            <div className="network-visualization">
              <svg viewBox="0 0 200 200" className="network-svg">
                {/* Edges */}
                {topology.edges.map((edge: any, i: number) => {
                  const from = topology.nodes.find((n: any) => n.id === edge.source);
                  const to = topology.nodes.find((n: any) => n.id === edge.target);
                  if (!from || !to) return null;
                  return (
                    <line
                      key={`edge-${i}`}
                      x1={from.x * 200}
                      y1={from.y * 200}
                      x2={to.x * 200}
                      y2={to.y * 200}
                      stroke={theme.primary}
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  );
                })}
                {/* Nodes */}
                {topology.nodes.map((node: any) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x * 200}
                      cy={node.y * 200}
                      r="12"
                      fill={theme.primary}
                      opacity="0.8"
                    />
                    <text
                      x={node.x * 200}
                      y={node.y * 200 + 24}
                      textAnchor="middle"
                      className="node-label"
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </ChartPanel>

          {/* Consensus Convergence */}
          <ChartPanel title="Consensus Convergence" accent={theme.primary}>
            <div className="chart-container">
              <Line data={consensusChartData} options={consensusOptions} />
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

          {/* Controls */}
          <ChartPanel title="MAS Parameters" accent={theme.primary}>
            <ControlsPanel>
              <ControlGroup label="Algorithm">
                <select defaultValue="consensus">
                  <option value="consensus">Consensus</option>
                  <option value="gossip">Gossip</option>
                  <option value="formation">Formation</option>
                </select>
              </ControlGroup>
              <ControlGroup label="Topology">
                <select defaultValue="hexagon">
                  <option value="hexagon">Hexagon</option>
                  <option value="ring">Ring</option>
                  <option value="complete">Complete</option>
                </select>
              </ControlGroup>
              <ControlGroup label="Agents">
                <input type="range" min="3" max="12" defaultValue="6" />
              </ControlGroup>
            </ControlsPanel>
          </ChartPanel>
        </div>
      </div>
    </DashboardModule>
  );
}
