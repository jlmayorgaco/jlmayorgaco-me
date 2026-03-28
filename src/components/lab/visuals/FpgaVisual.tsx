import './FpgaVisual.css';

export default function FpgaVisual() {
  return (
    <div className="fpga-visual">
      <svg viewBox="0 0 80 60" className="fpga-svg">
        {/* Chip body */}
        <rect x="20" y="15" width="40" height="30" rx="2" className="chip-body" />
        
        {/* Chip inner */}
        <rect x="25" y="20" width="30" height="20" rx="1" className="chip-inner" />
        
        {/* Chip label */}
        <text x="40" y="33" className="chip-label">FPGA</text>
        
        {/* Pins - top */}
        <line x1="25" y1="15" x2="25" y2="8" className="pin" />
        <line x1="32" y1="15" x2="32" y2="8" className="pin" />
        <line x1="40" y1="15" x2="40" y2="8" className="pin" />
        <line x1="48" y1="15" x2="48" y2="8" className="pin" />
        <line x1="55" y1="15" x2="55" y2="8" className="pin" />
        
        {/* Pins - bottom */}
        <line x1="25" y1="45" x2="25" y2="52" className="pin" />
        <line x1="32" y1="45" x2="32" y2="52" className="pin" />
        <line x1="40" y1="45" x2="40" y2="52" className="pin" />
        <line x1="48" y1="45" x2="48" y2="52" className="pin" />
        <line x1="55" y1="45" x2="55" y2="52" className="pin" />
        
        {/* Pins - left */}
        <line x1="20" y1="22" x2="13" y2="22" className="pin" />
        <line x1="20" y1="30" x2="13" y2="30" className="pin" />
        <line x1="20" y1="38" x2="13" y2="38" className="pin" />
        
        {/* Pins - right */}
        <line x1="60" y1="22" x2="67" y2="22" className="pin" />
        <line x1="60" y1="30" x2="67" y2="30" className="pin" />
        <line x1="60" y1="38" x2="67" y2="38" className="pin" />
        
        {/* Small waveform on side */}
        <polyline 
          points="70,15 72,20 74,18 76,25 78,22 80,28" 
          className="waveform-line"
        />
        
        {/* Trace lines */}
        <line x1="67" y1="22" x2="70" y2="18" className="trace" />
        <line x1="67" y1="30" x2="70" y2="30" className="trace" />
        <line x1="67" y1="38" x2="70" y2="42" className="trace" />
      </svg>
    </div>
  );
}
