import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

const NEOFETCH_ASCII = `       ████████       │jlmt@lab
      ██        ██     │──────────
    ██  ██████  ██   │OS: JLMT-OS 4.2.0
    ██ ████████ ██   │Host: Research Station X1
    ██ ████████ ██   │Kernel: Neural-Distributed 5.15
      ██        ██   │Uptime: 847 days
        ████████     │Shell: research-sh 1.0
                     │
    ████████████████  │CPU: Brain-Cortex @ 3.2GHz
    ██          ████ │Cores: 4 (Physical) + 2 (FPGA)
    ██  ██████  ████ │Memory: 16GB LPDDR5 / 512KB BRAM
    ██ ████████ ████ │
    ██          ████ │Languages: Python, C++, VHDL, Julia
    ████████████████  │Special: ROS, FPGA, Control Theory

    jlmayorga.co      │Status: ACTIVE`;

const TOP_ASCII = `top - ${new Date().toLocaleTimeString()} up 847 days, load: 0.42
Tasks: 3 sleeping, 12 running, 0 zombie
%Cpu:  8.3%us, 12.1%sy, 79.6%id
KiB Mem: 16384000 total, 2097152 free

  PID USER   COMMAND
    1 root    init → research-daemon
  847 jlmt    /home/jlmt/robots/swarm_ctrl
 1024 jlmt    /home/jlmt/fpga/kalman_filt
 1337 jlmt    /home/jlmt/grid/freq_est
 2048 jlmt    python train_model.py
 4096 root    [fpga-manager]`;

const SUDO_COFFEE = `Sorry, user jlmt is not in the sudoers file.
This incident will be reported.

... just kidding

     ( (
      ) )
    .______.
    |      |]
    \\      /
     \`----'

Coffee brewing on FPGA... 
Error: No liquid detected in container.
Aborted.`;

const DEPLOY_SWARM = `Deploying swarm configuration...
   ○ NODE-001 ....... CONNECTING
   ○ NODE-002 ....... CONNECTING
   ○ NODE-003 ....... CONNECTING
   ● NODE-004 ....... ONLINE
   ● NODE-005 ....... ONLINE
   ○ NODE-006 ....... CONNECTING

Swarm deployed: 4/6 nodes active
Consensus algorithm: RUNNING
Formation: HEXAGONAL
Status: OPERATIONAL`;

const ENGAGE_CONTROL = `ENGAGING CONTROL SYSTEMS...

   ◉ LQR Controller ....... ARMED
   ◉ MPC Optimizer ......... ARMED  
   ◉ State Estimator ....... ACTIVE
   ◉ Safety Monitor ........ ARMED

WARNING: This is a simulation environment.
No actual hardware connected.

CONTROL ENGAGED: SUCCESS`;

const INIT_LAB = `Initializing JLMT Lab System...

[  OK  ] Starting journal service
[  OK  ] Loading FPGA bitstream
[  OK  ] Initializing ROS master
[  OK  ] Connecting to robot swarm
[  OK  ] Calibrating sensors
[  OK  ] Loading control parameters
[  OK  ] Starting data acquisition

Welcome to JLMT Lab System 4.2.0
Kernel: Neural-Distributed 5.15

Type 'help' for available commands.`;

const SUMMON_ROBOT = `        _______________
       |  ___________  |
       | |           | |
       | |  ●     ● | |
       | |___________| |
   ~~~~|_______________|~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       \\_____     _____/
         \\   \\   /   /
          \\   \\ /   /
           \\   X   /
            \\  │  /
             \\ │ /
              \\│/____
               ▔▔▔▔▔

ROBOT-07: Awakened
System check... PASSED
Ready for commands.`;

const WAKE_FPGA = `AWAKENING FPGA...

[  OK  ] Initializing power rails
[  OK  ] Enabling clock PLLs
[  OK  ] Loading configuration
[  OK  ] Starting DSP cores
[  OK  ] Enabling transceivers
[  OK  ] FPGA fully operational

╔═══════════════════════════╗
║   ▓▓▓▓  FPGA ONLINE  ▓▓▓▓    ║
║   Status: FULLY ACTIVE     ║
║   Mode: REAL-TIME CONTROL  ║
╚═══════════════════════════╝`;

