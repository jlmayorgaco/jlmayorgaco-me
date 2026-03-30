'use client';

import { useRef, useEffect, useState } from 'react';
import { usePanelLed } from './PanelStatusLed';

interface ElectricPanelProps {
  children: React.ReactNode;
  className?: string;
  ledPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  ledColor?: 'green' | 'amber' | 'cyan';
  showPulse?: boolean;
}

export default function ElectricPanel({
  children,
  className = '',
  ledPosition = 'top-right',
  ledColor = 'green',
  showPulse = false,
}: ElectricPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { brightness, glowIntensity, startHover, endHover, isFlickering } = usePanelLed();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const getLedColor = () => {
    switch (ledColor) {
      case 'amber': return '204, 153, 51';
      case 'cyan': return '63, 185, 167';
      case 'green':
      default: return '63, 185, 80';
    }
  };

  const getPositionStyles = () => {
    switch (ledPosition) {
      case 'top-left': return { top: '12px', left: '12px' };
      case 'bottom-right': return { bottom: '12px', right: '12px' };
      case 'bottom-left': return { bottom: '12px', left: '12px' };
      case 'top-right':
      default: return { top: '12px', right: '12px' };
    }
  };

  const color = getLedColor();
  const position = getPositionStyles();

  return (
    <div
      ref={panelRef}
      className={`electric-panel ${className}`}
      onMouseEnter={startHover}
      onMouseLeave={endHover}
      data-flickering={isFlickering}
    >
      {!reducedMotion && (
        <span
          className={`panel-led-indicator ${showPulse ? 'pulse' : ''}`}
          style={{
            position: 'absolute',
            ...position,
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: `rgba(${color}, ${brightness})`,
            boxShadow: `0 0 ${4 + glowIntensity * 8}px rgba(${color}, ${glowIntensity * 0.8})`,
            transition: 'background-color 0.1s linear, box-shadow 0.1s linear',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}
      {children}
    </div>
  );
}
