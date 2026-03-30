'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

// Animation types
export type AnimationType = 
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'scale-in'
  | 'pulse'
  | 'glow'
  | 'shake'
  | 'none';

export type AnimationIntensity = 'subtle' | 'normal' | 'intense';

// Animation state for individual elements
interface AnimationState {
  isAnimating: boolean;
  animationType: AnimationType;
  intensity: AnimationIntensity;
}

// Animation context state
interface AnimationContextState {
  // Global settings
  reducedMotion: boolean;
  globalIntensity: AnimationIntensity;
  
  // Actions
  setReducedMotion: (value: boolean) => void;
  setGlobalIntensity: (intensity: AnimationIntensity) => void;
  
  // Element animation
  animateElement: (id: string, type: AnimationType, duration?: number) => void;
  stopAnimation: (id: string) => void;
  isElementAnimating: (id: string) => boolean;
  
  // Stagger animations
  staggerAnimate: (ids: string[], type: AnimationType, staggerDelay?: number) => void;
  
  // Batch operations
  pauseAll: () => void;
  resumeAll: () => void;
  clearAll: () => void;
}

// Create context
const AnimationContext = createContext<AnimationContextState | undefined>(undefined);

// Provider props
interface AnimationProviderProps {
  children: ReactNode;
  defaultIntensity?: AnimationIntensity;
  respectReducedMotion?: boolean;
}

// Animation provider component
export function AnimationProvider({ 
  children, 
  defaultIntensity = 'normal',
  respectReducedMotion = true 
}: AnimationProviderProps) {
  // Check for reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);
  const [globalIntensity, setGlobalIntensity] = useState<AnimationIntensity>(defaultIntensity);
  const [animations, setAnimations] = useState<Map<string, AnimationState>>(new Map());
  const [isPaused, setIsPaused] = useState(false);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Check reduced motion preference on mount
  useEffect(() => {
    if (respectReducedMotion && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [respectReducedMotion]);

  // Get animation duration based on intensity
  const getDuration = useCallback((intensity: AnimationIntensity): number => {
    if (reducedMotion) return 0;
    
    const durations: Record<AnimationIntensity, number> = {
      subtle: 200,
      normal: 300,
      intense: 500,
    };
    return durations[intensity];
  }, [reducedMotion]);

  // Animate a single element
  const animateElement = useCallback((id: string, type: AnimationType, duration?: number) => {
    if (reducedMotion || isPaused) return;
    
    const actualDuration = duration ?? getDuration(globalIntensity);
    
    // Clear existing timeout for this element
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id)!);
    }
    
    // Set animation state
    setAnimations(prev => {
      const next = new Map(prev);
      next.set(id, {
        isAnimating: true,
        animationType: type,
        intensity: globalIntensity,
      });
      return next;
    });
    
    // Set timeout to clear animation
    const timeout = setTimeout(() => {
      setAnimations(prev => {
        const next = new Map(prev);
        const current = next.get(id);
        if (current) {
          next.set(id, { ...current, isAnimating: false });
        }
        return next;
      });
      timeoutsRef.current.delete(id);
    }, actualDuration);
    
    timeoutsRef.current.set(id, timeout);
  }, [reducedMotion, isPaused, globalIntensity, getDuration]);

  // Stop animation for an element
  const stopAnimation = useCallback((id: string) => {
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id)!);
      timeoutsRef.current.delete(id);
    }
    
    setAnimations(prev => {
      const next = new Map(prev);
      const current = next.get(id);
      if (current) {
        next.set(id, { ...current, isAnimating: false });
      }
      return next;
    });
  }, []);

  // Check if element is animating
  const isElementAnimating = useCallback((id: string): boolean => {
    return animations.get(id)?.isAnimating ?? false;
  }, [animations]);

  // Stagger animate multiple elements
  const staggerAnimate = useCallback((ids: string[], type: AnimationType, staggerDelay = 100) => {
    if (reducedMotion || isPaused) return;
    
    ids.forEach((id, index) => {
      setTimeout(() => {
        animateElement(id, type);
      }, index * staggerDelay);
    });
  }, [reducedMotion, isPaused, animateElement]);

  // Pause all animations
  const pauseAll = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume all animations
  const resumeAll = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Clear all animations
  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setAnimations(new Map());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  const value: AnimationContextState = {
    reducedMotion,
    globalIntensity,
    setReducedMotion,
    setGlobalIntensity,
    animateElement,
    stopAnimation,
    isElementAnimating,
    staggerAnimate,
    pauseAll,
    resumeAll,
    clearAll,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

// Custom hook for animation context
export function useAnimation(): AnimationContextState {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}

// Hook for animating a specific element
export function useElementAnimation(id: string) {
  const { animateElement, stopAnimation, isElementAnimating } = useAnimation();
  
  const animate = useCallback((type: AnimationType, duration?: number) => {
    animateElement(id, type, duration);
  }, [animateElement, id]);
  
  const stop = useCallback(() => {
    stopAnimation(id);
  }, [stopAnimation, id]);
  
  const isAnimating = isElementAnimating(id);
  
  return { animate, stop, isAnimating };
}

// HOC for adding animation capabilities to components
export function withAnimation<P extends object>(
  Component: React.ComponentType<P>,
  id: string,
  defaultAnimation: AnimationType = 'fade-in'
) {
  return function AnimatedComponent(props: P) {
    const { animate, isAnimating } = useElementAnimation(id);
    
    useEffect(() => {
      animate(defaultAnimation);
    }, [animate]);
    
    return (
      <Component 
        {...props} 
        data-animating={isAnimating}
        data-animation-id={id}
      />
    );
  };
}
