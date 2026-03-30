'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './DataLabCharts.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimeSeriesData {
  labels: string[];
  values: number[];
  label: string;
}

interface DataLabChartsProps {
  signalData?: TimeSeriesData;
  frequencyData?: TimeSeriesData;
  performanceData?: TimeSeriesData;
}

const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#1a2328',
      titleColor: '#3fb9a7',
      bodyColor: '#a8b0ac',
      borderColor: '#3a4540',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      titleFont: {
        family: "'IBM Plex Mono', monospace",
        size: 12,
      },
      bodyFont: {
        family: "'IBM Plex Mono', monospace",
        size: 11,
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: '#2d3a40',
        drawBorder: false,
      },
      ticks: {
        color: '#7a807c',
        font: {
          family: "'IBM Plex Mono', monospace",
          size: 10,
        },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
      },
    },
    y: {
      grid: {
        color: '#2d3a40',
        drawBorder: false,
      },
      ticks: {
        color: '#7a807c',
        font: {
          family: "'IBM Plex Mono', monospace",
          size: 10,
        },
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
};

export default function DataLabCharts({ 
  signalData, 
  frequencyData, 
  performanceData 
}: DataLabChartsProps) {
  // Generate sample data if not provided
  const generateSignalData = (): TimeSeriesData => {
    const labels = Array.from({ length: 50 }, (_, i) => `${i * 0.02}s`);
    const values = labels.map((_, i) => 
      Math.sin(i * 0.3) * 0.8 + Math.sin(i * 0.1) * 0.4 + (Math.random() - 0.5) * 0.1
    );
    return { labels, values, label: 'Signal Amplitude' };
  };

  const generateFrequencyData = (): TimeSeriesData => {
    const labels = ['50Hz', '100Hz', '150Hz', '200Hz', '250Hz', '300Hz', '350Hz', '400Hz'];
    const values = [0.1, 0.85, 0.15, 0.45, 0.08, 0.22, 0.05, 0.12];
    return { labels, values, label: 'FFT Magnitude' };
  };

  const generatePerformanceData = (): TimeSeriesData => {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const values = labels.map(() => Math.random() * 30 + 60);
    return { labels, values, label: 'CPU Load %' };
  };

  const signal = signalData || generateSignalData();
  const frequency = frequencyData || generateFrequencyData();
  const performance = performanceData || generatePerformanceData();

  const signalChartData = {
    labels: signal.labels,
    datasets: [{
      label: signal.label,
      data: signal.values,
      borderColor: '#3fb9a7',
      backgroundColor: 'rgba(63, 185, 167, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 4,
    }],
  };

  const frequencyChartData = {
    labels: frequency.labels,
    datasets: [{
      label: frequency.label,
      data: frequency.values,
      backgroundColor: 'rgba(210, 153, 34, 0.8)',
      borderColor: '#d29922',
      borderWidth: 1,
    }],
  };

  const performanceChartData = {
    labels: performance.labels,
    datasets: [{
      label: performance.label,
      data: performance.values,
      borderColor: '#b8956a',
      backgroundColor: 'rgba(184, 149, 106, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 2,
      pointHoverRadius: 4,
    }],
  };

  return (
    <div className="datalab-charts">
      <div className="chart-grid">
        {/* Signal Waveform */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Signal Waveform</span>
            <span className="chart-status live">
              <span className="status-dot" />
              LIVE
            </span>
          </div>
          <div className="chart-body">
            <Line data={signalChartData} options={defaultChartOptions} />
          </div>
          <div className="chart-footer">
            <span>Sample Rate: 50 Hz</span>
            <span>Range: ±1.0</span>
          </div>
        </div>

        {/* Frequency Spectrum */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">FFT Spectrum</span>
            <span className="chart-status">SNAPSHOT</span>
          </div>
          <div className="chart-body">
            <Bar data={frequencyChartData} options={defaultChartOptions} />
          </div>
          <div className="chart-footer">
            <span>Resolution: 50 Hz</span>
            <span>Window: Hanning</span>
          </div>
        </div>

        {/* Performance Monitor */}
        <div className="chart-card wide">
          <div className="chart-header">
            <span className="chart-title">System Performance</span>
            <span className="chart-status live">
              <span className="status-dot" />
              LIVE
            </span>
          </div>
          <div className="chart-body">
            <Line data={performanceChartData} options={defaultChartOptions} />
          </div>
          <div className="chart-footer">
            <span>Metric: CPU Load</span>
            <span>Interval: 1h</span>
            <span>Avg: 72%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