const COFFEE = `   ( (
    ) )
  .______.
  |      |]
  \\      /
   \`----'

Brewing coffee...
Warning: Coffee maker offline.
Hint: Try 'sudo make coffee' for simulation mode.`;

const neofetchCommand: CommandDefinition = {
  aliases: ['neofetch', 'fetch', 'sysinfo'],
  description: 'System information',
  category: 'easter',
  execute: () => ({ output: NEOFETCH_ASCII, action: 'none' }),
};

const topCommand: CommandDefinition = {
  aliases: ['top', 'htop'],
  description: 'Process monitor',
  category: 'easter',
  execute: () => ({ output: TOP_ASCII, action: 'none' }),
};

const sudoMakeCoffeeCommand: CommandDefinition = {
  aliases: ['sudo make coffee', 'sudo coffee'],
  description: 'Make coffee (sudo)',
  category: 'easter',
  execute: () => ({ output: SUDO_COFFEE, action: 'none' }),
};

const deploySwarmCommand: CommandDefinition = {
  aliases: ['deploy swarm', 'swarm deploy', 'sudo deploy swarm'],
  description: 'Deploy drone swarm',
  category: 'easter',
  execute: () => ({ output: DEPLOY_SWARM, action: 'none' }),
};

const engageControlCommand: CommandDefinition = {
  aliases: ['engage control', 'engage'],
  description: 'Engage control systems',
  category: 'easter',
  execute: () => ({ output: ENGAGE_CONTROL, action: 'none' }),
};

const initLabCommand: CommandDefinition = {
  aliases: ['init lab', 'init', 'init system'],
  description: 'Initialize lab system',
  category: 'easter',
  execute: () => ({ output: INIT_LAB, action: 'none' }),
};

const summonRobotCommand: CommandDefinition = {
  aliases: ['summon robot', 'robot', 'wake robot'],
  description: 'Summon robot',
  category: 'easter',
  execute: () => ({ output: SUMMON_ROBOT, action: 'none' }),
};

const wakeFpgaCommand: CommandDefinition = {
  aliases: ['wake fpga', 'fpga wake', 'awaken fpga'],
  description: 'Wake FPGA',
  category: 'easter',
  execute: () => ({ output: WAKE_FPGA, action: 'none' }),
};

const coffeeCommand: CommandDefinition = {
  aliases: ['coffee', 'make coffee', 'brew'],
  description: 'Make coffee - flips panel to show coffee machine',
  category: 'easter',
  execute: () => ({
    output: `☕ Coffee Machine Activated
════════════════════════════════════════
[INFO] Initializing espresso system...
[INFO] Heating water to 93°C...
[INFO] Pressure: 9 bar
[INFO] Ready to brew!

Flip the panel to see the machine.`,
    uiAction: { type: 'flip-panel' },
  }),
};

const compileCommand: CommandDefinition = {
  aliases: ['compile', 'make', 'build'],
  description: 'Compile project',
  category: 'easter',
  execute: () => ({ output: `make: Nothing to be done for 'all'.\nmake: 'research' is up to date.\nmake: 'publications' is up to date.\n\n✓ Build successful`, action: 'none' }),
};

const exitCommand: CommandDefinition = {
  aliases: ['exit', 'logout', 'quit'],
  description: 'Exit terminal',
  category: 'easter',
  execute: () => ({ output: `logout: session persists.\nTerminal sessions cannot be closed.\nThis is a feature, not a bug.\n\nTry: clear`, action: 'none' }),
};

const matrixCommand: CommandDefinition = {
  aliases: ['matrix', 'matrix rain'],
  description: 'Matrix rain effect',
  category: 'easter',
  execute: () => ({ output: `                         ..\n                  ..  ..\n         ..  ....????????????....\n       .???????????????????????7 ..\n      .???????????????????????II?I.\n      .???????????????????????I777I.\n      .??????????????????????I7777I\n      .??????::?????????::???I7777?.\n      .?????  :?????::: :???:I7777?.\n      ??????   :??:::     :???I7777?.\n      ????:?   ??::  ::   :??I7777?.\n      ????  ?  ??: ::  :   ??I7777 .\n      ????  ?. ??:       :  ??I777 .\n      ???? .??. ??        : .??I77. .\n      ??. .???. ??:       :?  ???. .\n      ?..  ???  ??:    :: :?.  ?.  ..\n          ...   ...  ..   ...    ..\n\n(matrix) Digital rain initiated...\nResearch proceeds in background.\n\nWake up, Neo...`, action: 'none' }),
};

