import './PowerVisual.css';

export default function PowerVisual() {
  return (
    <div className="power-visual">
      <svg viewBox="0 0 80 60" className="power-svg">
        {/* Monitor frame */}
        <rect x="5" y="8" width="50" height="44" rx="2" className="monitor-frame" />
        
        {/* Screen area */}
        <rect x="8" y="11" width="44" height="32" className="screen-area" />
        
        {/* Frequency waveform */}
        <polyline 
          points="10,35 15,35 18,25 22,40 26,28 30,38 34,30 38,35 42,32 46,36 50,30"
          className="frequency-wave"
        />
        
        {/* Grid lines on screen */}
        <line x1="8" y1="27" x2="52" y2="27" className="grid-line" />
        <line x1="8" y1="38" x2="52" y2="38" className="grid-line" />
        
        {/* Event marker */}
        <line x1="30" y1="11" x2="30" y2="43" className="event-marker" />
        <circle cx="30" cy="30" r="3" className="event-dot" />
        
        {/* Monitor stand */}
        <rect x="25" y="52" width="10" height="4" className="monitor-stand" />
        
        {/* Signal strength bars */}
        <g className="signal-bars">
          <rect x="58" y="35" width="3" height="8" className="bar bar-1" />
          <rect x="63" y="30" width="3" height="13" className="bar bar-2" />
          <rect x="68" y="25" width="3" height="18" className="bar bar-3" />
          <rect x="73" y="20" width="3" height="23" className="bar bar-4" />
        </g>
      </svg>
    </div>
  );
}
