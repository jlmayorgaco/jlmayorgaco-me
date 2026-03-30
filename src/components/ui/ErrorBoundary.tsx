'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-fallback">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            <span className="error-label">COMPONENT ERROR</span>
            <span className="error-text">This component failed to load</span>
          </div>
          <button 
            className="error-retry-btn"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// CSS for the error boundary
const styles = `
.error-boundary-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: var(--lab-bg-panel, #f0f2f0);
  border: 1px solid var(--panel-border, #b8bcba);
  border-radius: var(--radius-md, 4px);
  margin: 1rem 0;
}

.error-icon {
  font-size: 1.5rem;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.25rem;
}

.error-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.625rem;
  color: var(--led-red, #f85149);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.error-text {
  font-family: var(--font-body, sans-serif);
  font-size: 0.875rem;
  color: var(--lab-text-secondary, #4a524d);
}

.error-retry-btn {
  padding: 0.5rem 1rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  color: var(--accent-cyan, #3fb9a7);
  background: var(--lab-bg-dark, #d4d7d5);
  border: 1px solid var(--panel-border, #b8bcba);
  border-radius: var(--radius-sm, 2px);
  cursor: pointer;
  transition: all 0.15s ease;
}

.error-retry-btn:hover {
  background: var(--lab-bg-elevated, #f5f7f5);
  border-color: var(--accent-cyan, #3fb9a7);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'error-boundary-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = styles;
    document.head.appendChild(style);
  }
}