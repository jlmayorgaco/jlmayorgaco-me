import type { TerminalData, CommandResult } from '../terminalTypes';
import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';
import { getCommand } from '../commandRegistry';

const ASCII_HEADER = `
     ██╗██╗     ███╗   ███╗████████╗
     ██║██║     ████╗ ████║╚══██╔══╝
     ██║██║     ██╔████╔██║   ██║   
██   ██║██║     ██║╚██╔╝██║   ██║   
╚█████╔╝███████╗██║ ╚═╝ ██║   ██║   
 ╚════╝ ╚══════╝╚═╝     ╚═╝   ╚═╝   
`.trim();

const whoamiCommand: CommandDefinition = {
  aliases: ['whoami', 'cat profile', 'profile'],
  description: 'Display comprehensive CV and identity',
  category: 'identity',
  execute: () => {
    const output = `${ASCII_HEADER}

╔══════════════════════════════════════════════════════════════════╗
║  JORGE LUIS MAYORGA TROYANO                                      ║
║  Research Engineer · Full-Stack Engineer · Systems Architect       ║
╚══════════════════════════════════════════════════════════════════╝

📍 PROFILE
${'─'.repeat(70)}
Research Engineer + Full-Stack Engineer with 8+ years of experience
building systems at the intersection of theory and implementation,
research and production, control and software.

🔬 Engineering Focus:
  • Robotics & Autonomous Systems
  • Distributed Control Systems  
  • Power Systems & Grid Stability
  • FPGA-based Real-time Estimation
  • Scientific Tooling & Benchmarking

💼 EXPERIENCE
${'─'.repeat(70)}

Alert Logic (2021–Present)
  Senior Frontend Developer
  ├─ Architecture improvements & data visualization systems
  ├─ UI design for complex security systems
  └─ Performance optimization & scalability

Asset Monitoring Systems
  Full-stack Developer
  ├─ IoT dashboards & real-time monitoring
  ├─ Real-time data processing systems
  └─ Performance optimization

Vurbis / Freelance
  Full-stack Developer
  ├─ E-commerce system architecture
  ├─ ML + IoT project delivery
  └─ End-to-end full-stack solutions

🎓 EDUCATION
${'─'.repeat(70)}
  • MSc Electronics & Computer Engineering — Universidad de los Andes
  • MSc Big Data & Artificial Intelligence — Universidad Isabel I
  • Electronic Engineering — Universidad de los Andes

⚡ TECHNICAL SKILLS
${'─'.repeat(70)}

Engineering:
  Control Systems │ Robotics │ Power Systems │ Signal Processing
  FPGA/Verilog │ Multi-Agent Systems │ Real-time Systems

Software:
  TypeScript │ Angular │ React │ Node.js │ Astro
  Python │ C/C++ │ Databases │ APIs │ Cloud Infrastructure

Research:
  Benchmarking │ Simulation │ Statistical Analysis
  Academic Writing │ Open Source Contribution

🌐 LANGUAGES
${'─'.repeat(70)}
  Spanish  ████████████████████  Native
  English  ███████████████████░  C1 (Professional)
  Chinese  ██████████████░░░░░░  B1 (Conversational)
  Japanese ██████████░░░░░░░░░░  A2/N4 (Basic)

🎯 RESEARCH INTERESTS
${'─'.repeat(70)}
  ▸ Distributed consensus in robotic swarms
  ▸ Real-time frequency estimation on FPGA
  ▸ Low-inertia grid stability analysis
  ▸ Benchmarking frameworks for control systems
  ▸ Multi-agent coordination algorithms

📡 CURRENT STATUS
${'─'.repeat(70)}
  [●] Available for research collaborations
  [●] Open to technical challenges
  [●] Seeking advanced engineering roles
  [○] Always learning (currently: Japanese, Advanced FPGA)

🔧 LAB SYSTEMS
${'─'.repeat(70)}
  Terminal: v2.4.1 │ Astro: v4.x │ React: v18 │ TypeScript: v5.x
  Uptime: 8+ years │ Status: OPERATIONAL │ Mode: RESEARCH

📧 CONTACT
${'─'.repeat(70)}
  Email:    hello@jlmayorga.co
  GitHub:   github.com/jlmayorga
  LinkedIn: linkedin.com/in/jlmayorga
  Web:      jlmayorga.co

${'═'.repeat(70)}
Type 'cv detailed' for full experience or 'cv projects' for portfolio
${'═'.repeat(70)}`;

    return { output, action: 'none' };
  },
};

