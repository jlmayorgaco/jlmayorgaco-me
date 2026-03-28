import './WireOverlay.css';
import { wireConnections } from '../../data/labData';

export default function WireOverlay() {
  return (
    <div className="wire-overlay" id="wire-overlay">
      <svg className="wire-svg" id="wire-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--lab-wire-dim)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--lab-wire)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--lab-wire-dim)" stopOpacity="0" />
          </linearGradient>
          
          <filter id="wire-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <marker id="wire-end" markerWidth="4" markerHeight="4" refX="2" refY="2">
            <circle cx="2" cy="2" r="1" fill="var(--lab-wire)" />
          </marker>
        </defs>
        
        {wireConnections.map((wire) => (
          <g 
            key={wire.id} 
            className={`wire-group ${wire.animated ? 'animated' : ''}`}
            data-from={wire.from}
            data-to={wire.to}
          >
            <path 
              className="wire-path"
              id={`wire-${wire.id}`}
              d={getWirePath(wire.id)}
              markerEnd="url(#wire-end)"
            />
            {wire.animated && <circle className="wire-pulse" r="2" />}
          </g>
        ))}
      </svg>
      <div className="grid-overlay" />
    </div>
  );
}

function getWirePath(wireId: string): string {
  const paths: Record<string, string> = {
    'core-terminal': 'M 280 300 Q 420 280 720 300',
    'core-fpga': 'M 280 400 Q 280 500 280 550',
    'core-robotics': 'M 280 500 Q 200 600 280 700',
    'core-power': 'M 280 500 Q 400 600 720 700',
    'terminal-research': 'M 720 450 Q 720 550 720 600',
    'techrack-fpga': 'M 1200 500 Q 1000 520 720 550',
    'research-phd': 'M 1200 450 Q 1300 350 1300 300',
    'core-connect': 'M 280 400 Q 200 500 280 600',
  };
  return paths[wireId] || '';
}
