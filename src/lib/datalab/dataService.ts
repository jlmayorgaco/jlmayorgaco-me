/**
 * Data Service
 * Handles loading and caching of dashboard JSON data
 */

import type { DashboardData } from './types';

// Dashboard data imports
import openfreqbenchData from '../../data/datalab/openfreqbench.json';
import swarmLabData from '../../data/datalab/swarm-lab.json';
import controlWorkbenchData from '../../data/datalab/control-workbench.json';
import fpgaPipelineData from '../../data/datalab/fpga-pipeline.json';

const DASHBOARD_DATA: Record<string, DashboardData> = {
  'openfreqbench': openfreqbenchData as DashboardData,
  'swarm-lab': swarmLabData as DashboardData,
  'control-workbench': controlWorkbenchData as DashboardData,
  'fpga-pipeline': fpgaPipelineData as DashboardData,
};

export interface DataServiceOptions {
  cacheTimeout?: number;
  useCache?: boolean;
}

class DataService {
  private cache: Map<string, { data: DashboardData; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute default

  getDashboardData(dashboardId: string, options: DataServiceOptions = {}): DashboardData | null {
    const { useCache = true } = options;
    
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(dashboardId);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const data = DASHBOARD_DATA[dashboardId];
    if (!data) {
      console.warn(`DataService: No data found for dashboard ${dashboardId}`);
      return null;
    }

    // Update cache
    if (useCache) {
      this.cache.set(dashboardId, { data, timestamp: Date.now() });
    }

    return data;
  }

  async getDashboardDataAsync(dashboardId: string, options: DataServiceOptions = {}): Promise<DashboardData | null> {
    // Simulate async loading (in real app, this would be a fetch)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.getDashboardData(dashboardId, options));
      }, 100);
    });
  }

  refreshDashboard(dashboardId: string): DashboardData | null {
    // Clear cache and reload
    this.cache.delete(dashboardId);
    return this.getDashboardData(dashboardId, { useCache: false });
  }

  clearCache(): void {
    this.cache.clear();
  }

  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  getLastUpdate(dashboardId: string): Date | null {
    const cached = this.cache.get(dashboardId);
    return cached ? new Date(cached.timestamp) : null;
  }
}

export const dataService = new DataService();
export default dataService;
