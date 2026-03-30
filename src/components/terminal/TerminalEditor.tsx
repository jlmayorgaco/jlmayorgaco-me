'use client';

import { useTerminalEditor, type EditorType } from '../../hooks/useTerminalEditor';
import './TerminalEditor.css';

interface TerminalEditorProps {
  type?: EditorType;
  filename?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  onExit?: () => void;
}

export default function TerminalEditor({
  type = 'nano',
  filename = 'untitled.txt',
  initialContent = '',
  onSave,
  onExit,
}: TerminalEditorProps) {
  const {
    editorType,
    state,
    containerRef,
    switchEditor,
    handleKeyDown,
  } = useTerminalEditor({
    filename,
    initialContent,
    onSave,
    onExit,
  });

  // Render VIM status line
  const renderVimStatus = () => {
    if (state.mode === 'command') {
      return (
        <div className="editor-status command-line">
          <span className="command-prefix">:</span>
          <span className="command-text">{state.commandBuffer}</span>
          <span className="command-cursor">_</span>
        </div>
      );
    }

    return (
      <div className="editor-status">
        <span className={`mode-indicator mode-${state.mode}`}>
          -- {state.mode.toUpperCase()} --
        </span>
        <span className="filename">{state.filename}</span>
        <span className="position">{state.cursorLine + 1},{state.cursorCol + 1}</span>
        {state.modified && <span className="modified">[Modified]</span>}
      </div>
    );
  };

  // Render NANO status/help
  const renderNanoStatus = () => {
    return (
      <div className="editor-status nano-status">
        <div className="nano-help">
          <span className="help-item">^G Get Help</span>
          <span className="help-item">^O WriteOut</span>
          <span className="help-item">^W Where Is</span>
          <span className="help-item">^K Cut Text</span>
          <span className="help-item">^J Justify</span>
          <span className="help-item">^C Cur Pos</span>
          <span className="help-item">^Y Prev Page</span>
          <span className="help-item">^V Next Page</span>
          <span className="help-item">^A Home</span>
          <span className="help-item">^E End</span>
          <span className="help-item">^U UnCut Text</span>
          <span className="help-item">^T To Spell</span>
        </div>
        <div className="nano-info">
          <span>{state.filename}</span>
          <span>{state.modified ? 'Modified' : ''}</span>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`terminal-editor editor-${editorType}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Title bar */}
      <div className="editor-titlebar">
        <span className="editor-name">{editorType === 'vim' ? 'VIM' : 'GNU nano 6.2'}</span>
        <span className="editor-filename">{filename}</span>
        <button className="editor-switch" onClick={() => switchEditor(editorType === 'vim' ? 'nano' : 'vim')}>
          Switch to {editorType === 'vim' ? 'nano' : 'vim'}
        </button>
      </div>

      {/* Editor content */}
      <div className="editor-content">
        {state.content.map((line, index) => (
          <div 
            key={index} 
            className={`editor-line ${index === state.cursorLine ? 'active' : ''}`}
          >
            <span className="line-number">{index + 1}</span>
            <span className="line-content">
              {line.split('').map((char, colIndex) => (
                <span
                  key={colIndex}
                  className={`char ${
                    index === state.cursorLine && colIndex === state.cursorCol 
                      ? 'cursor' 
                      : ''
                  }`}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
              {index === state.cursorLine && state.cursorCol === line.length && (
                <span className="char cursor">_</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Status bar */}
      {editorType === 'vim' ? renderVimStatus() : renderNanoStatus()}

      {/* Message line */}
      {state.message && (
        <div className="editor-message">
          {state.message}
        </div>
      )}
    </div>
  );
}