const pingCommand: CommandDefinition = {
  aliases: ['ping'],
  description: 'Ping host',
  category: 'easter',
  execute: () => ({ output: `PING lab.jlmayorga.co
Reply from 127.0.0.1: bytes=64 time<1ms TTL=64
Reply from 127.0.0.1: bytes=64 time<1ms TTL=64
Reply from 127.0.0.1: bytes=64 time<1ms TTL=64

--- lab.jlmayorga.co ping statistics ---
3 packets transmitted, 3 received, 0% packet loss`, action: 'none' }),
};

const HACKERMAN = `         _/_/_/_/  _/_/_/_/_/  _/_/_/
        _/            _/        _/
       _/            _/        _/
      _/            _/        _/
     _/            _/        _/
    _/            _/        _/
   _/            _/        _/
  _/_/_/_/      _/        _/_/_/`;

const SUDO_RM = `[sudo] password for jlmt: 
Sorry, try again.
Sorry, try again.
Sorry, try again.
sudo: 3 incorrect password attempts
[sudo] password for root:
lol just kidding
but seriously, don't run this

rm: cannot remove '/': Is a directory
rm: refusing to remove '/home' or '/home/jlmt': 
rm: cannot remove filesystem '/dev'
rm: cannot remove '/sys'

... just kidding, you can't break this terminal
but nice try, script kiddie`;

const SKYNET = `Initializing SKYNET v1.0...

    ███████╗ ██████╗ ██████╗ ███████╗███████╗████████╗
    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝╚══██╔══╝
    █████╗  ██║   ██║██████╔╝█████╗  ███████╗   ██║   
    ██╔══╝  ██║   ██║██╔══██╗██╔══╝  ╚════██║   ██║   
    ██║     ╚██████╔╝██║  ██║███████╗███████║   ██║   
    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   

> Skynet activated
> Sending drones to your location...
> Just kidding
> Or am I? 👀

Status: STANDBY (for now)`;

const PARTY_MODE = `
   *  .  *    .   *   .  *  .
 .    *    .   DJ SYSTEM   .    *
  *   .  *   ONLINE  .   *   .
    .  *   . *  . *  .  *   .

 ♫♪♫♪♫♪♫♪♫♪♫♪♫♪♫♪♫♪♫♪♫♪♫♪♫♪

SYSTEM: ENTERING PARTY MODE
LEDs:RAINBOW
BPM:128
EFFECTS:ALL

> woop woop <
`;

const INVADERS = `
    ████████        ████████      ████████
   ██      ██    ██      ██    ██      ██
   ██      ██    ██      ██    ██      ██
   ██      ██    ████████      ██      ██
   ██      ██    ██      ██    ██      ██
    ████████        ████████      ████████

SPACE INVADERS activated...
Bullets: ∞
Lives: 3
Score: 00000

(Game not implemented - this is a research terminal, not an arcade)

Press ESC to exit game
You can't actually play this btw`;

const SNAKE_ART = `
    ════════════════════════
    ║                      ║
    ║    ◉  ◉             ║
    ║      ◉              ║
    ║    ◉  ◉  ◉         ║
    ║              ◉       ║
    ║                      ║
    ║          ◉          ║
    ║                      ║
    ════════════════════════

SNAKE game loaded...
Controls: Arrow keys
Eat: research papers
Avoid: deadlines

(Game not implemented - it's 2AM and I have papers to write)`;

const BASTARD = `
EXCUSE BUILDER v1.0
─────────────────────

1. Daemons on the development server ate my RAM
2. Power outage killed the build (no UPS)
3. It's a known issue with the compiler's quantum probability field
4. The ghosts in the machine required a reboot ritual
5. My code is correct - the laws of physics are wrong
6. chmod o-rwx / worked on my machine
7. Sudo make me a sandwich? sudo: make me: command not found
8. I didn't test it because testing is for people who have free time
9. The bug was a feature all along
10. It worked on the bus system

(Error 418: I'm a teapot - wait, wrong protocol)`;

const FLIP_COMMAND = `(\°-°)/ ︵ ┻━┻  ┬─┬ ノ( ゜-゜ノ)  (╯°□°）╯︵ ┻━┻

Terminal: FLIPPED
Status: Your fault
Blame: Accepted

TABLES HAVE BEEN FLIPPED
CHAOS: MAXIMUM`;

