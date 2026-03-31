'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataService } from '../lib/datalab/dataService';
import type { DashboardData } from '../lib/datalab/types';

interface UseDashboardDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  useCache?: boolean;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void;
  setAutoRefresh: (enabled: boolean) => void;
}

export function useDashboardData(
  dashboardId: string,
  options: UseDashboardDataOptions = {}
): UseDashboardDataReturn {
  const { autoRefresh = false, refreshInterval = 60000, useCache = true } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshEnabled, setRefreshEnabled] = useState(autoRefresh);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    if (!dashboardId) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await dataService.getDashboardDataAsync(dashboardId, { useCache });
      
      if (result) {
        setData(result);
        setLastUpdate(new Date());
      } else {
        setError(`No data found for dashboard: ${dashboardId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dashboardId, useCache]);

  const refresh = useCallback(() => {
    dataService.clearCache();
    loadData();
  }, [loadData]);

  const setAutoRefresh = useCallback((enabled: boolean) => {
    setRefreshEnabled(enabled);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto refresh
  useEffect(() => {
    if (refreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshEnabled, refreshInterval, refresh]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    setAutoRefresh,
  };
}

export default useDashboardData;
