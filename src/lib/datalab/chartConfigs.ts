/**
 * Chart Configurations
 * Pre-defined Chart.js configurations for dashboard modules
 */

import type { ChartOptions, ChartData } from 'chart.js';

export interface ChartTheme {
  primary: string;
  secondary: string;
  grid: string;
  text: string;
  background: string;
}

export const CHART_THEMES: Record<string, ChartTheme> = {
  signals: {
    primary: '#3fb9a7',
    secondary: '#2d8a7b',
    grid: 'rgba(63, 185, 167, 0.1)',
    text: '#4a524d',
    background: 'transparent',
  },
  networks: {
    primary: '#50c878',
    secondary: '#3da85e',
    grid: 'rgba(80, 200, 120, 0.1)',
    text: '#4a524d',
    background: 'transparent',
  },
  control: {
    primary: '#d29922',
    secondary: '#b8861a',
    grid: 'rgba(210, 153, 34, 0.1)',
    text: '#4a524d',
    background: 'transparent',
  },
  fpga: {
    primary: '#b8956a',
    secondary: '#9a7d5a',
    grid: 'rgba(184, 149, 106, 0.1)',
    text: '#4a524d',
    background: 'transparent',
  },
};

export function getTheme(category: string): ChartTheme {
  return CHART_THEMES[category] || CHART_THEMES.signals;
}

// Base chart options
const BASE_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(26, 31, 29, 0.9)',
      titleFont: {
        family: "'IBM Plex Mono', monospace",
        size: 11,
      },
      bodyFont: {
        family: "'IBM Plex Mono', monospace",
        size: 10,
      },
      padding: 8,
      cornerRadius: 4,
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          family: "'IBM Plex Mono', monospace",
          size: 10,
        },
        color: '#7a807c',
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          family: "'IBM Plex Mono', monospace",
          size: 10,
        },
        color: '#7a807c',
      },
    },
  },
};

// Waveform chart config (for signal analysis)
export function createWaveformConfig(
  data: Array<{ t: number; v: number }>,
  theme: ChartTheme,
  options: Partial<ChartOptions<'line'>> = {}
): ChartOptions<'line'> {
  return {
    ...BASE_OPTIONS,
    plugins: {
      ...BASE_OPTIONS.plugins,
    },
    scales: {
      ...BASE_OPTIONS.scales,
      x: {
        ...BASE_OPTIONS.scales?.x,
        title: {
          display: true,
          text: 'Time (s)',
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          color: theme.text,
        },
      },
      y: {
        ...BASE_OPTIONS.scales?.y,
        title: {
          display: true,
          text: 'Amplitude',
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          color: theme.text,
        },
      },
    },
    ...options,
  };
}

export function createWaveformData(
  data: Array<{ t: number; v: number }>,
  theme: ChartTheme
): ChartData<'line'> {
  return {
    labels: data.map(d => d.t.toFixed(3)),
    datasets: [
      {
        data: data.map(d => d.v),
        borderColor: theme.primary,
        backgroundColor: `${theme.primary}20`,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1.5,
      },
    ],
  };
}

// Spectrum chart config (for FFT display)
export function createSpectrumConfig(
  theme: ChartTheme,
  options: Partial<ChartOptions<'bar'>> = {}
): ChartOptions<'bar'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(26, 31, 29, 0.9)',
        titleFont: {
          family: "'IBM Plex Mono', monospace",
          size: 11,
        },
        bodyFont: {
          family: "'IBM Plex Mono', monospace",
          size: 10,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 10,
          },
          color: '#7a807c',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 10,
          },
          color: '#7a807c',
        },
        beginAtZero: true,
      },
    },
    ...options,
  };
}

export function createSpectrumData(
  frequencies: number[],
  magnitudes: number[],
  theme: ChartTheme
): ChartData<'bar'> {
  return {
    labels: frequencies.map(f => `${f} Hz`),
    datasets: [
      {
        data: magnitudes,
        backgroundColor: frequencies.map((_, i) => 
          i === 1 ? theme.primary : `${theme.primary}60`
        ),
        borderColor: theme.primary,
        borderWidth: 1,
        borderRadius: 2,
      },
    ],
  };
}

// Step response config (for control systems)
export function createStepResponseConfig(
  time: number[],
  response: number[],
  reference: number[],
  theme: ChartTheme,
  options: Partial<ChartOptions<'line'>> = {}
): ChartOptions<'line'> {
  return {
    ...BASE_OPTIONS,
    scales: {
      ...BASE_OPTIONS.scales,
      x: {
        ...BASE_OPTIONS.scales?.x,
        title: {
          display: true,
          text: 'Time (s)',
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          color: theme.text,
        },
      },
      y: {
        ...BASE_OPTIONS.scales?.y,
        title: {
          display: true,
          text: 'Response',
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          color: theme.text,
        },
        min: 0,
        max: 1.3,
      },
    },
    ...options,
  };
}

export function createStepResponseData(
  time: number[],
  response: number[],
  reference: number[],
  theme: ChartTheme
): ChartData<'line'> {
  return {
    labels: time.map(t => t.toFixed(2)),
    datasets: [
      {
        label: 'Response',
        data: response,
        borderColor: theme.primary,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: 'Reference',
        data: reference,
        borderColor: theme.secondary,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };
}

// Consensus convergence chart
export function createConsensusChartConfig(
  theme: ChartTheme
): ChartOptions<'line'> {
  return {
    ...BASE_OPTIONS,
    scales: {
      ...BASE_OPTIONS.scales,
      x: {
        ...BASE_OPTIONS.scales?.x,
        title: {
          display: true,
          text: 'Iteration',
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          color: theme.text,
        },
      },
      y: {
        ...BASE_OPTIONS.scales?.y,
        title: {
          display: true,
          text: 'Consensus Error',
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          color: theme.text,
        },
      },
    },
  };
}

export function createConsensusData(
  iterations: number[],
  errors: number[],
  theme: ChartTheme
): ChartData<'line'> {
  return {
    labels: iterations,
    datasets: [
      {
        data: errors,
        borderColor: theme.primary,
        backgroundColor: `${theme.primary}20`,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1.5,
      },
    ],
  };
}

// Pipeline utilization chart
export function createUtilizationData(
  stages: Array<{ name: string; utilization: number }>,
  theme: ChartTheme
): ChartData<'bar'> {
  return {
    labels: stages.map(s => s.name),
    datasets: [
      {
        data: stages.map(s => s.utilization),
        backgroundColor: stages.map(s => 
          s.utilization > 80 ? '#f85149' : 
          s.utilization > 60 ? '#d29922' : 
          theme.primary
        ),
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };
}

export function createUtilizationConfig(
  theme: ChartTheme
): ChartOptions<'bar'> {
  return {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(26, 31, 29, 0.9)',
        callbacks: {
          label: (context) => `${context.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 10,
          },
          color: '#7a807c',
          callback: (value) => `${value}%`,
        },
        max: 100,
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 10,
          },
          color: '#7a807c',
        },
      },
    },
  };
}