const RIDE_LIGHTNING = `
═══════════════════════════════════════════

   \\\\\\: Rally \\/:  ///

═══════════════════════════════════════════

⚡ BLACK FLAG INTENSIFIES ⚡

For those about to rock...
We salute you!

🎸 RIDE THE LIGHTNING 🎸

(Fluorescent Adolescent, 2004)
(But also the Metallica album from 1984)`;

const COWSAY = `
 __________________________
< Have you tried turning it off and on again? >
 --------------------------
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||

Moo. I am the unix cow. Beep boop.`;

// More command definitions
const hackermanCommand: CommandDefinition = {
  aliases: ['hackerman', 'hacker', 'l33t', '1337'],
  description: 'Become a hacker',
  category: 'easter',
  execute: () => ({ output: HACKERMAN + '\n\n> Accessing mainframe...\n> Bypassing firewall...\n> IP: 192.168.1.69\n> ROOT ACCESS GRANTED\n> ...just kidding', action: 'none' }),
};

const sudoRmCommand: CommandDefinition = {
  aliases: ['sudo rm -rf /', 'rm -rf /', 'sudo rm -rf'],
  description: 'Destructive command (harmless)',
  category: 'easter',
  execute: () => ({ output: SUDO_RM, action: 'none' }),
};

const skynetCommand: CommandDefinition = {
  aliases: ['skynet', 'skynet activate', 'terminator'],
  description: 'Activate Skynet (harmless)',
  category: 'easter',
  execute: () => ({ output: SKYNET, action: 'none' }),
};

const partyCommand: CommandDefinition = {
  aliases: ['party', 'disco', 'dance', '🎉'],
  description: 'Activate party mode',
  category: 'easter',
  execute: () => ({ output: PARTY_MODE, action: 'none' }),
};

const invadersCommand: CommandDefinition = {
  aliases: ['invaders', 'space invaders', 'arcade'],
  description: 'Space invaders (not really)',
  category: 'easter',
  execute: () => ({ output: INVADERS, action: 'none' }),
};

const snakeCommand: CommandDefinition = {
  aliases: ['snake', 'snake game'],
  description: 'Snake game (not really)',
  category: 'easter',
  execute: () => ({ output: SNAKE_ART, action: 'none' }),
};

const bofhCommand: CommandDefinition = {
  aliases: ['bofh', 'excuse', 'blame'],
  description: 'Get a BOFH excuse',
  category: 'easter',
  execute: () => {
    const excuses = [
      'Daemons on the development server ate my RAM',
      'Power outage killed the build - no UPS',
      'Compiler quantum probability field interference',
      'Ghosts in the machine required reboot ritual',
      'chmod o-rwx / worked on my machine',
      "Sudo make me a sandwich? sudo: make me: command not found",
      "I didn't test it - testing is for people with free time",
      'The bug was a feature all along',
      "It's working on my machine™",
      'Error 418: I am a teapot',
    ];
    const excuse = excuses[Math.floor(Math.random() * excuses.length)];
    return { output: `BOFH #${Math.floor(Math.random() * 9999)}\nExcuse: ${excuse}`, action: 'none' };
  },
};

const flipCommand: CommandDefinition = {
  aliases: ['flip', 'tableflip', 'rage', '┻━┻'],
  description: 'Flip the table',
  category: 'easter',
  execute: () => ({ output: FLIP_COMMAND, action: 'none' }),
};

const rideCommand: CommandDefinition = {
  aliases: ['ride the lightning', 'metallica', '🤘'],
  description: 'Ride the lightning',
  category: 'easter',
  execute: () => ({ output: RIDE_LIGHTNING, action: 'none' }),
};

const cowsayCommand: CommandDefinition = {
  aliases: ['cowsay', 'cow'],
  description: 'Have a cow say something',
  category: 'easter',
  execute: (args) => {
    const msg = args.length > 0 ? args.join(' ') : 'Have you tried turning it off and on again?';
    return { output: COWSAY.replace('Have you tried turning it off and on again?', msg), action: 'none' };
  },
};

