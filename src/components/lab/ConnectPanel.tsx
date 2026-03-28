import './ConnectPanel.css';
import { socialLinks } from '../../data/labData';

export default function ConnectPanel() {
  return (
    <div className="connect-panel">
      <div className="connect-header">
        <span className="connect-label">CONNECT</span>
      </div>
      <div className="connect-links">
        {socialLinks.map((link) => (
          <a 
            key={link.label} 
            href={link.href}
            className="connect-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="btn-icon">{link.icon}</span>
            <span className="btn-label">{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
