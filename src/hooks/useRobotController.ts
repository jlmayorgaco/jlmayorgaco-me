'use client';

import { useEffect, useRef, useCallback } from 'react';

interface RobotControllerProps {
  onHome: () => void;
  onPark: () => void;
  onPick: () => void;
  onPlace: () => void;
  onReset: () => void;
  onDemo: () => void;
  onAdjust: (joint: 'j1' | 'j2' | 'j3', delta: number) => void;
}

export function useRobotController({
  onHome,
  onPark,
  onPick,
  onPlace,
  onReset,
  onDemo,
  onAdjust,
}: RobotControllerProps) {
  const callbacksRef = useRef({ onHome, onPark, onPick, onPlace, onReset, onDemo, onAdjust });
  
  callbacksRef.current = { onHome, onPark, onPick, onPlace, onReset, onDemo, onAdjust };

  const handleRobotCommand = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail) return;

    const { action, data } = detail;
    
    switch (action) {
      case 'home':
        callbacksRef.current.onHome();
        break;
      case 'park':
        callbacksRef.current.onPark();
        break;
      case 'pick':
        callbacksRef.current.onPick();
        break;
      case 'place':
        callbacksRef.current.onPlace();
        break;
      case 'reset':
        callbacksRef.current.onReset();
        break;
      case 'demo':
        callbacksRef.current.onDemo();
        break;
      case 'adjust':
        if (data?.joint && typeof data.delta === 'number') {
          callbacksRef.current.onAdjust(data.joint, data.delta);
        }
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('robot:command', handleRobotCommand);
    return () => window.removeEventListener('robot:command', handleRobotCommand);
  }, [handleRobotCommand]);
}
