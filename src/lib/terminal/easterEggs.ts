import type { CommandResult } from './terminalTypes';

export function checkEasterEgg(input: string): CommandResult | null {
  const cmd = input.toLowerCase().trim();

  if (cmd === 'neofetch') {
    return {
      output: `       ████████       │jlmt@lab
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

   jlmayorga.co      │Status: ACTIVE`,
      action: 'none',
    };
  }

  if (cmd === 'top' || cmd === 'htop') {
    return {
      output: `top - ${new Date().toLocaleTimeString()} up 847 days, load: 0.42
Tasks: 3 sleeping, 12 running, 0 zombie
%Cpu:  8.3%us, 12.1%sy, 79.6%id
KiB Mem: 16384000 total, 2097152 free

  PID USER   COMMAND
    1 root    init → research-daemon
  847 jlmt    /home/jlmt/robots/swarm_ctrl
 1024 jlmt    /home/jlmt/fpga/kalman_filt
 1337 jlmt    /home/jlmt/grid/freq_est
 2048 jlmt    python train_model.py
 4096 root    [fpga-manager]`,
      action: 'none',
    };
  }

  if (cmd === 'sudo') {
    const args = input.toLowerCase().split(' ').slice(1).join(' ');
    if (args.includes('make coffee') || args === 'make coffee') {
      return {
        output: `Sorry, user jlmt is not in the sudoers file.
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
Aborted.`,
        action: 'none',
      };
    }
    return {
      output: `[sudo] password for jlmt: 
jlmt is not in the sudoers file. This incident will be reported.`,
      action: 'none',
    };
  }

  if (cmd === 'compile' || cmd === 'make') {
    return {
      output: `make: Nothing to be done for 'all'.
make: 'research' is up to date.
make: 'publications' is up to date.

✓ Build successful`,
      action: 'none',
    };
  }

  if (cmd === 'deploy swarm') {
    return {
      output: `Deploying swarm configuration...
   ○ NODE-001 ....... CONNECTING
   ○ NODE-002 ....... CONNECTING
   ○ NODE-003 ....... CONNECTING
   ● NODE-004 ....... ONLINE
   ● NODE-005 ....... ONLINE
   ○ NODE-006 ....... CONNECTING

Swarm deployed: 4/6 nodes active
Consensus algorithm: RUNNING
Formation: HEXAGONAL
Status: OPERATIONAL`,
      action: 'none',
    };
  }

  if (cmd === 'engage control') {
    return {
      output: `ENGAGING CONTROL SYSTEMS...

   ◉ LQR Controller ....... ARMED
   ◉ MPC Optimizer ......... ARMED  
   ◉ State Estimator ....... ACTIVE
   ◉ Safety Monitor ........ ARMED

WARNING: This is a simulation environment.
No actual hardware connected.

CONTROL ENGAGED: SUCCESS`,
      action: 'none',
    };
  }

  if (cmd === 'roccof' || cmd === 'rocof') {
    return {
      output: `RoCoF (Rate of Change of Frequency) Monitor
${'═'.repeat(40)}
Grid Frequency:    60.002 Hz
RoCoF:            -12.4 mHz/s
Status:           STABLE

Low-inertia threshold: 50 mHz/s
Current margin: 37.6 mHz/s ✓

System: NOMINAL`,
      action: 'none',
    };
  }

  if (cmd === 'fpga' || cmd === 'ls /dev/fpga') {
    return {
      output: `FPGA Resources
${'═'.repeat(40)}
Device:    /dev/xilinx_fpga0
Model:     XC7K325T-FFG900
BRAM:      4450 KB (used: 2340 KB)
DSP Slices: 840 (used: 412)
FF:        203800 (used: 89400)
LUT:       101900 (used: 51200)
Clock:     100 MHz (PLL locked)

Status: PROGRAMMED
Bitstream: kalman_filter_v2.3.bit`,
      action: 'none',
    };
  }

  if (cmd === 'init' || cmd === 'init system') {
    return {
      output: `Initializing JLMT Lab System...

[  OK  ] Starting journal service
[  OK  ] Loading FPGA bitstream
[  OK  ] Initializing ROS master
[  OK  ] Connecting to robot swarm
[  OK  ] Calibrating sensors
[  OK  ] Loading control parameters
[  OK  ] Starting data acquisition

Welcome to JLMT Lab System 4.2.0
Kernel: Neural-Distributed 5.15

Type 'help' for available commands.`,
      action: 'none',
    };
  }

  if (cmd === 'coffee' || cmd === 'make coffee') {
    return {
      output: `   ( (
    ) )
  .______.
  |      |]
  \\      /
   \`----'

Brewing coffee...
Warning: Coffee maker offline.
Hint: Try 'sudo make coffee' for simulation mode.`,
      action: 'none',
    };
  }

  if (cmd === 'exit' || cmd === 'logout') {
    return {
      output: `logout: session persists.
Terminal sessions cannot be closed.
This is a feature, not a bug.

Try: clear`,
      action: 'none',
    };
  }

  if (cmd === 'drone run' || cmd === 'fly drone' || cmd === 'launch drone' || cmd === 'drone fly') {
    return {
      output: `INITIALIZING DRONE SWARM...
      
         ╭─────────────────────╮
    ╭────┤  SWARM CONTROL v2.4 ├────╮
    │    ╰─────────────────────╯    │
    │   ┌─────────────────────────┐ │
    │   │  ░░░ DRONE-001 ░░░     │ │
 ◀─╯   │    ╭─╮    ····    ╭─╮    │ │──▶
   ◀╯──│   ╭┴╮╰╮  ···  ╭┴─╮╰╮   │ │──╱──▶
 ◀─╯   │    │ │ ╰╮····╭╯ │ ╰│    │ │──╲──▶
       │   ╭┴╮╭╮╰╮····╭╯╭─╮╰╮   │ │
       │   │ │╭╮ ╰╮··╭╯ ╭╮ │ │   │ │
       │   ╰─┸╰╯ ╰╮··╭╯ ╰╯ ╰─╯   │ │
       │  ░░░░░░░░░░░░░░░░░░░░░░ │ │
       └─────────────────────────┘ │
       
[1] Drone-001 .............. ARMED
[2] Drone-002 .............. ARMED  
[3] Drone-003 .............. ARMED
[4] Drone-004 .............. ARMED

FORMATION: HEXAGONAL GRID
ALTITUDE: 50m
STATUS: OPERATIONAL

    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
    
DRONE SWARM: DEPLOYED`,
      action: 'none',
    };
  }

  if (cmd === 'drone scan' || cmd === 'scan area' || cmd === 'drone survey') {
    return {
      output: `RUNNING AREA SCAN...
      
         .  *  .   .  *  .  *
      *    ___________    *
    .    /   ░░░░░░░░░\\   .    *
       * |   AREA SCAN  |  *
    .    \\_____█████___/    .  
      *    /|   ░░░░░░|\\    *
         . | SCANNING | .  *
      *    .|_________|.    *
    .  *  .  *  .  *  .  *  .
    
SCAN PROGRESS: ████████░░ 80%
COVERAGE: 847m²
ANOMALIES: 3 detected
OBJECTS: 12 classified

Scan complete. Data logged to /lab/survey/`,
      action: 'none',
    };
  }

  if (cmd === 'drone status' || cmd === 'drone info') {
    return {
      output: `DRONE FLEET STATUS
${'═'.repeat(40)}
Drone-001: ACTIVE  (Battery: 87%)
Drone-002: ACTIVE  (Battery: 92%)
Drone-003: IDLE    (Battery: 100%)
Drone-004: ACTIVE  (Battery: 78%)

Total Range: 12km
Max Speed: 15 m/s
Payload: LIDAR + RGB-D Camera
Comm: Mesh Network (encrypted)`,
      action: 'none',
    };
  }

  if (cmd === 'drive' || cmd === 'drive robot' || cmd === 'robot drive') {
    return {
      output: `        _______________
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

ROBOT DRIVE MODE ENGAGED
Control: Joystick mapped
Speed: 0.5 m/s (default)
Camera: STREAMING

Use arrow keys or WASD to drive.`,
      action: 'none',
    };
  }

  if (cmd === 'robot status' || cmd === 'diagnostics') {
    return {
      output: `SYSTEM DIAGNOSTICS
${'═'.repeat(40)}
Motors:     ✓ NOMINAL
Sensors:    ✓ NOMINAL  
Battery:    87% (3.2h remaining)
LIDAR:      ✓ ACTIVE
Camera:     ✓ STREAMING
FPGA:       ✓ PROGRAMMED
ROS Node:   ✓ RUNNING

Temperature: 42°C (OK)
CPU Load:    23%
Memory:      1.2GB / 4GB

ALL SYSTEMS OPERATIONAL`,
      action: 'none',
    };
  }

  if (cmd === 'matrix' || cmd === 'matrix rain') {
    return {
      output: `                         ..
                    ..  ..
           ..  ....????????????....
         .???????????????????????7 ..
       .???????????????????????II?I.
      .???????????????????????I777I.
      .??????????????????????I7777I
      .??????::?????????::???I7777?.
      .?????  :?????::: :???:I7777?.
      ??????   :??:::     :???I7777?.
      ????:?   ??::  ::   :??I7777?.
      ????  ?  ??: ::  :   ??I7777 .
      ????  ?. ??:       :  ??I777 .
      ???? .??. ??        : .??I77. .
      ??. .???. ??:       :?  ???. .
      ?..  ???  ??:    :: :?.  ?.  ..
       ..  .??  .??: :?. :?.  ..  ..
           ...   ...  ..   ...    ..
           
(matrix) Digital rain initiated...
Research proceeds in background.

Wake up, Neo...`,
      action: 'none',
    };
  }

  if (cmd === 'ping') {
    return {
      output: `PING lab.jlmayorga.co
Reply from 127.0.0.1: bytes=64 time<1ms TTL=64
Reply from 127.0.0.1: bytes=64 time<1ms TTL=64
Reply from 127.0.0.1: bytes=64 time<1ms TTL=64

--- lab.jlmayorga.co ping statistics ---
3 packets transmitted, 3 received, 0% packet loss`,
      action: 'none',
    };
  }

  return null;
}