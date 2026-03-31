'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  VALID_THEMES, 
  VALID_ACCENTS, 
  VALID_LAYOUTS, 
  ACCENT_COLORS,
  ANIMATION 
} from '../../lib/config';
import type { UIAction } from '../../lib/terminal/terminalTypes';

interface VisualCommandHandlerProps {
  onOpenHmi?: () => void;
  onCloseHmi?: () => void;
  onConstruction?: () => void;
}

export default function VisualCommandHandler({ onOpenHmi, onCloseHmi, onConstruction }: VisualCommandHandlerProps) {
  const [currentTheme, setCurrentTheme] = useState('lab');
  const [currentAccent, setCurrentAccent] = useState('teal');
  const [currentLayout, setCurrentLayout] = useState('default');
  const [isChaos, setIsChaos] = useState(false);
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimeouts = useCallback(() => {
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
  }, []);

  const handleUIAction = useCallback((action: UIAction) => {
    switch (action.type) {
      case 'theme':
        if (VALID_THEMES.includes(action.name)) {
          document.body.classList.remove(`theme-${currentTheme}`);
          document.body.classList.add(`theme-${action.name}`);
          setCurrentTheme(action.name);
        }
        break;

      case 'accent':
        if (VALID_ACCENTS.includes(action.name)) {
          const color = ACCENT_COLORS[action.name];
          if (color) {
            document.documentElement.style.setProperty('--accent-cyan', color);
            document.documentElement.style.setProperty('--accent-cyan-dim', adjustBrightness(color, -20));
            document.documentElement.style.setProperty('--accent-cyan-glow', `${color}40`);
            setCurrentAccent(action.name);
          }
        }
        break;

      case 'layout': {
        const board = document.querySelector('.lab-board');
        if (board && VALID_LAYOUTS.includes(action.name)) {
          board.classList.remove(`layout-${currentLayout}`);
          board.classList.add(`layout-${action.name}`);
          setCurrentLayout(action.name);
        }
        break;
      }

      case 'shuffle': {
        const board = document.querySelector('.lab-board');
        const modulesRow = document.querySelector('.modules-row');
        if (modulesRow && board) {
          board.classList.add('shuffling');
          board.classList.remove('shuffle-complete');
          
          requestAnimationFrame(() => {
            const cards = Array.from(modulesRow.children);
            const shuffled = cards.sort(() => Math.random() - 0.5);
            shuffled.forEach(card => modulesRow.appendChild(card));
            
            setTimeout(() => {
              board.classList.remove('shuffling');
              board.classList.add('shuffle-complete');
              setTimeout(() => board.classList.remove('shuffle-complete'), 500);
            }, ANIMATION.panelShuffleDuration);
          });
        }
        break;
      }

      case 'reset':
        document.body.classList.remove(`theme-${currentTheme}`);
        document.body.classList.add('theme-lab');
        setCurrentTheme('lab');
        
        document.documentElement.style.setProperty('--accent-cyan', ACCENT_COLORS.teal);
        document.documentElement.style.setProperty('--accent-cyan-dim', adjustBrightness(ACCENT_COLORS.teal, -20));
        document.documentElement.style.setProperty('--accent-cyan-glow', `${ACCENT_COLORS.teal}40`);
        setCurrentAccent('teal');
        
        setIsChaos(false);
        document.body.classList.remove('chaos-mode');
        clearAllTimeouts();
        setFocusedSection(null);
        document.body.classList.remove('focus-mode');
        break;

      case 'focus': {
        clearAllTimeouts();
        const prevSection = focusedSection ? document.getElementById(focusedSection) : null;
        if (prevSection) prevSection.classList.remove('focus-highlight');
        
        setFocusedSection(action.id);
        document.body.classList.add('focus-mode');
        
        const sectionEl = document.getElementById(action.id);
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          sectionEl.classList.add('focus-highlight');
          highlightTimeoutRef.current = setTimeout(() => sectionEl.classList.remove('focus-highlight'), ANIMATION.focusHighlightDuration);
        }
        
        focusTimeoutRef.current = setTimeout(() => {
          setFocusedSection(null);
          document.body.classList.remove('focus-mode');
        }, 3000);
        break;
      }

      case 'chaos':
        setIsChaos(true);
        document.body.classList.add('chaos-mode');
        break;

      case 'stabilize':
        setIsChaos(false);
        document.body.classList.remove('chaos-mode');
        break;

      case 'construction':
        onConstruction?.();
        break;

      case 'open-hmi':
        onOpenHmi?.();
        break;

      case 'close-hmi':
        onCloseHmi?.();
        break;
    }
  }, [currentTheme, currentAccent, currentLayout, onOpenHmi, onCloseHmi, focusedSection, clearAllTimeouts]);

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent<UIAction>).detail;
      if (action && action.type !== 'none') {
        handleUIAction(action);
      }
    };

    window.addEventListener('terminal:ui-action', handler);
    return () => window.removeEventListener('terminal:ui-action', handler);
  }, [handleUIAction]);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  return null;
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
