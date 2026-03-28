import './ResearchOutputPanel.css';
import { researchOutputs } from '../../data/labData';

export default function ResearchOutputPanel() {
  return (
    <div className="research-output-panel">
      <div className="output-header">
        <span className="output-label">RESEARCH OUTPUT</span>
        <span className="output-count">{researchOutputs.length}</span>
      </div>
      <div className="output-list">
        {researchOutputs.map((item, i) => (
          <div key={i} className="output-item">
            <span className="item-index">{String(i + 1).padStart(2, '0')}</span>
            <div className="item-content">
              <span className="item-title">{item.title}</span>
              <div className="item-meta">
                <span className="item-category">{item.category}</span>
                <span className="item-year">{item.year}</span>
              </div>
            </div>
            <span className="item-indicator" />
          </div>
        ))}
      </div>
    </div>
  );
}
