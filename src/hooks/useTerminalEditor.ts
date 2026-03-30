'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export type EditorMode = 'normal' | 'insert' | 'command' | 'visual';
export type EditorType = 'nano' | 'vim';

interface EditorState {
  content: string[];
  cursorLine: number;
  cursorCol: number;
  mode: EditorMode;
  filename: string;
  modified: boolean;
  message: string;
  commandBuffer: string;
  visualStart: { line: number; col: number } | null;
}

interface UseTerminalEditorOptions {
  initialContent?: string;
  filename?: string;
  onSave?: (content: string) => void;
  onExit?: () => void;
}

export function useTerminalEditor(options: UseTerminalEditorOptions = {}) {
  const { 
    initialContent = '', 
    filename = 'untitled.txt',
    onSave,
    onExit 
  } = options;

  const [editorType, setEditorType] = useState<EditorType>('nano');
  const [state, setState] = useState<EditorState>({
    content: initialContent ? initialContent.split('\n') : [''],
    cursorLine: 0,
    cursorCol: 0,
    mode: 'normal',
    filename,
    modified: false,
    message: '',
    commandBuffer: '',
    visualStart: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Get current line content
  const getCurrentLine = useCallback(() => {
    return state.content[state.cursorLine] || '';
  }, [state.content, state.cursorLine]);

  // Update current line
  const updateCurrentLine = useCallback((newLine: string) => {
    setState(prev => {
      const newContent = [...prev.content];
      newContent[prev.cursorLine] = newLine;
      return {
        ...prev,
        content: newContent,
        modified: true,
      };
    });
  }, []);

  // Cursor movement
  const moveCursor = useCallback((deltaLine: number, deltaCol: number) => {
    setState(prev => {
      const newLine = Math.max(0, Math.min(prev.content.length - 1, prev.cursorLine + deltaLine));
      const lineContent = prev.content[newLine] || '';
      const newCol = Math.max(0, Math.min(lineContent.length, prev.cursorCol + deltaCol));
      
      return {
        ...prev,
        cursorLine: newLine,
        cursorCol: newCol,
      };
    });
  }, []);

  // Insert character
  const insertChar = useCallback((char: string) => {
    if (state.mode !== 'insert') return;
    
    const currentLine = getCurrentLine();
    const newLine = currentLine.slice(0, state.cursorCol) + char + currentLine.slice(state.cursorCol);
    updateCurrentLine(newLine);
    moveCursor(0, 1);
  }, [state.mode, state.cursorCol, getCurrentLine, updateCurrentLine, moveCursor]);

  // Delete character
  const deleteChar = useCallback(() => {
    if (state.mode !== 'insert') return;
    
    const currentLine = getCurrentLine();
    if (state.cursorCol > 0) {
      const newLine = currentLine.slice(0, state.cursorCol - 1) + currentLine.slice(state.cursorCol);
      updateCurrentLine(newLine);
      moveCursor(0, -1);
    } else if (state.cursorLine > 0) {
      // Join with previous line
      setState(prev => {
        const prevLine = prev.content[prev.cursorLine - 1];
        const currentLineContent = prev.content[prev.cursorLine];
        const newContent = [...prev.content];
        newContent[prev.cursorLine - 1] = prevLine + currentLineContent;
        newContent.splice(prev.cursorLine, 1);
        
        return {
          ...prev,
          content: newContent,
          cursorLine: prev.cursorLine - 1,
          cursorCol: prevLine.length,
          modified: true,
        };
      });
    }
  }, [state.mode, state.cursorCol, state.cursorLine, getCurrentLine, updateCurrentLine, moveCursor]);

  // Insert new line
  const insertNewLine = useCallback(() => {
    if (state.mode !== 'insert') return;
    
    setState(prev => {
      const currentLine = prev.content[prev.cursorLine];
      const beforeCursor = currentLine.slice(0, prev.cursorCol);
      const afterCursor = currentLine.slice(prev.cursorCol);
      
      const newContent = [...prev.content];
      newContent[prev.cursorLine] = beforeCursor;
      newContent.splice(prev.cursorLine + 1, 0, afterCursor);
      
      return {
        ...prev,
        content: newContent,
        cursorLine: prev.cursorLine + 1,
        cursorCol: 0,
        modified: true,
      };
    });
  }, [state.mode]);

  // Save file
  const saveFile = useCallback(() => {
    const content = state.content.join('\n');
    onSave?.(content);
    setState(prev => ({
      ...prev,
      modified: false,
      message: `"${prev.filename}" ${state.content.length}L, ${content.length}B written`,
    }));
  }, [state.content, state.filename, onSave]);

  // Exit editor
  const exitEditor = useCallback(() => {
    onExit?.();
  }, [onExit]);

  // Handle VIM keybindings
  const handleVimKey = useCallback((key: string) => {
    switch (state.mode) {
      case 'normal':
        switch (key) {
          case 'i':
            setState(prev => ({ ...prev, mode: 'insert' }));
            break;
          case 'a':
            setState(prev => ({ ...prev, mode: 'insert', cursorCol: prev.cursorCol + 1 }));
            break;
          case 'o':
            setState(prev => {
              const newContent = [...prev.content];
              newContent.splice(prev.cursorLine + 1, 0, '');
              return {
                ...prev,
                content: newContent,
                cursorLine: prev.cursorLine + 1,
                cursorCol: 0,
                mode: 'insert',
                modified: true,
              };
            });
            break;
          case 'h':
            moveCursor(0, -1);
            break;
          case 'j':
            moveCursor(1, 0);
            break;
          case 'k':
            moveCursor(-1, 0);
            break;
          case 'l':
            moveCursor(0, 1);
            break;
          case '0':
            setState(prev => ({ ...prev, cursorCol: 0 }));
            break;
          case '$':
            setState(prev => ({ 
              ...prev, 
              cursorCol: prev.content[prev.cursorLine]?.length || 0 
            }));
            break;
          case 'gg':
            setState(prev => ({ ...prev, cursorLine: 0, cursorCol: 0 }));
            break;
          case 'G':
            setState(prev => ({ 
              ...prev, 
              cursorLine: prev.content.length - 1,
              cursorCol: 0,
            }));
            break;
          case ':':
            setState(prev => ({ ...prev, mode: 'command', commandBuffer: '' }));
            break;
          case 'dd':
            setState(prev => {
              const newContent = [...prev.content];
              newContent.splice(prev.cursorLine, 1);
              if (newContent.length === 0) newContent.push('');
              return {
                ...prev,
                content: newContent,
                cursorLine: Math.min(prev.cursorLine, newContent.length - 1),
                modified: true,
              };
            });
            break;
          case 'yy':
            // Copy line (would need clipboard implementation)
            setState(prev => ({ ...prev, message: '1 line yanked' }));
            break;
          case 'p':
            setState(prev => {
              const newContent = [...prev.content];
              newContent.splice(prev.cursorLine + 1, 0, prev.content[prev.cursorLine] || '');
              return {
                ...prev,
                content: newContent,
                modified: true,
              };
            });
            break;
        }
        break;
        
      case 'insert':
        if (key === 'Escape') {
          setState(prev => ({ ...prev, mode: 'normal' }));
          moveCursor(0, -1);
        }
        break;
        
      case 'command':
        if (key === 'Escape') {
          setState(prev => ({ ...prev, mode: 'normal', commandBuffer: '' }));
        } else if (key === 'Enter') {
          const command = state.commandBuffer;
          setState(prev => ({ ...prev, mode: 'normal', commandBuffer: '' }));
          
          // Process command
          if (command === 'w' || command === 'write') {
            saveFile();
          } else if (command === 'q' || command === 'quit') {
            if (state.modified) {
              setState(prev => ({ 
                ...prev, 
                message: 'No write since last change (add ! to override)' 
              }));
            } else {
              exitEditor();
            }
          } else if (command === 'wq' || command === 'x') {
            saveFile();
            exitEditor();
          } else if (command === 'q!') {
            exitEditor();
          } else {
            setState(prev => ({ ...prev, message: `Not an editor command: ${command}` }));
          }
        } else if (key === 'Backspace') {
          setState(prev => ({ 
            ...prev, 
            commandBuffer: prev.commandBuffer.slice(0, -1) 
          }));
        } else if (key.length === 1) {
          setState(prev => ({ 
            ...prev, 
            commandBuffer: prev.commandBuffer + key 
          }));
        }
        break;
    }
  }, [state.mode, state.modified, state.commandBuffer, moveCursor, saveFile, exitEditor]);

  // Handle NANO keybindings
  const handleNanoKey = useCallback((key: string, ctrl: boolean) => {
    if (ctrl) {
      switch (key.toLowerCase()) {
        case 'o': // Ctrl+O: Save
          saveFile();
          break;
        case 'x': // Ctrl+X: Exit
          if (state.modified) {
            setState(prev => ({ 
              ...prev, 
              message: 'Save modified buffer (ANSWERING "No" WILL DESTROY CHANGES) ?' 
            }));
          } else {
            exitEditor();
          }
          break;
        case 'k': // Ctrl+K: Cut line
          setState(prev => {
            const newContent = [...prev.content];
            newContent.splice(prev.cursorLine, 1);
            if (newContent.length === 0) newContent.push('');
            return {
              ...prev,
              content: newContent,
              modified: true,
            };
          });
          break;
        case 'u': // Ctrl+U: Paste
          // Would need clipboard
          break;
        case 'w': // Ctrl+W: Search
          setState(prev => ({ ...prev, message: 'Search: ' }));
          break;
        case 'v': // Ctrl+V: Next page
          moveCursor(10, 0);
          break;
        case 'y': // Ctrl+Y: Previous page
          moveCursor(-10, 0);
          break;
        case 'a': // Ctrl+A: Home
          setState(prev => ({ ...prev, cursorCol: 0 }));
          break;
        case 'e': // Ctrl+E: End
          setState(prev => ({ 
            ...prev, 
            cursorCol: prev.content[prev.cursorLine]?.length || 0 
          }));
          break;
      }
    } else {
      switch (key) {
        case 'ArrowUp':
          moveCursor(-1, 0);
          break;
        case 'ArrowDown':
          moveCursor(1, 0);
          break;
        case 'ArrowLeft':
          moveCursor(0, -1);
          break;
        case 'ArrowRight':
          moveCursor(0, 1);
          break;
        case 'Home':
          setState(prev => ({ ...prev, cursorCol: 0 }));
          break;
        case 'End':
          setState(prev => ({ 
            ...prev, 
            cursorCol: prev.content[prev.cursorLine]?.length || 0 
          }));
          break;
        case 'Backspace':
          deleteChar();
          break;
        case 'Enter':
          insertNewLine();
          break;
        default:
          if (key.length === 1) {
            insertChar(key);
          }
      }
    }
  }, [state.modified, moveCursor, saveFile, exitEditor, deleteChar, insertNewLine, insertChar]);

  // Main keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    
    if (editorType === 'vim') {
      handleVimKey(e.key);
    } else {
      handleNanoKey(e.key, e.ctrlKey);
    }
  }, [editorType, handleVimKey, handleNanoKey]);

  // Switch editor type
  const switchEditor = useCallback((type: EditorType) => {
    setEditorType(type);
    setState(prev => ({
      ...prev,
      mode: type === 'vim' ? 'normal' : 'insert',
      message: type === 'vim' ? '-- NORMAL --' : '',
    }));
  }, []);

  return {
    editorType,
    state,
    containerRef,
    switchEditor,
    handleKeyDown,
    saveFile,
    exitEditor,
    insertChar,
    deleteChar,
    moveCursor,
  };
}
