'use client';

import { useState, useCallback } from 'react';
import type { LabEvent, LabMode, LabStatus } from '../../lib/datalab/types';

interface UseDataLabOptions {
  initialModule?: string | null;
}

export function useDataLab(options: UseDataLabOptions = {}) {
  const { initialModule = null } = options;

  const [activeModule, setActiveModule] = useState<string | null>(initialModule);
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [mode, setMode] = useState<LabMode>('exploration');
  const [status, setStatus] = useState<LabStatus>('idle');
  const [events, setEvents] = useState<LabEvent[]>([]);

  const addEvent = useCallback((level: LabEvent['level'], source: string, message: string) => {
    const newEvent: LabEvent = {
      timestamp: new Date(),
      level,
      source,
      message,
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
  }, []);

  const loadModule = useCallback((moduleId: string) => {
    setStatus('loading');
    addEvent('info', 'LAB', `Loading module: ${moduleId}`);
    
    // Simulate loading delay
    setTimeout(() => {
      setActiveModule(moduleId);
      setStatus('active');
      addEvent('info', 'LAB', `Module ${moduleId} loaded successfully`);
    }, 500);
  }, [addEvent]);

  const unloadModule = useCallback(() => {
    if (activeModule) {
      addEvent('info', 'LAB', `Unloading module: ${activeModule}`);
    }
    setActiveModule(null);
    setActiveDataset(null);
    setActivePreset(null);
    setStatus('idle');
  }, [activeModule, addEvent]);

  const runSimulation = useCallback(() => {
    if (!activeModule) return;
    setStatus('active');
    addEvent('info', activeModule, 'Starting simulation...');
    
    setTimeout(() => {
      addEvent('info', activeModule, 'Simulation complete');
    }, 2000);
  }, [activeModule, addEvent]);

  const resetModule = useCallback(() => {
    if (!activeModule) return;
    addEvent('info', activeModule, 'Resetting to default state');
    setActiveDataset(null);
    setActivePreset(null);
  }, [activeModule, addEvent]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    // State
    activeModule,
    activeDataset,
    activePreset,
    mode,
    status,
    events,
    
    // Actions
    setActiveModule: loadModule,
    unloadModule,
    setActiveDataset,
    setActivePreset,
    setMode,
    runSimulation,
    resetModule,
    addEvent,
    clearEvents,
  };
}
