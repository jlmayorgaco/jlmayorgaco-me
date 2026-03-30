'use client';

import { useState, useEffect } from 'react';
import './CoffeeMachine.css';

export default function CoffeeMachine() {
  const [brewing, setBrewing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cupFilled, setCupFilled] = useState(false);

  useEffect(() => {
    if (brewing) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setBrewing(false);
            setCupFilled(true);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [brewing]);

  const startBrew = () => {
    if (!brewing && !cupFilled) {
      setBrewing(true);
      setProgress(0);
    }
  };

  const reset = () => {
    setBrewing(false);
    setProgress(0);
    setCupFilled(false);
  };

  return (
    <div className="coffee-machine">
      <div className="coffee-header">
        <span className="coffee-label">ESPRESSO-01</span>
        <span className={`coffee-status ${brewing ? 'brewing' : cupFilled ? 'ready' : 'idle'}`}>
          {brewing ? 'BREWING...' : cupFilled ? 'READY' : 'IDLE'}
        </span>
      </div>

      <div className="coffee-body">
        {/* Machine Display */}
        <div className="machine-display">
          <div className="display-screen">
            <div className="screen-content">
              <span className="temp">93°C</span>
              <span className="pressure">9 bar</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="brew-progress">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Coffee Cup */}
        <div className="cup-container">
          <div className={`cup ${cupFilled ? 'filled' : ''}`}>
            <div className="cup-body">
              <div 
                className="coffee-liquid"
                style={{ height: cupFilled ? '80%' : `${progress * 0.8}%` }}
              />
              <div className="cup-handle" />
            </div>
            <div className="cup-saucer" />
          </div>
          
          {/* Steam Animation */}
          {(brewing || cupFilled) && (
            <div className="steam-container">
              <span className="steam steam-1" />
              <span className="steam steam-2" />
              <span className="steam steam-3" />
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="machine-controls">
          <button 
            className={`control-btn brew ${brewing ? 'active' : ''}`}
            onClick={startBrew}
            disabled={brewing || cupFilled}
          >
            BREW
          </button>
          <button 
            className="control-btn reset"
            onClick={reset}
            disabled={brewing}
          >
            RESET
          </button>
        </div>
      </div>

      <div className="coffee-footer">
        <div className="machine-info">
          <span>Pressure: 9 bar</span>
          <span>Temp: 93°C</span>
        </div>
        <span className="flip-hint">Type 'flip' to return</span>
      </div>
    </div>
  );
}
