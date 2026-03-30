'use client';

import { useState, useEffect, useCallback } from 'react';
import FlipPanel from './FlipPanel';
import CoffeeMachine from './CoffeeMachine';

interface InfoPanelFlipProps {
  children: React.ReactNode;
}

export default function InfoPanelFlip({ children }: InfoPanelFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action?.type === 'flip-panel') {
        handleFlip();
      }
    };
    
    window.addEventListener('terminal:ui-action', handler);
    return () => window.removeEventListener('terminal:ui-action', handler);
  }, [handleFlip]);

  return (
    <FlipPanel 
      isFlipped={isFlipped} 
      frontContent={
        <>
          <FlipButton onFlip={handleFlip} />
          {children}
        </>
      }
      backContent={<CoffeeMachine />}
    />
  );
}

function FlipButton({ onFlip }: { onFlip: () => void }) {
  return (
    <button 
      className="flip-button" 
      onClick={onFlip}
      aria-label="Flip panel"
      title="Click to flip (or type 'flip' in terminal)"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M2 12h20M7 7l10 10M7 17L17 7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