const aboutCommand: CommandDefinition = {
  aliases: ['about', 'cv detailed', 'cv full'],
  description: 'Detailed CV with full experience',
  category: 'identity',
  execute: () => {
    const output = `DETAILED CURRICULUM VITAE
${'═'.repeat(70)}

PROFESSIONAL SUMMARY
${'─'.repeat(70)}
Engineer with dual expertise in research and production systems. 8+ years
building complex systems across security, IoT, e-commerce, and research
domains. Currently focused on bridging academic research (control systems,
robotics, power systems) with practical engineering implementation.

Unique positioning: Systems that sit between theory and implementation,
research and production, control engineering and software engineering.

PROFESSIONAL EXPERIENCE
${'─'.repeat(70)}

Alert Logic (2021–Present) │ Senior Frontend Developer │ Remote

Led architecture improvements for enterprise security platform serving
thousands of customers. Designed and implemented data visualization systems
for complex threat detection workflows. Established UI patterns for complex
system interfaces.

Key Achievements:
  • Redesigned core dashboard architecture, improving load times by 60%
  • Built reusable component library used across 5 product teams
  • Implemented real-time data visualization for threat detection
  • Mentored 3 junior developers to senior level
  • Led migration from legacy Angular to modern React architecture

Technologies: TypeScript, React, Angular, D3.js, WebGL, Node.js

Asset Monitoring Systems │ Full-stack Developer │ Remote

Developed IoT monitoring dashboards for industrial asset tracking. Built
real-time data processing pipelines handling 10K+ events/second. Optimized
database queries reducing latency by 40%.

Key Achievements:
  • Architected real-time monitoring dashboard for 500+ industrial sites
  • Implemented WebSocket-based live data feeds
  • Built predictive maintenance alerting system
  • Reduced infrastructure costs by 30% through optimization

Technologies: React, Node.js, PostgreSQL, TimescaleDB, MQTT, AWS

Vurbis / Freelance │ Full-stack Developer │ Remote (2018–2021)

Delivered end-to-end solutions for diverse clients including e-commerce
platforms, ML-powered recommendation systems, and IoT integrations.

Key Projects:
  • E-commerce platform processing $2M+ annual transactions
  • ML-based product recommendation engine (25% conversion improvement)
  • IoT sensor network for agricultural monitoring
  • Real-time chat system with 10K+ concurrent users

Technologies: React, Vue.js, Node.js, Python, TensorFlow, MongoDB, Redis

RESEARCH EXPERIENCE
${'─'.repeat(70)}

OpenFreqBench Project │ Lead Researcher │ 2023–Present

Developing open-source benchmarking framework for frequency estimation
algorithms in power systems. Focus on low-inertia grid scenarios with
high renewable penetration.

  • Implemented 6+ estimation algorithms (DFT, PLL, SOGI, EKF, Neural)
  • FPGA-based real-time validation on Xilinx Zynq
  • Published benchmarking methodology paper
  • Open-source release with 200+ GitHub stars

Swarm Robotics Research │ Independent │ 2022–Present

Exploring distributed consensus algorithms for multi-agent systems.
Simulations in MATLAB/Python, hardware validation on ESP32 mesh networks.

  • Implemented gossip-based consensus protocols
  • Hardware-in-the-loop validation
  • Formation control for hexagonal topologies
  • Communication delay tolerance analysis

EDUCATION
${'─'.repeat(70)}

MSc Electronics & Computer Engineering
Universidad de los Andes │ Bogotá, Colombia │ 2019–2021

  • Thesis: FPGA-based Real-time Frequency Estimation
  • GPA: 4.2/5.0
  • Focus: Digital Signal Processing, Control Systems

MSc Big Data & Artificial Intelligence
Universidad Isabel I │ Burgos, Spain │ 2020–2021

  • Focus: Machine Learning, Statistical Analysis, Data Engineering
  • Remote program with international cohort

Electronic Engineering
Universidad de los Andes │ Bogotá, Colombia │ 2012–2017

  • Focus: Control Systems, Embedded Systems, Signal Processing
  • Capstone: Motor Control System with FPGA

CERTIFICATIONS & COURSES
${'─'.repeat(70)}

  • Advanced FPGA Design (Xilinx) │ 2023
  • Power System Analysis (IEEE) │ 2022
  • Distributed Systems (MIT OpenCourseWare) │ 2021
  • Machine Learning (Stanford/Coursera) │ 2020

PUBLICATIONS
${'─'.repeat(70)}

  1. "OpenFreqBench: A Framework for Frequency Estimator Comparison"
     SGSMA 2026 Conference │ Under Review

  2. "Distributed Control in Low-Inertia Grids: A Graph-Theoretic Approach"
     IEEE Transactions │ In Preparation

  3. "Real-time FPGA Implementation of Kalman Filters for Power Systems"
     FPGA Conference │ Planned 2025

CONFERENCES & TALKS
${'─'.repeat(70)}

  • SGSMA 2026 │ Presenter │ "Benchmarking Frequency Estimators"
  • IEEE PES │ Attendee │ Grid Modernization Summit
  • Robotics Lab │ Guest Lecturer │ "From Theory to Robot"

OPEN SOURCE CONTRIBUTIONS
${'─'.repeat(70)}

  • OpenFreqBench │ Creator │ github.com/jlmayorga/openfreqbench
  • Control Systems Toolbox │ Contributor │ MATLAB/Octave
  • FPGA Examples │ Creator │ Educational Verilog examples
  • Astro Terminal │ Creator │ Terminal component for Astro

${'═'.repeat(70)}`;

    return { output, action: 'none' };
  },
};

