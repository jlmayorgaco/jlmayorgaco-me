'use client';

import { useState, useEffect } from 'react';
import './StatusBar.css';

export default function StatusBar() {
  const [signalIntegrity, setSignalIntegrity] = useState(98.2);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalIntegrity(prev => {
        const drift = (Math.random() - 0.5) * 0.4;
        return Math.round((prev + drift) * 10) / 10;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-dot active" />
        <span className="status-label">System Status</span>
        <span className="status-value">RUNNING</span>
      </div>
      <div className="status-divider" />
      <div className="status-item">
        <span className="status-label">Active Modules</span>
        <span className="status-value">7</span>
      </div>
      <div className="status-divider" />
      <div className="status-item">
        <span className="status-label">Signal Integrity</span>
        <span className="status-value">{signalIntegrity}%</span>
      </div>
    </div>
  );
}
