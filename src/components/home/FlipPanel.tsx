'use client';

import './FlipPanel.css';

interface FlipPanelProps {
  isFlipped: boolean;
  frontContent: React.ReactNode;
  backContent?: React.ReactNode;
}

export default function FlipPanel({ isFlipped, frontContent, backContent }: FlipPanelProps) {
  return (
    <div className={`flip-card-container ${isFlipped ? 'flipped' : ''}`}>
      <div className="flip-indicator" aria-hidden="true" />
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-face flip-card-front">
          {frontContent}
        </div>
        <div className="flip-card-face flip-card-back">
          {backContent || <DefaultBackContent />}
        </div>
      </div>
    </div>
  );
}

function DefaultBackContent() {
  return (
    <>
      <div className="back-header">
        <span className="back-label">SYSTEM INFO</span>
        <span className="back-status">FLIPPED</span>
      </div>
      <div className="back-content">
        <span className="back-placeholder">[ Coffee Machine ]</span>
        <span className="back-placeholder">Coming Soon...</span>
        <span className="back-hint">Type 'flip' to return</span>
      </div>
    </>
  );
}
