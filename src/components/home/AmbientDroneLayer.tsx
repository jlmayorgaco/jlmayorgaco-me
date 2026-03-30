'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DroneSvg from './DroneSvg';

interface DroneState {
  id: number;
  x: number;
  y: number;
  variant: 'alpha' | 'beta';
  path: number;
  visible: boolean;
}

const FLIGHT_PATHS = [
  { startX: -120, startY: 80, endX: 110, endY: 60, duration: 18000 },
  { startX: 110, startY: 60, endX: -120, endY: 100, duration: 22000 },
  { startX: -120, startY: 120, endX: 110, endY: 40, duration: 20000 },
];

const MIN_SPAWN_INTERVAL = 15000;
const MAX_SPAWN_INTERVAL = 30000;
const MAX_DRONES = 2;

function getRandomSpawnDelay(): number {
  return Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) + MIN_SPAWN_INTERVAL;
}

function getRandomPath(): number {
  return Math.floor(Math.random() * FLIGHT_PATHS.length);
}

export default function AmbientDroneLayer() {
  const [drones, setDrones] = useState<DroneState[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const droneIdRef = useRef(0);
  const spawnTimeoutRef = useRef<number | null>(null);

  const spawnDrone = useCallback(() => {
    setDrones(prev => {
      if (prev.filter(d => d.visible).length >= MAX_DRONES) return prev;
      
      const id = ++droneIdRef.current;
      const path = getRandomPath();
      const pathData = FLIGHT_PATHS[path];
      
      return [
        ...prev,
        {
          id,
          x: pathData.startX,
          y: pathData.startY,
          variant: id % 2 === 0 ? 'alpha' : 'beta',
          path,
          visible: true,
        },
      ];
    });

    const nextDelay = getRandomSpawnDelay();
    spawnTimeoutRef.current = window.setTimeout(spawnDrone, nextDelay);
  }, []);

  const removeDrone = useCallback((id: number) => {
    setDrones(prev => prev.map(d => d.id === id ? { ...d, visible: false } : d));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const initialDelay = setTimeout(spawnDrone, 5000);
    
    return () => {
      clearTimeout(initialDelay);
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
    };
  }, [reducedMotion, spawnDrone]);

  if (reducedMotion) return null;

  return (
    <>
      <style>{`
        @keyframes drone-flight-0 {
          0% { transform: translate(-100px, 80px) scale(0.8); }
          50% { transform: translate(350px, 60px) scale(1); }
          100% { transform: translate(800px, 80px) scale(0.8); }
        }
        
        @keyframes drone-flight-1 {
          0% { transform: translate(800px, 60px) scale(0.8); }
          50% { transform: translate(350px, 100px) scale(1); }
          100% { transform: translate(-100px, 120px) scale(0.8); }
        }
        
        @keyframes drone-flight-2 {
          0% { transform: translate(-100px, 120px) scale(0.8); }
          50% { transform: translate(350px, 40px) scale(1.1); }
          100% { transform: translate(800px, 60px) scale(0.8); }
        }
        
        @keyframes prop-spin {
          0% { transform: rotate(0deg) scaleY(1); opacity: 0.5; }
          25% { transform: rotate(90deg) scaleY(0.3); opacity: 0.3; }
          50% { transform: rotate(180deg) scaleY(1); opacity: 0.5; }
          75% { transform: rotate(270deg) scaleY(0.3); opacity: 0.3; }
          100% { transform: rotate(360deg) scaleY(1); opacity: 0.5; }
        }
        
        @keyframes led-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes led-blink-2 {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes drone-hover {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        
        .drone-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }
        
        .drone-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          animation-timing-function: linear;
          animation-iteration-count: 1;
        }
        
        .drone-wrapper-0 { animation-name: drone-flight-0, drone-hover; animation-duration: 18s, 2s; }
        .drone-wrapper-1 { animation-name: drone-flight-1, drone-hover; animation-duration: 22s, 2.5s; }
        .drone-wrapper-2 { animation-name: drone-flight-2, drone-hover; animation-duration: 20s, 1.8s; }
        
        .drone-wrapper.exit {
          animation: none;
          transition: opacity 1s ease-out, transform 1s ease-out;
          opacity: 0;
          transform: translateY(200px) scale(0.5);
        }
        
        .prop-1 { animation: prop-spin 0.1s linear infinite; transform-origin: center; }
        .prop-2 { animation: prop-spin 0.1s linear infinite reverse; transform-origin: center; }
        .prop-3 { animation: prop-spin 0.1s linear infinite; transform-origin: center; }
        .prop-4 { animation: prop-spin 0.1s linear infinite reverse; transform-origin: center; }
        
        .led-blink { animation: led-blink 1s ease-in-out infinite; }
        .led-blink-2 { animation: led-blink-2 0.8s ease-in-out infinite; }
        
        @media (max-width: 768px) {
          .drone-wrapper { display: none; }
        }
      `}</style>
      
      <div className="drone-container" aria-hidden="true">
        {drones.map(drone => (
          <div
            key={drone.id}
            className={`drone-wrapper drone-wrapper-${drone.path}`}
            onAnimationEnd={() => removeDrone(drone.id)}
            style={{
              animation: `drone-flight-${drone.path} ${FLIGHT_PATHS[drone.path].duration}ms linear forwards, drone-hover ${1.5 + Math.random()}s ease-in-out infinite`,
            }}
          >
            <DroneSvg variant={drone.variant} size={60} />
          </div>
        ))}
      </div>
    </>
  );
}
