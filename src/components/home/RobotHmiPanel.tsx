'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRobotArm } from '../../hooks/useRobotArm';
import RobotArmSvg from './RobotArmSvg';
import './RobotHmiPanel.css';

interface RobotHmiPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RobotHmiPanel({ isOpen, onClose }: RobotHmiPanelProps) {
  const {
    joints,
    mode,
    sequence,
    isActive,
    ledState,
    adjustJoint,
    home,
    park,
    pick,
    place,
    reset,
    startDemo,
    stopDemo,
    toggleMode,
  } = useRobotArm();

  const robotActionsRef = useRef({ home, park, pick, place, reset, startDemo, adjustJoint });
  
  robotActionsRef.current = { home, park, pick, place, reset, startDemo, adjustJoint };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    const handleRobotCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      const { action, data } = detail;
      
      switch (action) {
        case 'home':
          robotActionsRef.current.home();
          break;
        case 'park':
          robotActionsRef.current.park();
          break;
        case 'pick':
          robotActionsRef.current.pick();
          break;
        case 'place':
          robotActionsRef.current.place();
          break;
        case 'reset':
          robotActionsRef.current.reset();
          break;
        case 'demo':
          robotActionsRef.current.startDemo();
          break;
        case 'adjust':
          if (data?.joint && typeof data.delta === 'number') {
            const joint = data.joint as 'j1' | 'j2' | 'j3';
            robotActionsRef.current.adjustJoint(joint, data.delta);
          }
          break;
      }
    };

    window.addEventListener('robot:command', handleRobotCommand);
    return () => window.removeEventListener('robot:command', handleRobotCommand);
  }, []);

  if (!isOpen) return null;

  const getSequenceLabel = () => {
    switch (sequence) {
      case 'idle': return 'IDLE';
      case 'home': return 'HOMING';
      case 'park': return 'PARKING';
      case 'pick': return 'PICKING';
      case 'place': return 'PLACING';
      case 'demo': return 'DEMO';
      default: return 'IDLE';
    }
  };

  return (
    <div className="hmi-overlay" onClick={onClose} role="presentation">
      <div 
        className="hmi-panel" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="hmi-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="hmi-header">
          <div className="hmi-title">
            <span className="hmi-led" data-active={isActive} />
            <span className="hmi-label" id="hmi-title">ROBOT HMI</span>
            <span className="hmi-status">{getSequenceLabel()}</span>
          </div>
          <button className="hmi-close" onClick={onClose} aria-label="Close HMI panel">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>

        <div className="hmi-body">
          <div className="hmi-arm-display" aria-label="Robot arm visualization">
            <RobotArmSvg joints={joints} isActive={isActive} ledState={ledState} />
          </div>

          <div className="hmi-controls">
            <div className="hmi-joints">
              <div className="hmi-section-label">JOINT CONTROL</div>
              {(['j1', 'j2', 'j3'] as const).map(joint => (
                <div key={joint} className="joint-control">
                  <span className="joint-label">{joint.toUpperCase()}</span>
                  <span className="joint-value" aria-live="polite">{Math.round(joints[joint])}°</span>
                  <div className="joint-buttons">
                    <button 
                      className="joint-btn" 
                      onClick={() => adjustJoint(joint, -5)}
                      disabled={mode !== 'manual'}
                      aria-label={`Decrease ${joint}`}
                    >
                      −
                    </button>
                    <button 
                      className="joint-btn" 
                      onClick={() => adjustJoint(joint, 5)}
                      disabled={mode !== 'manual'}
                      aria-label={`Increase ${joint}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hmi-presets">
              <div className="hmi-section-label">PRESETS</div>
              <div className="preset-grid">
                <button className="preset-btn" onClick={home} disabled={mode !== 'manual'}>
                  HOME
                </button>
                <button className="preset-btn" onClick={park} disabled={mode !== 'manual'}>
                  PARK
                </button>
                <button className="preset-btn" onClick={pick} disabled={mode !== 'manual'}>
                  PICK
                </button>
                <button className="preset-btn" onClick={place} disabled={mode !== 'manual'}>
                  PLACE
                </button>
              </div>
            </div>

            <div className="hmi-mode">
              <div className="hmi-section-label">MODE</div>
              <button className="mode-btn" onClick={toggleMode}>
                {mode === 'demo' ? 'STOP' : mode === 'manual' ? 'MANUAL' : 'AUTO'}
              </button>
            </div>

            <div className="hmi-actions">
              {mode !== 'demo' ? (
                <button className="action-btn demo" onClick={startDemo}>
                  DEMO
                </button>
              ) : (
                <button className="action-btn stop" onClick={stopDemo}>
                  STOP
                </button>
              )}
              <button className="action-btn reset" onClick={reset}>
                RESET
              </button>
            </div>
          </div>
        </div>

        <div className="hmi-footer">
          <div className="hmi-info">
            <span>MODE: {mode.toUpperCase()}</span>
            <span>STATUS: {isActive ? 'RUNNING' : 'READY'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