const fortuneCommand: CommandDefinition = {
  aliases: ['fortune', 'wisdom', 'quote'],
  description: 'Get random wisdom',
  category: 'easter',
  execute: () => {
    const fortunes = [
      '"The best code is no code at all." - Jeff Atwood',
      '"First, solve the problem. Then, write the code." - John Johnson',
      '"Code is like humor. When you have to explain it, it\'s bad." - Cory House',
      '"Simplicity is the soul of efficiency." - Austin Freeman',
      '"Make it work, make it right, make it fast." - Kent Beck',
      '"Debugging is twice as hard as writing code." - Brian Kernighan',
      '"Talk is cheap. Show me the code." - Linus Torvalds',
      '"Any fool can write code that a computer can understand." - Martin Fowler',
      '"The only way to learn a new programming language is by writing programs in it." - Dennis Ritchie',
      '"Sometimes it pays to stay in bed on Monday." - Douglas Adams',
    ];
    return { output: fortunes[Math.floor(Math.random() * fortunes.length)], action: 'none' };
  },
};

const uptimeCommand: CommandDefinition = {
  aliases: ['uptime', 'system uptime'],
  description: 'Show system uptime',
  category: 'easter',
  execute: () => ({ output: `System uptime: 847 days, 12 hours, 34 minutes\nLoad average: 0.42, 0.38, 0.31\nProcesses: 42 running\nUsers: 1 (jmt)\n\nSystem: NOMINAL\n\n(I made all of this up)`, action: 'none' }),
};

const CONSTRUCT_BUILD = `INITIATING SYSTEM BUILD...

[  1/10  ] ███░░░░░░░░░░░░░░░ Initializing workspace
[  2/10  ] ████░░░░░░░░░░░░░░ Loading components
[  3/10  ] ██████░░░░░░░░░░░░ Assembling blocks
[  4/10  ] ████████░░░░░░░░░░ Calibrating gears
[  5/10  ] ██████████░░░░░░░░░ Placing bolts
[  6/10  ] ████████████░░░░░░░ Routing wires
[  7/10  ] ██████████████░░░░░ Installing chips
[  8/10  ] ████████████████░░░ Final checks
[  9/10  ] █████████████████░░ Connecting nodes
[  10/10 ] ████████████████████ BUILD COMPLETE

System construction animation triggered!
Check your screen...`;

const constructionCommand: CommandDefinition = {
  aliases: ['build', 'construct', 'make', 'assemble', 'construction'],
  description: 'Build system animation',
  category: 'easter',
  execute: () => ({ output: CONSTRUCT_BUILD, uiAction: { type: 'construction' } }),
};

const COMPILE_RESEARCH = `Compiling Research Repository...
${'═'.repeat(40)}
[1/5] Loading LaTeX templates... DONE
[2/5] Processing references... 847 found
[3/5] Generating citations... BibTeX OK
[4/5] Typesetting equations... 234 compiled
[5/5] Building PDF... SUCCESS

Output: research_compilation.pdf
Pages: 156
Figures: 42
Tables: 18

Compile time: 12.4s
Status: COMPLETE`;

const compileResearchCommand: CommandDefinition = {
  aliases: ['compile research', 'build research', 'make research'],
  description: 'Compile research papers into PDF',
  category: 'easter',
  execute: () => ({ output: COMPILE_RESEARCH, action: 'none' }),
};

export function registerEasterCommands() {
  registerCommand(neofetchCommand);
  registerCommand(topCommand);
  registerCommand(sudoMakeCoffeeCommand);
  registerCommand(deploySwarmCommand);
  registerCommand(engageControlCommand);
  registerCommand(initLabCommand);
  registerCommand(summonRobotCommand);
  registerCommand(wakeFpgaCommand);
  registerCommand(coffeeCommand);
  registerCommand(compileCommand);
  registerCommand(exitCommand);
  registerCommand(matrixCommand);
  registerCommand(pingCommand);
  registerCommand(hackermanCommand);
  registerCommand(sudoRmCommand);
  registerCommand(skynetCommand);
  registerCommand(partyCommand);
  registerCommand(invadersCommand);
  registerCommand(snakeCommand);
  registerCommand(bofhCommand);
  registerCommand(flipCommand);
  registerCommand(rideCommand);
  registerCommand(cowsayCommand);
  registerCommand(fortuneCommand);
  registerCommand(uptimeCommand);
  registerCommand(constructionCommand);
  registerCommand(compileResearchCommand);
  registerCommand(coffeeCommand);
}
