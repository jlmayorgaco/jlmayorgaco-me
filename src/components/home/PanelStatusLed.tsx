'use client';

import { useHoverCharge } from '../../hooks/useHoverCharge';
import { useLedInstability } from '../../hooks/useLedInstability';
import { useEffect, useState } from 'react';

interface PanelStatusLedProps {
  className?: string;
  reducedMotion?: boolean;
}

export default function PanelStatusLed({ className = '', reducedMotion = false }: PanelStatusLedProps) {
  const { charge, isHovering, hoverDuration, startHover, endHover } = useHoverCharge({
    chargeRate: 0.003,
    decayRate: 0.0008,
    minCharge: 0.08,
  });

  const { isFlickering, flickerIntensity } = useLedInstability(isHovering, hoverDuration, {
    sustainedHoverThreshold: 4000,
    maxInstabilityTime: 10000,
    flickerProbability: 0.012,
  });

  // Calculate final brightness
  let brightness = charge;
  
  if (!reducedMotion && isFlickering) {
    // During flicker, dip the brightness
    brightness = charge * (1 - flickerIntensity * 0.6);
  }

  // Calculate glow intensity (follows brightness but with curve)
  const glowIntensity = Math.pow(brightness, 1.5) * 0.8;

  return (
    <span
      className={`panel-status-led ${className}`}
      onMouseEnter={startHover}
      onMouseLeave={endHover}
      style={{
        '--led-brightness': brightness,
        '--led-glow': glowIntensity,
      } as React.CSSProperties}
    />
  );
}

// Hook version for use in other components
export function usePanelLed() {
  const { charge, isHovering, hoverDuration, startHover, endHover } = useHoverCharge({
    chargeRate: 0.003,
    decayRate: 0.0008,
    minCharge: 0.08,
  });

  const { isFlickering, flickerIntensity, instability } = useLedInstability(isHovering, hoverDuration, {
    sustainedHoverThreshold: 4000,
    maxInstabilityTime: 10000,
    flickerProbability: 0.012,
  });

  let brightness = charge;
  if (isFlickering) {
    brightness = charge * (1 - flickerIntensity * 0.6);
  }

  const glowIntensity = Math.pow(brightness, 1.5) * 0.8;

  return {
    brightness,
    glowIntensity,
    isHovering,
    hoverDuration,
    isFlickering,
    instability,
    startHover,
    endHover,
  };
}
