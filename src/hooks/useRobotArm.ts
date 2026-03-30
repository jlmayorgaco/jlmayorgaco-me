import { useState, useCallback, useRef, useEffect } from 'react';
import { ROBOT_CONFIG } from '../lib/config';

export interface JointState {
  j1: number;
  j2: number;
  j3: number;
}

export type RobotMode = 'manual' | 'auto' | 'demo';
export type RobotSequence = 'idle' | 'home' | 'park' | 'pick' | 'place' | 'demo';

const { jointLimits: JOINT_LIMITS, positions } = ROBOT_CONFIG;
const HOME_POSITION: JointState = positions.home;
const PARK_POSITION: JointState = positions.park;
const PICK_POSITION: JointState = positions.pick;
const PLACE_POSITION: JointState = positions.place;

export function useRobotArm() {
  const [joints, setJoints] = useState<JointState>({ ...HOME_POSITION });
  const [mode, setMode] = useState<RobotMode>('manual');
  const [sequence, setSequence] = useState<RobotSequence>('idle');
  const [isActive, setIsActive] = useState(false);
  const [ledState, setLedState] = useState<'off' | 'on' | 'blink'>('on');
  const demoTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearDemoTimeouts = useCallback(() => {
    demoTimeoutsRef.current.forEach(t => clearTimeout(t));
    demoTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearDemoTimeouts();
  }, [clearDemoTimeouts]);

  const clamp = (value: number, min: number, max: number) => 
    Math.max(min, Math.min(max, value));

  const adjustJoint = useCallback((joint: keyof JointState, delta: number) => {
    if (mode !== 'manual') return;
    
    setJoints(prev => ({
      ...prev,
      [joint]: clamp(prev[joint] + delta, JOINT_LIMITS[joint].min, JOINT_LIMITS[joint].max),
    }));
  }, [mode]);

  const setJoint = useCallback((joint: keyof JointState, value: number) => {
    setJoints(prev => ({
      ...prev,
      [joint]: clamp(value, JOINT_LIMITS[joint].min, JOINT_LIMITS[joint].max),
    }));
  }, []);

  const home = useCallback(() => {
    clearDemoTimeouts();
    setSequence('home');
    setJoints({ ...HOME_POSITION });
    const t = setTimeout(() => setSequence('idle'), 1000);
    demoTimeoutsRef.current.push(t);
  }, [clearDemoTimeouts]);

  const park = useCallback(() => {
    clearDemoTimeouts();
    setSequence('park');
    setJoints({ ...PARK_POSITION });
    const t = setTimeout(() => setSequence('idle'), 1000);
    demoTimeoutsRef.current.push(t);
  }, [clearDemoTimeouts]);

  const pick = useCallback(() => {
    if (mode !== 'manual') return;
    clearDemoTimeouts();
    setSequence('pick');
    setJoints({ ...PICK_POSITION });
    const t = setTimeout(() => setSequence('idle'), 1500);
    demoTimeoutsRef.current.push(t);
  }, [mode, clearDemoTimeouts]);

  const place = useCallback(() => {
    if (mode !== 'manual') return;
    clearDemoTimeouts();
    setSequence('place');
    setJoints({ ...PLACE_POSITION });
    const t = setTimeout(() => setSequence('idle'), 1500);
    demoTimeoutsRef.current.push(t);
  }, [mode, clearDemoTimeouts]);

  const reset = useCallback(() => {
    clearDemoTimeouts();
    setSequence('idle');
    setJoints({ ...HOME_POSITION });
    setMode('manual');
    setIsActive(false);
    setLedState('on');
  }, [clearDemoTimeouts]);

  const startDemo = useCallback(() => {
    clearDemoTimeouts();
    setMode('demo');
    setSequence('demo');
    setIsActive(true);
    setLedState('blink');

    const demoSequence = [
      { joints: HOME_POSITION, delay: 800 },
      { joints: PICK_POSITION, delay: 1200 },
      { joints: PLACE_POSITION, delay: 1200 },
      { joints: PARK_POSITION, delay: 1000 },
      { joints: HOME_POSITION, delay: 800 },
    ];

    let cumulativeDelay = 0;
    demoSequence.forEach((step, i) => {
      if (i > 0) cumulativeDelay += demoSequence[i - 1].delay;
      const t = setTimeout(() => setJoints(step.joints), cumulativeDelay);
      demoTimeoutsRef.current.push(t);
    });

    cumulativeDelay += demoSequence[demoSequence.length - 1].delay;
    const finalT = setTimeout(() => {
      setSequence('idle');
      setMode('manual');
      setIsActive(false);
      setLedState('on');
      demoTimeoutsRef.current = [];
    }, cumulativeDelay);
    demoTimeoutsRef.current.push(finalT);
  }, [clearDemoTimeouts]);

  const stopDemo = useCallback(() => {
    clearDemoTimeouts();
    setSequence('idle');
    setMode('manual');
    setIsActive(false);
    setLedState('on');
  }, [clearDemoTimeouts]);

  const toggleMode = useCallback(() => {
    if (mode === 'demo') {
      stopDemo();
      return;
    }
    setMode(prev => prev === 'manual' ? 'auto' : 'manual');
  }, [mode, stopDemo]);

  return {
    joints,
    mode,
    sequence,
    isActive,
    ledState,
    adjustJoint,
    setJoint,
    home,
    park,
    pick,
    place,
    reset,
    startDemo,
    stopDemo,
    toggleMode,
  };
}
