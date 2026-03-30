'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './HomeTerminal.css';
import type { TerminalData, HistoryEntry } from '../../lib/terminal/terminalTypes';
import { QUICK_COMMANDS } from '../../lib/terminal/terminalTypes';
import { executeCommand, getHelpText } from '../../lib/terminal';
import type { UIAction } from '../../lib/terminal/commandRegistry';

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

const SCROLL_ACTIONS = ['scroll-projects', 'scroll-papers', 'scroll-research', 'scroll-contact'] as const;

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

function dispatchUIAction(action: UIAction) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('terminal:ui-action', { detail: action }));
}

function handleUIAction(action: UIAction) {
  switch (action.type) {
    case 'scroll':
      document.getElementById(action.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;
    case 'navigate':
      window.location.href = action.path;
      break;
    case 'theme':
    case 'accent':
    case 'layout':
    case 'shuffle':
    case 'reset':
    case 'focus':
    case 'chaos':
    case 'stabilize':
    case 'open-hmi':
    case 'close-hmi':
    case 'construction':
    case 'flip-panel':
      dispatchUIAction(action);
      break;
  }
}

export default function HomeTerminal({ data }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>(BOOT_SEQUENCE);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const result = executeCommand(trimmed, [], data);

    if (result.output === '__CLEAR__') {
      setHistory([]);
      return;
    }

    setHistory(prev => [
      ...prev,
      { type: 'input', content: `$ ${cmd}` },
      { type: 'output', content: result.output },
    ]);

    if (result.uiAction) {
      handleUIAction(result.uiAction);
    } else if (SCROLL_ACTIONS.includes(result.action as typeof SCROLL_ACTIONS[number])) {
      const id = result.action!.replace('scroll-', '');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [data]);

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
    if (cmd === 'help') {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `$ ${cmd}` },
        { type: 'output', content: getHelpText() },
      ]);
      return;
    }
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
        <span className="footer-label">LAB_TERMINAL v2.0</span>
      </div>
    </div>
  );
}
