'use client';

export default function ControlWorkbenchModule() {
  return (
    <div className="module-content control-workbench">
      <div className="module-placeholder">
        <div className="placeholder-header">
          <h3>Control System Analysis</h3>
          <p>Step response and controller tuning</p>
        </div>
        
        <div className="placeholder-visual">
          <svg viewBox="0 0 400 200" className="response-svg">
            {/* Grid */}
            <line x1="0" y1="100" x2="400" y2="100" stroke="#333" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="#333" strokeWidth="0.5" opacity="0.5" />
            <line x1="0" y1="150" x2="400" y2="150" stroke="#333" strokeWidth="0.5" opacity="0.5" />
            
            {/* Step response curve */}
            <path 
              d="M0,180 L50,180 Q75,180 80,120 Q100,40 120,50 T200,55 T400,50" 
              fill="none" 
              stroke="#d29922" 
              strokeWidth="2"
            />
            
            {/* Settling line */}
            <line x1="0" y1="50" x2="400" y2="50" stroke="#d29922" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
            
            {/* Labels */}
            <text x="10" y="195" fill="#666" fontSize="10">0</text>
            <text x="190" y="195" fill="#666" fontSize="10">t</text>
            <text x="380" y="195" fill="#666" fontSize="10">→</text>
          </svg>
        </div>

        <div className="placeholder-stats">
          <div className="stat-box">
            <span className="stat-label">Overshoot</span>
            <span className="stat-value">4.3%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Settling Time</span>
            <span className="stat-value">2.1s</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Rise Time</span>
            <span className="stat-value">0.8s</span>
          </div>
        </div>

        <div className="placeholder-controls">
          <div className="control-group">
            <label>Controller</label>
            <select>
              <option>PID</option>
              <option>LQR</option>
              <option>MPC</option>
              <option>State Feedback</option>
            </select>
          </div>
          <div className="control-group sliders">
            <label>Kp: <span>1.0</span></label>
            <input type="range" min="0" max="5" step="0.1" defaultValue="1" />
            <label>Ki: <span>0.1</span></label>
            <input type="range" min="0" max="2" step="0.05" defaultValue="0.1" />
            <label>Kd: <span>0.01</span></label>
            <input type="range" min="0" max="0.5" step="0.01" defaultValue="0.01" />
          </div>
        </div>
      </div>
    </div>
  );
}
