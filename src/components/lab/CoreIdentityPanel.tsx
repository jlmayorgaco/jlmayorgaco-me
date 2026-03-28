import './CoreIdentityPanel.css';

export default function CoreIdentityPanel() {
  return (
    <div className="core-identity-panel">
      <div className="chip-unit">
        <div className="chip-header">
          <span className="chip-label">IDENTITY</span>
          <span className="chip-id">ID: JLMT-001</span>
        </div>
        
        <div className="chip-body">
          <div className="chip-main">
            <span className="chip-icon">◈</span>
            <div className="chip-text">
              <span className="chip-name">JLMT</span>
              <span className="chip-type">LAB</span>
            </div>
          </div>
          
          <div className="chip-divider" />
          
          <div className="chip-info">
            <span className="info-role">Research Engineer</span>
            <span className="info-focus">Robotics · Control · FPGA</span>
          </div>
          
          <div className="chip-stats">
            <div className="stat-row">
              <span className="stat-led" />
              <span className="stat-label">NODE</span>
              <span className="stat-value">ACTIVE</span>
            </div>
            <div className="stat-row">
              <span className="stat-led" />
              <span className="stat-label">UPTIME</span>
              <span className="stat-value">99.9%</span>
            </div>
          </div>
        </div>
        
        <div className="chip-footer">
          <div className="port-row">
            <span className="port" />
            <span className="port active" />
            <span className="port" />
            <span className="port" />
          </div>
          <span className="port-label">I/O</span>
        </div>
      </div>
    </div>
  );
}
