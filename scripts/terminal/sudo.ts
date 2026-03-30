#!/usr/bin/env node

import { execSync } from 'child_process';
import { question } from 'readline-sync';

const SUDO_COMMANDS: Record<string, { response: string; effect: string }> = {
  'make': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║           ☕ MAKE COFFEE COMING RIGHT UP ☕     ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'coffee'
  },
  'make coffee': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║     ☕☕☕ brewing the finest code fuel ☕☕☕      ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'coffee'
  },
  'make sandwich': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║  🥪 SANDWICH PROTOCOL INITIATED                 ║
  ║     - Acquiring bread...                         ║
  ║     - Locating cheese...                         ║
  ║     - BEWARE: I'm a bot, not a chef!             ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make todo': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║           📋 YOUR PRIORITY LIST:                  ║
  ║                                                  ║
  ║  1. ☕ Coffee                                    ║
  ║  2. 💻 Code                                     ║
  ║  3. 🛌 Sleep                                    ║
  ║  4. 🔄 Repeat                                   ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make help': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║        📚 SUDO MAKE - Available Commands         ║
  ╠══════════════════════════════════════════════════╣
  ║                                                  ║
  ║   sudo make coffee     - Brew some code fuel    ║
  ║   sudo make sandwich   - Request a sandwich     ║
  ║   sudo make todo       - Show priority list     ║
  ║   sudo make matrix     - Enter the matrix       ║
  ║   sudo make zen        - Enter zen mode         ║
  ║   sudo make roll       - Roll some dice         ║
  ║   sudo make build      - Compile everything     ║
  ║   sudo make test       - Run all tests          ║
  ║   sudo make love      - Get some love          ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make build': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║           🔨 BUILDING THE UNIVERSE...            ║
  ║                                                  ║
  ║     ██████████████░░░░░░░░░░░░░░ 45%            ║
  ║                                                  ║
  ║     Compiling galaxies...                        ║
  ║     Linking dark matter...                       ║
  ║     Optimizing quantum foam...                   ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make test': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║           🧪 RUNNING ALL THE TESTS               ║
  ║                                                  ║
  ║   ✅ Bot tests.............. 105 passed         ║
  ║   ✅ Astro build............ 44 pages          ║
  ║   ✅ Coffee machine......... OPERATIONAL        ║
  ║   ✅ Love quota.............. LOW (need more)   ║
  ║                                                  ║
  ║   "All tests passed! Ready for prod."           ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make love': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║            💖  ❤️  💖  ❤️  💖  ❤️  💖            ║
  ║                                                  ║
  ║          You are AWESOME!                        ║
  ║          Your code compiles!                     ║
  ║          Your commits are clean!                 ║
  ║          You are valued!                          ║
  ║                                                  ║
  ║            💖  ❤️  💖  ❤️  💖  ❤️  💖            ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make matrix': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║     💚 ENTERING THE MATRIX...                  ║
  ║                                                  ║
  ║     Wake up, ${process.env.USER || 'Neo'}...                           ║
  ║     The Matrix has you...                        ║
  ║     Follow the white rabbit.                     ║
  ║                                                  ║
  ║     npm run matrix                               ║
  ║     to see the green rain                        ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make zen': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║         🧘 WATASHIHA ZEN MODE DESU              ║
  ║                                                  ║
  ║           ~ infinite calm ~                      ║
  ║                                                  ║
  ║      The code is just code.                      ║
  ║      The bug is just a bug.                     ║
  ║      You are just you.                          ║
  ║                                                  ║
  ║           ~ breathe ~                            ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make roll': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║           🎲 LET'S ROLL SOME DICE!             ║
  ║                                                  ║
  ║     Run: npm run roll                           ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make me a sandwich': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║      OK.                                          ║
  ║                                                  ║
  ║            🍞                                       ║
  ║                                                  ║
  ║      ...what?                                     ║
  ║                                                  ║
  ║      sudo make me a sandwich                     ║
  ║      OK, FINE.                                   ║
  ║                                                  ║
  ║            🥪                                     ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'none'
  },
  'make me coffee': {
    response: `
  ╔══════════════════════════════════════════════════╗
  ║         ☕ COFFEE PROTOCOL ENGAGED ☕           ║
  ║                                                  ║
  ║      Initiating coffee sequence...               ║
  ║      Heating water to 93°C...                   ║
  ║      Grinding beans...                           ║
  ║      Pressurizing...                            ║
  ║                                                  ║
  ║      ☕ COFFEE DISPENSED                         ║
  ║                                                  ║
  ║      "npm run coffee" to order properly          ║
  ╚══════════════════════════════════════════════════╝
    `,
    effect: 'coffee'
  }
};

function printAsciiArt() {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║  ███████╗██╗  ██╗███████╗██████╗  ██████╗ ██████╗  ║
  ║  ██╔════╝██║ ██╔╝██╔════╝██╔══██╗██╔═══██╗██╔══██╗ ║
  ║  ███████╗█████╔╝ █████╗  ██████╔╝██║   ██║██████╔╝ ║
  ║  ╚════██║██╔═██╗ ██╔══╝  ██╔══██╗██║   ██║██╔══██╗ ║
  ║  ███████║██║  ██╗███████╗██║  ██║╚██████╔╝██║  ██║ ║
  ║  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ║
  ║                    ██╗  ██╗ █████╗ ██████╗ ███████╗ ║
  ║                    ██║  ██║██╔══██╗██╔══██╗██╔════╝ ║
  ║                    ███████║███████║██████╔╝█████╗   ║
  ║                    ██╔══██║██╔══██║██╔══██╗██╔══╝   ║
  ║                    ██║  ██║██║  ██║██║  ██║███████╗ ║
  ║                    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ║
  ║            "Super User DO... or do not, there is no try" ║
  ╚══════════════════════════════════════════════════╝
  `);
}

async function main() {
  printAsciiArt();
  
  const args = process.argv.slice(2);
  const command = args.join(' ').toLowerCase();
  
  if (!command) {
    console.log(`
  📋 Usage: sudo make <command>
  
  Available commands:
    sudo make coffee      - Brew some coffee
    sudo make sandwich   - Request a sandwich  
    sudo make todo       - Show priority list
    sudo make matrix     - Enter the matrix
    sudo make zen        - Enter zen mode
    sudo make roll       - Roll some dice
    sudo make build      - Compile everything
    sudo make test       - Run all tests
    sudo make love       - Get some love
    sudo make help       - Show all commands
    sudo make me a sandwich - The classics
    sudo make me coffee  - Classic reference
    `);
    return;
  }
  
  const sudoCommand = SUDO_COMMANDS[command];
  
  if (sudoCommand) {
    console.log(sudoCommand.response);
    
    if (sudoCommand.effect === 'coffee') {
      const startCoffee = question('\n  Start coffee machine? (y/n): ');
      if (startCoffee.toLowerCase() === 'y') {
        console.log('  Launching coffee machine...\n');
        try {
          execSync('npm run coffee', { stdio: 'inherit' });
        } catch {
          // Coffee script handles itself
        }
      }
    }
  } else {
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║       ⚠️  UNKNOWN COMMAND                        ║
  ║                                                  ║
  ║   "${command}"                                   ║
  ║                                                  ║
  ║   sudo make help                                 ║
  ║   to see available commands                     ║
  ╚══════════════════════════════════════════════════╝
    `);
  }
}

main().catch(console.error);
