'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PHYSICS } from '../lib/config';

interface LedInstabilityState {
  instability: number; // 0-1, increases with sustained hover
  isFlickering: boolean;
  flickerIntensity: number; // 0-1
}

interface UseLedInstabilityOptions {
  sustainedHoverThreshold?: number; // ms before instability starts
  maxInstabilityTime?: number; // ms to reach max instability
  flickerProbability?: number; // chance per frame when unstable
  minFlickerDuration?: number; // ms
  maxFlickerDuration?: number; // ms
}

export function useLedInstability(
  isHovering: boolean,
  hoverDuration: number,
  options: UseLedInstabilityOptions = {}
) {
  const {
    sustainedHoverThreshold = PHYSICS.led.instabilityThreshold,
    maxInstabilityTime = PHYSICS.led.maxInstabilityTime,
    flickerProbability = PHYSICS.led.flickerProbability,
    minFlickerDuration = PHYSICS.led.minFlickerDuration,
    maxFlickerDuration = PHYSICS.led.maxFlickerDuration,
  } = options;

  const [state, setState] = useState<LedInstabilityState>({
    instability: 0,
    isFlickering: false,
    flickerIntensity: 0,
  });

  const flickerTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const frameRef = useRef<number>();

  // Calculate instability based on hover duration
  useEffect(() => {
    if (!isHovering) {
      setState(prev => ({ ...prev, instability: 0 }));
      return;
    }

    if (hoverDuration < sustainedHoverThreshold) {
      setState(prev => ({ ...prev, instability: 0 }));
      return;
    }

    const timeInInstability = hoverDuration - sustainedHoverThreshold;
    const instability = Math.min(1, timeInInstability / maxInstabilityTime);
    
    setState(prev => ({ ...prev, instability }));
  }, [isHovering, hoverDuration, sustainedHoverThreshold, maxInstabilityTime]);

  // Handle flickering
  const triggerFlicker = useCallback(() => {
    const duration = minFlickerDuration + Math.random() * (maxFlickerDuration - minFlickerDuration);
    const intensity = 0.3 + Math.random() * 0.4; // 0.3-0.7 intensity

    setState(prev => ({
      ...prev,
      isFlickering: true,
      flickerIntensity: intensity,
    }));

    flickerTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isFlickering: false,
        flickerIntensity: 0,
      }));
    }, duration);
  }, [minFlickerDuration, maxFlickerDuration]);

  useEffect(() => {
    if (!isHovering || state.instability <= 0) {
      if (flickerTimeoutRef.current) {
        clearTimeout(flickerTimeoutRef.current);
      }
      return;
    }

    const checkFlicker = () => {
      // Probability increases with instability
      const adjustedProbability = flickerProbability * (0.5 + state.instability * 1.5);
      
      if (Math.random() < adjustedProbability && !state.isFlickering) {
        triggerFlicker();
      }

      frameRef.current = requestAnimationFrame(checkFlicker);
    };

    frameRef.current = requestAnimationFrame(checkFlicker);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isHovering, state.instability, state.isFlickering, flickerProbability, triggerFlicker]);

  useEffect(() => {
    return () => {
      if (flickerTimeoutRef.current) {
        clearTimeout(flickerTimeoutRef.current);
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    instability: state.instability,
    isFlickering: state.isFlickering,
    flickerIntensity: state.flickerIntensity,
  };
}
