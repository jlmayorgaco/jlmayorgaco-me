'use client';

import { useState, useRef, useEffect } from 'react';
import './TerminalPanel.css';
import { terminalCommands, quickCommands, terminalBootSequence } from '../../data/labData';

interface HistoryEntry {
  type: 'input' | 'output' | 'error';
  content: string;
}

export default function TerminalPanel() {
  const [history, setHistory] = useState<HistoryEntry[]>(terminalBootSequence);
  const [input, setInput] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    
    if (trimmed === '') return;
    
    const newHistory: HistoryEntry[] = [
      ...history,
      { type: 'input', content: `$ ${cmd}` },
    ];

    if (trimmed === 'clear') {
      setHistory([]);
      return;
    }

    const command = terminalCommands[trimmed];
    if (command) {
      newHistory.push({ type: 'output', content: command.output });
      
      if (command.action) {
        setTimeout(() => {
          const element = document.getElementById(command.action!.replace('scroll-', ''));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } else {
      newHistory.push({ type: 'error', content: `Command not found: ${trimmed}. Type "help" for available commands.` });
    }

    setHistory(newHistory);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    }
  };

  const handleQuickCommand = (cmd: string) => {
    executeCommand(cmd);
    setInput('');
  };

  return (
    <div className="terminal-panel">
      <div className="monitor-frame">
        <div className="monitor-header">
          <span className="monitor-title">MAIN DISPLAY</span>
          <div className="monitor-status">
            <span className="status-led" />
            LIVE
          </div>
        </div>
        
        <div className="monitor-screen">
          <div className="quick-chips">
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                className="quick-chip"
                onClick={() => handleQuickCommand(cmd)}
              >
                {cmd}
              </button>
            ))}
          </div>
          
          <div className="terminal-output" ref={historyRef}>
            {history.map((entry, i) => (
              <div key={i} className={`terminal-line ${entry.type}`}>
                {entry.content}
              </div>
            ))}
          </div>
          
          <div className="terminal-input-line">
            <span className="prompt-symbol">$</span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <span className={`cursor ${cursorVisible ? 'visible' : ''}`}>█</span>
          </div>
        </div>
        
        <div className="screen-footer">
          <div className="waveform">
            <span className="wave-bar" style={{ animationDelay: '0s' }} />
            <span className="wave-bar" style={{ animationDelay: '0.1s' }} />
            <span className="wave-bar" style={{ animationDelay: '0.2s' }} />
            <span className="wave-bar" style={{ animationDelay: '0.3s' }} />
            <span className="wave-bar" style={{ animationDelay: '0.4s' }} />
          </div>
          <span className="footer-label">SYS.MONITOR</span>
        </div>
      </div>
    </div>
  );
}