const clearCommand: CommandDefinition = {
  aliases: ['clear', 'cls'],
  description: 'Clear terminal output',
  category: 'system',
  execute: () => ({ output: '__CLEAR__', action: 'none' }),
};

const helpCommand: CommandDefinition = {
  aliases: ['help', '?'],
  description: 'Show available commands',
  category: 'system',
  execute: () => {
    const categories = [
      { name: 'Identity & CV', cmds: ['whoami', 'about', 'cv skills', 'cv projects', 'cv contact', 'cv timeline', 'cv'] },
      { name: 'Content', cmds: ['projects', 'papers', 'research', 'contact', 'stack'] },
      { name: 'Navigation', cmds: ['cd', 'open', 'search', 'tags', 'tag', 'history'] },
      { name: 'System', cmds: ['ls', 'pwd', 'status', 'map', 'run system', 'clear', 'help'] },
      { name: 'Visual', cmds: ['theme', 'accent', 'layout', 'shuffle', 'reset', 'focus', 'chaos', 'stabilize', 'flip'] },
      { name: 'ASCII', cmds: ['drone', 'fpga', 'ml', 'drone fly', 'fpga boot'] },
      { name: 'Research', cmds: ['rocof', 'consensus', 'swarm', 'low-inertia', 'openfreqbench'] },
      { name: 'Easter Eggs', cmds: ['neofetch', 'build', 'cowsay', 'fortune', 'flip', 'matrix', 'hackerman'] },
    ];
    
    let help = `Available commands:\n${TERMINAL_DIVIDER}\n`;
    
    for (const cat of categories) {
      const cmds = cat.cmds.map(c => {
        const def = getCommand(c);
        return def ? `  ${c.padEnd(16)} - ${def.description}` : `  ${c}`;
      }).join('\n');
      help += `\n${cat.name}\n${cmds}\n`;
    }
    
    return { output: help, action: 'none' };
  },
};

const echoCommand: CommandDefinition = {
  aliases: ['echo', 'print'],
  description: 'Print text to terminal',
  category: 'system',
  execute: (args) => ({
    output: args.join(' ') || '',
    action: 'none',
  }),
};

const dateCommand: CommandDefinition = {
  aliases: ['date', 'time', 'now'],
  description: 'Show current date and time',
  category: 'system',
  execute: () => {
    const now = new Date();
    return {
      output: `${now.toUTCString()}\nLocal: ${now.toLocaleString()}`,
      action: 'none',
    };
  },
};

