'use client';

import { useState, useEffect, useCallback } from 'react';
import './ConstructionLayer.css';

interface Piece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  type: 'block' | 'gear' | 'bolt' | 'wire' | 'chip';
  delay: number;
}

const PIECES: Piece[] = [
  { id: 1, x: 10, y: 20, rotation: 0, type: 'block', delay: 0 },
  { id: 2, x: 25, y: 15, rotation: 45, type: 'gear', delay: 100 },
  { id: 3, x: 40, y: 25, rotation: 0, type: 'bolt', delay: 200 },
  { id: 4, x: 55, y: 18, rotation: 90, type: 'chip', delay: 300 },
  { id: 5, x: 70, y: 22, rotation: 0, type: 'block', delay: 400 },
  { id: 6, x: 85, y: 15, rotation: 45, type: 'gear', delay: 500 },
  { id: 7, x: 15, y: 45, rotation: 0, type: 'wire', delay: 600 },
  { id: 8, x: 35, y: 50, rotation: 0, type: 'bolt', delay: 700 },
  { id: 9, x: 55, y: 48, rotation: 0, type: 'wire', delay: 800 },
  { id: 10, x: 75, y: 52, rotation: 0, type: 'chip', delay: 900 },
];

const ASCII_PIECES: Record<string, string> = {
  block: '┌───┐\n│   │\n└───┘',
  gear: ' ⚙ ',
  bolt: ' ⬡ ',
  wire: '═══',
  chip: '┌┬┐\n├┼┤\n└┴┘',
};

interface ConstructionLayerProps {
  isActive?: boolean;
  onComplete?: () => void;
  duration?: number;
}

export default function ConstructionLayer({ 
  isActive = false, 
  onComplete,
  duration = 5000 
}: ConstructionLayerProps) {
  const [visible, setVisible] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [assembled, setAssembled] = useState(false);

  const startConstruction = useCallback(() => {
    setVisible(true);
    setPieces([]);
    setAssembled(false);
    
    setTimeout(() => {
      setPieces(PIECES);
    }, 100);

    setTimeout(() => {
      setAssembled(true);
    }, 1500);

    setTimeout(() => {
      setVisible(false);
      setPieces([]);
      setAssembled(false);
      onComplete?.();
    }, duration);
  }, [duration, onComplete]);

  useEffect(() => {
    if (isActive) {
      startConstruction();
    }
  }, [isActive, startConstruction]);

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action?.type === 'construction') {
        startConstruction();
      }
    };
    window.addEventListener('terminal:ui-action', handler);
    return () => window.removeEventListener('terminal:ui-action', handler);
  }, [startConstruction]);

  if (!visible) return null;

  return (
    <div className="construction-overlay">
      <div className="construction-content">
        <div className="construction-title">
          <span className="construction-label">SYSTEM BUILD</span>
          <span className="construction-status">{assembled ? 'COMPLETE' : 'IN PROGRESS'}</span>
        </div>
        
        <div className="construction-pieces">
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className={`construction-piece piece-${piece.type} ${assembled ? 'assembled' : ''}`}
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                transform: `rotate(${piece.rotation}deg)`,
                transitionDelay: `${piece.delay}ms`,
              }}
            >
              <span className="piece-ascii">{ASCII_PIECES[piece.type]}</span>
            </div>
          ))}
        </div>

        {assembled && (
          <div className="construction-complete">
            <div className="complete-text">
              ✓ ASSEMBLY COMPLETE
            </div>
            <div className="complete-subtext">
              All systems nominal
            </div>
          </div>
        )}

        <div className="construction-progress">
          <div 
            className="progress-bar" 
            style={{ 
              width: assembled ? '100%' : '0%',
              transition: assembled ? 'width 0.3s ease-out' : 'none'
            }}
          />
        </div>
      </div>

      <div className="construction-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className={`particle particle-${i % 3}`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function triggerConstruction() {
  window.dispatchEvent(new CustomEvent('terminal:ui-action', { 
    detail: { type: 'construction' } 
  }));
}
