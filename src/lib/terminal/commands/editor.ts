import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

const nanoCommand: CommandDefinition = {
  aliases: ['nano', 'nano editor', 'edit'],
  description: 'Open nano text editor',
  category: 'editor',
  execute: (args) => {
    const filename = args[0] || 'untitled.txt';
    
    // Dispatch event to open nano editor
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('terminal:open-editor', { 
        detail: { type: 'nano', filename } 
      });
      window.dispatchEvent(event);
    }
    
    return {
      output: `Opening nano editor...
${TERMINAL_DIVIDER}
File: ${filename}

GNU nano 6.2 - A simple text editor

Use Ctrl+O to save, Ctrl+X to exit
Use arrow keys to navigate

Editor opened in new panel.`,
      action: 'none',
    };
  },
};

const vimCommand: CommandDefinition = {
  aliases: ['vim', 'vi'],
  description: 'Open vim text editor',
  category: 'editor',
  execute: (args) => {
    const filename = args[0] || 'untitled.txt';
    
    // Dispatch event to open vim editor
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('terminal:open-editor', { 
        detail: { type: 'vim', filename } 
      });
      window.dispatchEvent(event);
    }
    
    return {
      output: `VIM - Vi IMproved 9.0
${TERMINAL_DIVIDER}
File: ${filename}

VIM modes:
  Normal - Navigation and commands (press Escape)
  Insert - Text editing (press i)
  Visual - Selection (press v)
  Command - Enter commands (press :)

Quick commands:
  :w     - Save file
  :q     - Quit
  :wq    - Save and quit
  :q!    - Quit without saving
  dd     - Delete line
  yy     - Copy line
  p      - Paste
  u      - Undo

Editor opened in new panel.`,
      action: 'none',
    };
  },
};

const emacsCommand: CommandDefinition = {
  aliases: ['emacs'],
  description: 'Open emacs text editor (placeholder)',
  category: 'editor',
  execute: (args) => {
    const filename = args[0] || 'untitled.txt';
    
    return {
      output: `GNU Emacs 28.2
${TERMINAL_DIVIDER}
File: ${filename}

Note: Emacs is not fully implemented.
Use 'nano' or 'vim' instead for now.

Quick emacs commands (for reference):
  Ctrl+X Ctrl+S - Save
  Ctrl+X Ctrl+C - Exit
  Ctrl+K        - Cut line
  Ctrl+Y        - Paste
  Ctrl+S        - Search
  Ctrl+G        - Cancel command`,
      action: 'none',
    };
  },
};

const edCommand: CommandDefinition = {
  aliases: ['ed'],
  description: 'Line-oriented text editor (placeholder)',
  category: 'editor',
  execute: () => ({
    output: `ed - The standard text editor
${TERMINAL_DIVIDER}

Note: ed is not implemented.
This is the oldest UNIX text editor.

Use 'nano' or 'vim' instead.`,
    action: 'none',
  }),
};

const editorsHelpCommand: CommandDefinition = {
  aliases: ['editors', 'editor help'],
  description: 'List available text editors',
  category: 'editor',
  execute: () => ({
    output: `Available Text Editors
${TERMINAL_DIVIDER}

nano - User-friendly text editor
  Usage: nano [filename]
  Easy to use, on-screen help

vim - Vi IMproved
  Usage: vim [filename]
  Powerful modal editor
  Multiple modes: Normal, Insert, Visual

emacs - Extensible text editor (limited)
  Usage: emacs [filename]
  Not fully implemented

ed - Line editor (not implemented)
  Usage: ed [filename]
  For historical reference only`,
    action: 'none',
  }),
};

export function registerEditorCommands() {
  registerCommand(nanoCommand);
  registerCommand(vimCommand);
  registerCommand(emacsCommand);
  registerCommand(edCommand);
  registerCommand(editorsHelpCommand);
}
