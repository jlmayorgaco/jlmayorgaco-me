'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { VALID_THEMES, VALID_ACCENTS, VALID_LAYOUTS, ACCENT_COLORS, type Theme, type Accent, type Layout } from '../lib/config';

// Theme context state interface
interface ThemeContextState {
  // Current values
  theme: Theme;
  accent: Accent;
  layout: Layout;
  isChaos: boolean;
  focusedSection: string | null;
  
  // Actions
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
  setLayout: (layout: Layout) => void;
  toggleChaos: () => void;
  resetAll: () => void;
  focusSection: (id: string) => void;
  clearFocus: () => void;
  
  // Utility
  isValidTheme: (value: string) => boolean;
  isValidAccent: (value: string) => boolean;
  isValidLayout: (value: string) => boolean;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
  initialAccent?: Accent;
  initialLayout?: Layout;
}

// Helper to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Theme provider component
export function ThemeProvider({ 
  children, 
  initialTheme = 'lab',
  initialAccent = 'teal',
  initialLayout = 'default'
}: ThemeProviderProps) {
  // State
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [accent, setAccentState] = useState<Accent>(initialAccent);
  const [layout, setLayoutState] = useState<Layout>(initialLayout);
  const [isChaos, setIsChaos] = useState(false);
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const [focusTimeout, setFocusTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Apply theme to DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    // Remove old theme class
    document.body.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        document.body.classList.remove(cls);
      }
    });
    // Add new theme class
    document.body.classList.add(`theme-${newTheme}`);
  }, []);

  // Apply accent to DOM
  const applyAccent = useCallback((newAccent: Accent) => {
    const color = ACCENT_COLORS[newAccent];
    if (color) {
      document.documentElement.style.setProperty('--accent-cyan', color);
      document.documentElement.style.setProperty('--accent-cyan-dim', adjustBrightness(color, -20));
      document.documentElement.style.setProperty('--accent-cyan-glow', `${color}40`);
    }
  }, []);

  // Apply layout to DOM
  const applyLayout = useCallback((newLayout: Layout) => {
    const board = document.querySelector('.lab-board');
    if (board) {
      // Remove old layout classes
      VALID_LAYOUTS.forEach(l => board.classList.remove(`layout-${l}`));
      // Add new layout class
      board.classList.add(`layout-${newLayout}`);
    }
  }, []);

  // Apply chaos mode
  const applyChaos = useCallback((active: boolean) => {
    if (active) {
      document.body.classList.add('chaos-mode');
    } else {
      document.body.classList.remove('chaos-mode');
    }
  }, []);

  // Apply focus
  const applyFocus = useCallback((id: string | null) => {
    // Clear previous highlight
    if (focusedSection) {
      const prevEl = document.getElementById(focusedSection);
      if (prevEl) prevEl.classList.remove('focus-highlight');
    }
    
    if (id) {
      document.body.classList.add('focus-mode');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('focus-highlight');
        
        // Auto-clear after 3 seconds
        const timeout = setTimeout(() => {
          clearFocus();
        }, 3000);
        setFocusTimeout(timeout);
      }
    } else {
      document.body.classList.remove('focus-mode');
    }
  }, [focusedSection]);

  // Setters with DOM updates
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  const setAccent = useCallback((newAccent: Accent) => {
    setAccentState(newAccent);
    applyAccent(newAccent);
  }, [applyAccent]);

  const setLayout = useCallback((newLayout: Layout) => {
    setLayoutState(newLayout);
    applyLayout(newLayout);
  }, [applyLayout]);

  const toggleChaos = useCallback(() => {
    setIsChaos(prev => {
      const newValue = !prev;
      applyChaos(newValue);
      return newValue;
    });
  }, [applyChaos]);

  const resetAll = useCallback(() => {
    // Clear focus timeout
    if (focusTimeout) clearTimeout(focusTimeout);
    
    // Reset states
    setTheme('lab');
    setAccent('teal');
    setLayout('default');
    setIsChaos(false);
    setFocusedSection(null);
    
    // Reset DOM
    applyTheme('lab');
    applyAccent('teal');
    applyLayout('default');
    applyChaos(false);
    applyFocus(null);
  }, [applyTheme, applyAccent, applyLayout, applyChaos, applyFocus, focusTimeout]);

  const focusSection = useCallback((id: string) => {
    // Clear existing timeout
    if (focusTimeout) clearTimeout(focusTimeout);
    
    setFocusedSection(id);
    applyFocus(id);
  }, [applyFocus, focusTimeout]);

  const clearFocus = useCallback(() => {
    if (focusTimeout) clearTimeout(focusTimeout);
    setFocusedSection(null);
    applyFocus(null);
  }, [applyFocus, focusTimeout]);

  // Validation helpers
  const isValidTheme = useCallback((value: string): boolean => {
    return VALID_THEMES.includes(value as Theme);
  }, []);

  const isValidAccent = useCallback((value: string): boolean => {
    return VALID_ACCENTS.includes(value as Accent);
  }, []);

  const isValidLayout = useCallback((value: string): boolean => {
    return VALID_LAYOUTS.includes(value as Layout);
  }, []);

  // Initialize on mount
  useEffect(() => {
    applyTheme(theme);
    applyAccent(accent);
    applyLayout(layout);
    
    return () => {
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, []);

  // Update DOM when states change
  useEffect(() => {
    applyChaos(isChaos);
  }, [isChaos, applyChaos]);

  const value: ThemeContextState = {
    theme,
    accent,
    layout,
    isChaos,
    focusedSection,
    setTheme,
    setAccent,
    setLayout,
    toggleChaos,
    resetAll,
    focusSection,
    clearFocus,
    isValidTheme,
    isValidAccent,
    isValidLayout,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme(): ThemeContextState {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for components that need theme but want to handle errors gracefully
export function useThemeSafe(): ThemeContextState | null {
  const context = useContext(ThemeContext);
  return context ?? null;
}