const cvSkillsCommand: CommandDefinition = {
  aliases: ['cv skills', 'skills', 'tech stack'],
  description: 'Display technical skills matrix',
  category: 'identity',
  execute: () => {
    const output = `TECHNICAL SKILLS MATRIX
${'═'.repeat(70)}

ENGINEERING
${'─'.repeat(70)}
Control Systems        [████████████████████] Expert
Robotics               [██████████████████░░] Advanced
Power Systems          [█████████████████░░░] Advanced
Signal Processing      [██████████████████░░] Advanced
FPGA/Verilog           [██████████████░░░░░░] Intermediate
Embedded Systems       [████████████████░░░░] Advanced
Multi-Agent Systems    [█████████████████░░░] Advanced

SOFTWARE DEVELOPMENT
${'─'.repeat(70)}
TypeScript/JavaScript  [████████████████████] Expert
React/Next.js          [███████████████████░] Expert
Angular                [██████████████████░░] Advanced
Node.js/Backend        [██████████████████░░] Advanced
Astro                  [█████████████████░░░] Advanced
Python                 [███████████████░░░░░] Intermediate
C/C++                  [█████████████░░░░░░░] Intermediate
PostgreSQL             [████████████████░░░░] Advanced
MongoDB                [███████████████░░░░░] Intermediate
AWS/Cloud              [██████████████░░░░░░] Intermediate
Docker                 [█████████████░░░░░░░] Intermediate

RESEARCH & DATA
${'─'.repeat(70)}
MATLAB/Simulink        [██████████████████░░] Advanced
Python (SciPy/NumPy)   [█████████████████░░░] Advanced
Statistical Analysis   [███████████████░░░░░] Intermediate
Benchmarking           [██████████████████░░] Advanced
Academic Writing       [████████████████░░░░] Advanced
Machine Learning       [█████████████░░░░░░░] Intermediate

TOOLS & PLATFORMS
${'─'.repeat(70)}
Git/GitHub             [████████████████████] Expert
Vivado/Vitis           [█████████████░░░░░░░] Intermediate
Linux/Unix             [██████████████████░░] Advanced
VS Code                [████████████████████] Expert
Jira/Agile             [█████████████████░░░] Advanced
Figma/Design           [█████████████░░░░░░░] Intermediate

${'─'.repeat(70)}
Proficiency Legend: Expert ████│ Advanced ███░│ Intermediate ██░░
${'═'.repeat(70)}`;

    return { output, action: 'none' };
  },
};

const cvProjectsCommand: CommandDefinition = {
  aliases: ['cv projects', 'projects overview', 'portfolio cv'],
  description: 'Display key project highlights',
  category: 'identity',
  execute: () => {
    const output = `KEY PROJECTS & ACHIEVEMENTS
${'═'.repeat(70)}

🚀 OPENSOURCE & RESEARCH
${'─'.repeat(70)}

OpenFreqBench (2023–Present)
├─ Open-source frequency estimation benchmarking framework
├─ 6+ algorithms implemented (DFT, PLL, SOGI, EKF, Neural)
├─ FPGA validation on Xilinx Zynq platform
├─ 200+ GitHub stars, active community
└─ Tech: Python, C++, Verilog, MATLAB

Astro Terminal Component (2024)
├─ Interactive terminal component for Astro framework
├─ 50+ terminal commands, vim/nano emulation
├─ Used in this website (jlmayorga.co)
└─ Tech: TypeScript, React, Astro

Swarm Robotics Simulator (2022–Present)
├─ Multi-agent consensus algorithm testing
├─ Hardware-in-loop with ESP32 mesh networks
├─ Formation control visualization
└─ Tech: Python, MATLAB, C++, ESP32

💼 PROFESSIONAL PROJECTS
${'─'.repeat(70)}

Enterprise Security Dashboard (Alert Logic)
├─ Real-time threat visualization
├─ Processing 1M+ events/day
├─ 60% performance improvement after redesign
└─ Tech: React, TypeScript, WebGL, D3.js

IoT Asset Monitoring Platform
├─ 500+ industrial sites monitored
├─ Real-time WebSocket data feeds
├─ Predictive maintenance alerts
├─ 30% infrastructure cost reduction
└─ Tech: React, Node.js, PostgreSQL, MQTT

E-commerce Recommendation Engine
├─ ML-powered product suggestions
├─ 25% conversion rate improvement
├─ $2M+ annual transaction processing
└─ Tech: Python, TensorFlow, Node.js, Redis

🎓 ACADEMIC PROJECTS
${'─'.repeat(70)}

FPGA Frequency Estimator (MSc Thesis)
├─ Real-time Kalman filter implementation
├─ 50μs latency on Zynq-7000
├─ Publication in preparation
└─ Tech: Verilog, Vivado, C++, Python

Motor Control System (Capstone)
├─ FPGA-based BLDC motor controller
├─ FOC algorithm implementation
├─ Real-time position control
└─ Tech: Verilog, MATLAB, Hardware Design

${'═'.repeat(70)}`;

    return { output, action: 'none' };
  },
};

