'use client';

export default function FpgaPipelineModule() {
  return (
    <div className="module-content fpga-pipeline">
      <div className="module-placeholder">
        <div className="placeholder-header">
          <h3>FPGA Dataflow Architecture</h3>
          <p>Pipeline visualization and resource analysis</p>
        </div>
        
        <div className="placeholder-visual pipeline-viz">
          <div className="pipeline-blocks">
            <div className="block input">
              <span className="block-label">ADC Input</span>
              <span className="block-rate">1 MS/s</span>
            </div>
            <div className="arrow">→</div>
            <div className="block process">
              <span className="block-label">Filter</span>
              <span className="block-latency">12 ns</span>
            </div>
            <div className="arrow">→</div>
            <div className="block process">
              <span className="block-label">Kalman</span>
              <span className="block-latency">45 ns</span>
            </div>
            <div className="arrow">→</div>
            <div className="block process">
              <span className="block-label">Matrix</span>
              <span className="block-latency">78 ns</span>
            </div>
            <div className="arrow">→</div>
            <div className="block output">
              <span className="block-label">DAC Output</span>
              <span className="block-rate">1 MS/s</span>
            </div>
          </div>
          
          <div className="pipeline-metrics">
            <div className="metric">
              <span className="metric-label">Total Latency</span>
              <span className="metric-value">135 ns</span>
            </div>
            <div className="metric">
              <span className="metric-label">Throughput</span>
              <span className="metric-value">170 MHz</span>
            </div>
            <div className="metric">
              <span className="metric-label">DSP Usage</span>
              <span className="metric-value">12/840</span>
            </div>
          </div>
        </div>

        <div className="placeholder-stats">
          <div className="stat-box">
            <span className="stat-label">LUTs</span>
            <span className="stat-value">12.4%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">FFs</span>
            <span className="stat-value">8.7%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">BRAM</span>
            <span className="stat-value">5.2%</span>
          </div>
        </div>

        <div className="placeholder-controls">
          <div className="control-group">
            <label>Target Device</label>
            <select>
              <option>XC7K325T-FFG900</option>
              <option>XC7Z020-CLG484</option>
              <option>XC7A100T-CSG324</option>
            </select>
          </div>
          <div className="control-group">
            <label>Optimization</label>
            <select>
              <option>Performance</option>
              <option>Area</option>
              <option>Power</option>
              <option>Balanced</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
