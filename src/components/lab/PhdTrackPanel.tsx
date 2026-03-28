import './PhdTrackPanel.css';
import { phdTrack } from '../../data/labData';

export default function PhdTrackPanel() {
  return (
    <div className="phd-track-panel">
      <div className="track-header">
        <span className="track-label">PHD TRACK</span>
      </div>
      <div className="track-content">
        <div className="track-focus">
          <span className="focus-label">Research Focus:</span>
          <span className="focus-value">{phdTrack.focus}</span>
        </div>
        <div className="track-bullets">
          {phdTrack.areas.map((area, i) => (
            <div key={i} className="bullet-item">
              <span className="bullet-marker">▸</span>
              <span className="bullet-text">{area}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="track-symbol">
        <span className="symbol-text">Ψ</span>
      </div>
    </div>
  );
}