const cvContactCommand: CommandDefinition = {
  aliases: ['cv contact', 'contact info', 'reach me'],
  description: 'Display contact information',
  category: 'identity',
  execute: () => {
    const output = `CONTACT INFORMATION
${'═'.repeat(70)}

📧 EMAIL
${'─'.repeat(70)}
  Professional:  hello@jlmayorga.co
  Academic:      jlmayorga@uniandes.edu.co

🌐 WEB & SOCIAL
${'─'.repeat(70)}
  Website:       https://jlmayorga.co
  GitHub:        https://github.com/jlmayorga
  LinkedIn:      https://linkedin.com/in/jlmayorga
  Twitter/X:     https://twitter.com/jlmayorga

📍 LOCATION
${'─'.repeat(70)}
  Based in:      Bogotá, Colombia (GMT-5)
  Timezone:      America/Bogota
  Availability:  UTC 13:00–22:00 (flexible)

💬 PREFERRED CONTACT
${'─'.repeat(70)}
  1. Email (fastest response)
  2. LinkedIn (professional)
  3. GitHub (technical discussions)

🎯 OPEN TO
${'─'.repeat(70)}
  ✓ Research collaborations
  ✓ Technical consulting
  ✓ Full-time opportunities
  ✓ Open-source contributions
  ✓ Speaking engagements
  ✓ Mentorship requests

📅 SCHEDULE A MEETING
${'─'.repeat(70)}
  Book a call: https://calendly.com/jlmayorga
  Or email with subject: "Meeting Request"

${'═'.repeat(70)}`;

    return { output, action: 'none' };
  },
};

const cvTimelineCommand: CommandDefinition = {
  aliases: ['cv timeline', 'experience timeline', 'career'],
  description: 'Display career timeline',
  category: 'identity',
  execute: () => {
    const output = `CAREER TIMELINE
${'═'.repeat(70)}

2024 [PRESENT]
${'─'.repeat(70)}
  ▸ Launched Data Lab on personal website
  ▸ Published OpenFreqBench v1.0
  ▸ Learning Japanese (N4 level reached)
  ▸ Exploring distributed robotics

2023
${'─'.repeat(70)}
  ▸ Started OpenFreqBench project
  ▸ Advanced FPGA course (Xilinx)
  ▸ IEEE Power Systems conference
  ▸ Began MSc Big Data & AI program

2021–2022
${'─'.repeat(70)}
  ▸ Joined Alert Logic as Senior Frontend Dev
  ▸ Led dashboard architecture redesign
  ▸ Completed MSc Electronics & Computer Eng
  ▸ FPGA thesis on frequency estimation

2019–2021
${'─'.repeat(70)}
  ▸ Started MSc at Universidad de los Andes
  ▸ Asset Monitoring Systems (Full-stack)
  ▸ Multiple freelance projects
  ▸ IoT and ML project delivery

2018
${'─'.repeat(70)}
  ▸ Transition to full-stack development
  ▸ Vurbis e-commerce projects
  ▸ First major React applications
  ▸ Cloud infrastructure learning

2017
${'─'.repeat(70)}
  ▸ Graduated Electronic Engineering
  ▸ Capstone: FPGA motor controller
  ▸ First professional development role
  ▸ Open source contributions begin

2012–2016
${'─'.repeat(70)}
  ▸ University studies at Uniandes
  ▸ Control systems focus
  ▸ Embedded systems projects
  ▸ Early programming experience

${'═'.repeat(70)}
  Total Experience: 8+ years
  Research Focus: 5+ years
  Engineering: 8+ years
${'═'.repeat(70)}`;

    return { output, action: 'none' };
  },
};

const cvCommand: CommandDefinition = {
  aliases: ['cv'],
  description: 'CV management commands',
  category: 'identity',
  execute: (args) => {
    const subcommand = args[0]?.toLowerCase();
    
    if (!subcommand) {
      return {
        output: `CV Command Manager
${'═'.repeat(70)}

Available CV commands:
  cv              - Show this help
  whoami          - Quick CV overview
  about           - Detailed full CV
  cv skills       - Technical skills matrix
  cv projects     - Key projects & achievements
  cv contact      - Contact information
  cv timeline     - Career timeline

Try: whoami or cv skills`,
        action: 'none',
      };
    }

    // These are handled by their respective commands
    return {
      output: `Use the specific command instead:
  'cv skills'     → use: skills
  'cv projects'   → use: cv projects
  'cv contact'    → use: cv contact
  'cv timeline'   → use: cv timeline

Or try: whoami (for full overview)`,
      action: 'none',
    };
  },
};

export function registerCoreCommands() {
  registerCommand(whoamiCommand);
  registerCommand(aboutCommand);
  registerCommand(cvSkillsCommand);
  registerCommand(cvProjectsCommand);
  registerCommand(cvContactCommand);
  registerCommand(cvTimelineCommand);
  registerCommand(cvCommand);
  registerCommand(clearCommand);
  registerCommand(helpCommand);
  registerCommand(echoCommand);
  registerCommand(dateCommand);
}
