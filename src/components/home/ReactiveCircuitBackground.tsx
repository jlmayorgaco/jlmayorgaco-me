'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CIRCUIT_CONFIG } from '../../lib/config';

interface CursorFieldState {
  x: number;
  y: number;
  isActive: boolean;
}

interface ReactiveNode {
  cx: number;
  cy: number;
  baseOpacity: number;
  activeOpacity: number;
}

// Node positions from the SVG (scaled to viewBox coordinates)
const NODES: ReactiveNode[] = [
  // Cluster 1 (top-right)
  { cx: 1200, cy: 50, baseOpacity: 0.3, activeOpacity: 0.7 },
  { cx: 1400, cy: 190, baseOpacity: 0.3, activeOpacity: 0.6 },
  { cx: 1280, cy: 80, baseOpacity: 0.25, activeOpacity: 0.55 },
  { cx: 1320, cy: 190, baseOpacity: 0.25, activeOpacity: 0.55 },
  { cx: 1380, cy: 120, baseOpacity: 0.25, activeOpacity: 0.5 },
  // Cluster 2 (bottom-left)
  { cx: 50, cy: 700, baseOpacity: 0.3, activeOpacity: 0.7 },
  { cx: 280, cy: 550, baseOpacity: 0.3, activeOpacity: 0.6 },
  { cx: 150, cy: 670, baseOpacity: 0.25, activeOpacity: 0.55 },
  { cx: 200, cy: 550, baseOpacity: 0.25, activeOpacity: 0.55 },
  { cx: 230, cy: 570, baseOpacity: 0.25, activeOpacity: 0.5 },
  // Cluster 3 (top-left)
  { cx: 100, cy: 100, baseOpacity: 0.3, activeOpacity: 0.7 },
  { cx: 250, cy: 230, baseOpacity: 0.3, activeOpacity: 0.6 },
  { cx: 150, cy: 230, baseOpacity: 0.25, activeOpacity: 0.55 },
  { cx: 180, cy: 320, baseOpacity: 0.25, activeOpacity: 0.5 },
  // Cluster 4 (mid-right)
  { cx: 1350, cy: 400, baseOpacity: 0.3, activeOpacity: 0.7 },
  { cx: 1200, cy: 570, baseOpacity: 0.3, activeOpacity: 0.6 },
  { cx: 1270, cy: 430, baseOpacity: 0.25, activeOpacity: 0.55 },
  { cx: 1350, cy: 470, baseOpacity: 0.25, activeOpacity: 0.5 },
  // Cluster 5 (bottom-right)
  { cx: 1100, cy: 800, baseOpacity: 0.3, activeOpacity: 0.7 },
  { cx: 1280, cy: 780, baseOpacity: 0.3, activeOpacity: 0.6 },
  { cx: 1150, cy: 700, baseOpacity: 0.25, activeOpacity: 0.55 },
  { cx: 1280, cy: 730, baseOpacity: 0.25, activeOpacity: 0.55 },
  // Cluster 6 (center-left)
  { cx: 80, cy: 450, baseOpacity: 0.25, activeOpacity: 0.6 },
  { cx: 180, cy: 380, baseOpacity: 0.25, activeOpacity: 0.55 },
  { cx: 150, cy: 450, baseOpacity: 0.2, activeOpacity: 0.5 },
  // Cluster 7 (center)
  { cx: 700, cy: 150, baseOpacity: 0.2, activeOpacity: 0.5 },
  { cx: 850, cy: 180, baseOpacity: 0.2, activeOpacity: 0.5 },
  { cx: 850, cy: 320, baseOpacity: 0.2, activeOpacity: 0.45 },
  // Vias
  { cx: 1280, cy: 150, baseOpacity: 0.2, activeOpacity: 0.6 },
  { cx: 150, cy: 230, baseOpacity: 0.2, activeOpacity: 0.55 },
  { cx: 1270, cy: 430, baseOpacity: 0.2, activeOpacity: 0.55 },
  { cx: 1150, cy: 700, baseOpacity: 0.2, activeOpacity: 0.55 },
  { cx: 180, cy: 420, baseOpacity: 0.2, activeOpacity: 0.5 },
];

const { influenceRadius: INFLUENCE_RADIUS, falloffCurve: FALLOFF_CURVE } = CIRCUIT_CONFIG;

function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function mapCursorToSvg(cursorX: number, cursorY: number): { x: number; y: number } {
  // Map screen coordinates to SVG viewBox (1440x900)
  const scaleX = 1440 / window.innerWidth;
  const scaleY = 900 / window.innerHeight;
  return {
    x: cursorX * scaleX,
    y: cursorY * scaleY,
  };
}

interface ReactiveCircuitBackgroundProps {
  reducedMotion?: boolean;
}

export default function ReactiveCircuitBackground({ reducedMotion = false }: ReactiveCircuitBackgroundProps) {
  const [cursor, setCursor] = useState<CursorFieldState>({ x: 0, y: 0, isActive: false });
  const [nodeOpacities, setNodeOpacities] = useState<number[]>(NODES.map(n => n.baseOpacity));
  const rafRef = useRef<number>();
  const cursorRef = useRef(cursor);
  const isActiveRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  cursorRef.current = cursor;

  const updateNodeOpacities = useCallback(() => {
    if (!cursor.isActive || reducedMotion) {
      // Slowly decay back to base
      setNodeOpacities(prev => 
        prev.map((opacity, i) => {
          const target = NODES[i].baseOpacity;
          const diff = target - opacity;
          return opacity + diff * 0.05;
        })
      );
    } else {
      // React to cursor
      const svgPos = mapCursorToSvg(cursor.x, cursor.y);
      
      setNodeOpacities(prev =>
        prev.map((_, i) => {
          const node = NODES[i];
          const dist = getDistance(svgPos.x, svgPos.y, node.cx, node.cy);
          
          if (dist > INFLUENCE_RADIUS) {
            // Outside influence, decay to base
            return prev[i] + (node.baseOpacity - prev[i]) * 0.08;
          }
          
          // Inside influence radius
          const influence = Math.pow(1 - dist / INFLUENCE_RADIUS, FALLOFF_CURVE);
          const targetOpacity = node.baseOpacity + (node.activeOpacity - node.baseOpacity) * influence;
          
          // Smooth transition
          return prev[i] + (targetOpacity - prev[i]) * 0.15;
        })
      );
    }

    rafRef.current = requestAnimationFrame(updateNodeOpacities);
  }, [cursor.x, cursor.y, cursor.isActive, reducedMotion]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(updateNodeOpacities);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateNodeOpacities]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    isActiveRef.current = true;
    setCursor({ x: e.clientX, y: e.clientY, isActive: true });
    
    // Clear existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Set timeout to mark cursor as inactive after 100ms of no movement
    timeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      setCursor(prev => ({ ...prev, isActive: false }));
    }, 100);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleMouseMove, reducedMotion]);

  if (reducedMotion) {
    return (
      <style>{`
        .trace-node {
          opacity: var(--base-opacity) !important;
        }
      `}</style>
    );
  }

  return (
    <style>{`
      .trace-node {
        transition: opacity 0.05s linear;
      }
      ${NODES.map((_, i) => `
        .trace-node:nth-of-type(${i + 1}) {
          opacity: ${nodeOpacities[i] || _.baseOpacity};
        }
      `).join('')}
    `}</style>
  );
}
