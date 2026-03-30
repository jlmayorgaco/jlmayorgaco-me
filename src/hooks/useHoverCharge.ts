'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PHYSICS } from '../lib/config';

interface HoverChargeState {
  charge: number; // 0-1 charge level
  isHovering: boolean;
  hoverDuration: number; // ms
}

interface UseHoverChargeOptions {
  chargeRate?: number; // charge per ms
  decayRate?: number; // decay per ms
  maxCharge?: number; // default: 1
  minCharge?: number; // default: from config
}

export function useHoverCharge(options: UseHoverChargeOptions = {}) {
  const {
    chargeRate = PHYSICS.hover.chargeRate,
    decayRate = PHYSICS.hover.decayRate,
    maxCharge = 1,
    minCharge = PHYSICS.hover.minCharge,
  } = options;

  const [state, setState] = useState<HoverChargeState>({
    charge: minCharge,
    isHovering: false,
    hoverDuration: 0,
  });

  const stateRef = useRef(state);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  stateRef.current = state;

  const startHover = useCallback(() => {
    setState(prev => ({ ...prev, isHovering: true }));
  }, []);

  const endHover = useCallback(() => {
    setState(prev => ({ ...prev, isHovering: false, hoverDuration: 0 }));
  }, []);

  useEffect(() => {
    let mounted = true;

    const update = () => {
      if (!mounted) return;

      const now = Date.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setState(prev => {
        let newCharge = prev.charge;
        let newDuration = prev.hoverDuration;

        if (prev.isHovering) {
          // Charging up with slight curve (slower near max)
          const chargeDelta = chargeRate * dt * (1 - prev.charge * 0.3);
          newCharge = Math.min(maxCharge, prev.charge + chargeDelta);
          newDuration = prev.hoverDuration + dt;
        } else {
          // Decaying down (slower decay)
          const decayDelta = decayRate * dt;
          newCharge = Math.max(minCharge, prev.charge - decayDelta);
        }

        return {
          charge: newCharge,
          isHovering: prev.isHovering,
          hoverDuration: newDuration,
        };
      });

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      mounted = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [chargeRate, decayRate, maxCharge, minCharge]);

  return {
    charge: state.charge,
    isHovering: state.isHovering,
    hoverDuration: state.hoverDuration,
    startHover,
    endHover,
  };
}
