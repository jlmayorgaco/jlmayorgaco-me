import './TechRack.css';
import { techStack } from '../../data/labData';

export default function TechRack() {
  return (
    <div className="tech-rack">
      <div className="rack-header">
        <span className="rack-label">TECH STACK</span>
      </div>
      <div className="rack-units">
        {techStack.map((tech) => (
          <div key={tech.label} className={`rack-unit type-${tech.type}`}>
            <span className="unit-indicator" />
            <span className="unit-label">{tech.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
