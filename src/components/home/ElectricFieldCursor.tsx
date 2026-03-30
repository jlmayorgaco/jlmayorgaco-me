'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface ElectricFieldCursorProps {
  children: React.ReactNode;
}

interface CursorState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isMoving: boolean;
}

export default function ElectricFieldCursor({ children }: ElectricFieldCursorProps) {
  const [cursor, setCursor] = useState<CursorState>({
    x: 0, y: 0, vx: 0, vy: 0, isMoving: false,
  });
  const [reducedMotion, setReducedMotion] = useState(false);
  const prevPos = useRef({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const vx = e.clientX - prevPos.current.x;
    const vy = e.clientY - prevPos.current.y;
    
    prevPos.current = { x: e.clientX, y: e.clientY };
    
    setCursor({ x: e.clientX, y: e.clientY, vx, vy, isMoving: true });
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCursor(prev => ({ ...prev, isMoving: false, vx: 0, vy: 0 }));
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

  // Set CSS custom properties for cursor position (for any CSS-based effects)
  useEffect(() => {
    if (reducedMotion) return;
    
    document.documentElement.style.setProperty('--cursor-x', `${cursor.x}px`);
    document.documentElement.style.setProperty('--cursor-y', `${cursor.y}px`);
    document.documentElement.style.setProperty('--cursor-vx', `${cursor.vx}`);
    document.documentElement.style.setProperty('--cursor-vy', `${cursor.vy}`);
    document.documentElement.style.setProperty('--cursor-active', cursor.isMoving ? '1' : '0');
  }, [cursor, reducedMotion]);

  return (
    <div className="electric-field-container" data-reduced-motion={reducedMotion}>
      {children}
    </div>
  );
}
