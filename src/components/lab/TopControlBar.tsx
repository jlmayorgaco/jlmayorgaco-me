import './TopControlBar.css';
import { navItems } from '../../data/labData';

export default function TopControlBar() {
  return (
    <div className="top-control-bar">
      <div className="control-bar-inner">
        <div className="bar-brand">
          <span className="brand-icon">◆</span>
          <span className="brand-text">JLMT</span>
          <span className="brand-status">
            <span className="led-indicator" />
            LAB
          </span>
        </div>
        
        <nav className="control-nav">
          {navItems.map((item) => (
            <a 
              key={item.label} 
              href={item.href}
              className="control-btn"
            >
              {item.label}
            </a>
          ))}
        </nav>
        
        <div className="bar-extra">
          <span className="system-time">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </div>
    </div>
  );
}
