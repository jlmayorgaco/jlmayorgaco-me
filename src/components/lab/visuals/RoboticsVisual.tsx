import './RoboticsVisual.css';

export default function RoboticsVisual() {
  return (
    <div className="robotics-visual">
      <svg viewBox="0 0 80 60" className="robotics-svg">
        {/* Nodes/robots */}
        <circle cx="40" cy="30" r="6" className="node node-center" />
        <circle cx="20" cy="15" r="4" className="node node-outer" />
        <circle cx="60" cy="15" r="4" className="node node-outer" />
        <circle cx="20" cy="45" r="4" className="node node-outer" />
        <circle cx="60" cy="45" r="4" className="node node-outer" />
        
        {/* Connection lines */}
        <line x1="40" y1="30" x2="20" y2="15" className="connection" />
        <line x1="40" y1="30" x2="60" y2="15" className="connection" />
        <line x1="40" y1="30" x2="20" y2="45" className="connection" />
        <line x1="40" y1="30" x2="60" y2="45" className="connection" />
        
        {/* Cross connections */}
        <line x1="20" y1="15" x2="60" y2="15" className="connection connection-cross" />
        <line x1="20" y1="45" x2="60" y2="45" className="connection connection-cross" />
        <line x1="20" y1="15" x2="20" y2="45" className="connection connection-cross" />
        <line x1="60" y1="15" x2="60" y2="45" className="connection connection-cross" />
        
        {/* Small direction indicators */}
        <circle cx="30" cy="22" r="1" className="data-packet" />
        <circle cx="50" cy="38" r="1" className="data-packet" />
        <circle cx="40" cy="45" r="1" className="data-packet" />
      </svg>
    </div>
  );
}
