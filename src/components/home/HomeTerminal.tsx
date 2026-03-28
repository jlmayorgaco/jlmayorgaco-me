'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './HomeTerminal.css';
import type { TerminalData, HistoryEntry } from '../../lib/terminal/terminalTypes';
import { QUICK_COMMANDS } from '../../lib/terminal/terminalTypes';
import { executeCommand } from '../../lib/terminal/execute';
import { checkEasterEgg } from '../../lib/terminal/easterEggs';

interface Props {
  data: TerminalData;
}

const BOOT_SEQUENCE: HistoryEntry[] = [
  { type: 'output', content: '// SYSTEM BOOT' },
  { type: 'output', content: '$ whoami' },
  { type: 'output', content: 'Jorge Luis Mayorga' },
  { type: 'output', content: 'Research Engineer - Robotics & Control Systems' },
  { type: 'output', content: '' },
  { type: 'output', content: '$ cat status.txt' },
  { type: 'output', content: '→ Available for collaborations' },
  { type: 'output', content: '' },
  { type: 'output', content: 'Type "help" for available commands...' },
];

const scrollActions = ['scroll-projects', 'scroll-papers', 'scroll-research', 'scroll-contact'] as const;

function TerminalLine({ entry }: { entry: HistoryEntry }) {
  const lines = entry.content.split('\n');
  return (
    <div className={`terminal-line ${entry.type}`}>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

export default function HomeTerminal({ data }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>(BOOT_SEQUENCE);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.location.href = path;
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    let result = checkEasterEgg(trimmed);
    if (!result) {
      const parts = trimmed.toLowerCase().split(/\s+/);
      result = executeCommand(parts[0], parts.slice(1), data);
    }

    if (result.output === '__CLEAR__') {
      setHistory([]);
      return;
    }

    setHistory(prev => [
      ...prev,
      { type: 'input', content: `$ ${cmd}` },
      { type: 'output', content: result.output },
    ]);

    if (result.action === 'navigate' && result.navigateTo) {
      navigateTo(result.navigateTo);
    } else if (scrollActions.includes(result.action as typeof scrollActions[number])) {
      scrollToSection(result.action!.replace('scroll-', ''));
    }
  }, [data, scrollToSection, navigateTo]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;

    if (key === 'Enter') {
      handleCommand(input);
      setInput('');
      return;
    }

    if (key === 'Escape') {
      setInput('');
      setHistoryIndex(-1);
      return;
    }

    if (key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
      return;
    }

    if (key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
  }, [input, commandHistory, historyIndex, handleCommand]);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [history]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleQuickCommand = useCallback((cmd: string) => {
    handleCommand(cmd);
  }, [handleCommand]);

  const historyContent = useMemo(() => (
    history.map((entry, i) => <TerminalLine key={i} entry={entry} />)
  ), [history]);

  return (
    <div className="terminal-wrapper" onClick={focusInput} role="application" aria-label="Interactive terminal">
      <div className="terminal-header">
        <div className="header-left">
          <span className="label-tag">TERMINAL</span>
          <span className="terminal-mode">INTERACTIVE</span>
        </div>
        <div className="header-right">
          <div className="leds" role="status" aria-label="System status">
            <span className="led led-green led-pulse" aria-hidden="true" />
            <span className="led led-amber" aria-hidden="true" />
            <span className="led led-red" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="terminal-body">
        <div className="quick-chips" role="toolbar" aria-label="Quick commands">
          {QUICK_COMMANDS.map(cmd => (
            <button
              key={cmd}
              className="quick-chip"
              onClick={() => handleQuickCommand(cmd)}
              aria-label={`Run ${cmd} command`}
            >
              {cmd}
            </button>
          ))}
        </div>

        <div
          className="terminal-output"
          ref={outputRef}
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
        >
          {historyContent}
        </div>

        <div className="terminal-input-row">
          <span className="prompt" aria-hidden="true">$</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Terminal input"
            placeholder="Type a command..."
          />
        </div>
      </div>

      <div className="terminal-footer">
        <div className="waveform-bars" aria-hidden="true">
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
        </div>
        <span className="footer-label">LAB_TERMINAL v1.0</span>
      </div>
    </div>
  );
}