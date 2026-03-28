import './ModuleCard.css';
import FpgaVisual from './visuals/FpgaVisual';
import RoboticsVisual from './visuals/RoboticsVisual';
import PowerVisual from './visuals/PowerVisual';

interface ModuleCardProps {
  title: string;
  subtitle: string;
  tags: string[];
  status?: 'active' | 'stable' | 'online' | 'idle' | 'offline';
  variant?: 'fpga' | 'robotics' | 'power' | 'theory';
  id?: string;
  miniVisual?: React.ReactNode;
}

const variantIcons: Record<string, string> = {
  fpga: '◇',
  robotics: '◎',
  power: '◉',
  theory: '○',
};

const statusColors: Record<string, string> = {
  active: 'var(--lab-led-green)',
  stable: 'var(--lab-led-blue)',
  online: 'var(--lab-led-green)',
  idle: 'var(--lab-led-amber)',
  offline: 'var(--lab-led-red)',
};

const defaultVisuals: Record<string, React.ReactNode> = {
  fpga: <FpgaVisual />,
  robotics: <RoboticsVisual />,
  power: <PowerVisual />,
};

export default function ModuleCard({ 
  title, 
  subtitle, 
  tags, 
  status = 'idle',
  variant = 'fpga',
  id = 'MODULE-XXX',
  miniVisual,
}: ModuleCardProps) {
  return (
    <div className={`module-card variant-${variant}`} data-module-id={id}>
      <div className="module-header">
        <span className="module-label">{variant.toUpperCase()}</span>
        <span className="module-id">{id}</span>
      </div>
      
      <div className="module-body">
        <div className="module-visual">
          {miniVisual || defaultVisuals[variant]}
        </div>
        <div className="module-info">
          <h3 className="module-title">{title}</h3>
          <p className="module-subtitle">{subtitle}</p>
        </div>
      </div>
      
      <div className="module-footer">
        <div className="module-tags">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="module-status">
          <span 
            className="status-dot" 
            style={{ background: statusColors[status] }}
          />
          <span className="status-text">{status.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
