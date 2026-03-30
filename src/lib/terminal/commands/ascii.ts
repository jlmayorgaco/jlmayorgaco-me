import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

const DRONE_FRAMES = [
  `       ╭─────────────────────╮
  ╭────┤   SWARM CONTROL v2.4   ├────╮
  │    ╰─────────────────────╯    │
  │   ┌─────────────────────────┐ │
  │   │    ░░░ DRONE-001 ░░░    │ │
 ◀╯   │     ╭─╮    ····    ╭─╮   │ │──▶
  ◀╯──│    ╭┴╮╰╮  ···  ╭┴─╮╰╮   │ │──╱──▶
 ◀─╯   │     │ │ ╰╮····╭╯ │ ╰│    │ │──╲──▶
   │   │    ╭┴╮╭╮╰╮····╭╯╭─╮╰╮   │ │
   │   │    │ │╭╮ ╰╮··╭╯ ╭╮ │ │   │ │
   │   │    ╰─┸╰╯ ╰╮··╭╯ ╰╯ ╰─╯   │ │
   │   │   ░░░░░░░░░░░░░░░░░░░░░░  │ │
   └───────────────────────────────┘ │
   `,
  `       ╭─────────────────────╮
  ╭────┤   SWARM CONTROL v2.4   ├────╮
  │    ╰─────────────────────╯    │
  │   ┌─────────────────────────┐ │
  │   │    ░░░ DRONE-001 ░░░    │ │
   ◀╯  │     ╭─╮    ····    ╭─╮   │ │──▶
  ◀╯──│    ╭┴╮╰╮  ···  ╭┴─╮╰╮   │ │──╱──▶
   ◀╯  │     │ │ ╰╮····╭╯ │ ╰│    │ │──╲──▶
   │   │    ╭┴╮╭╮╰╮····╭╯╭─╮╰╮   │ │
   │   │    │ │╭╮ ╰╮··╭╯ ╭╮ │ │   │ │
   │   │    ╰─┸╰╯ ╰╮··╭╯ ╰╯ ╰─╯   │ │
   │   │   ░░░░░░░░░░░░░░░░░░░░░░  │ │
   └───────────────────────────────┘ │
   `,
];

const DRONE_PATROL = `PATROL MODE ACTIVE
${'═'.repeat(40)}
Scanning sector 7-G...
Altitude: 50m
Speed: 8 m/s
Heading: 045°

[■□□□□□□□□□] 10% - Entering patrol zone
[■■□□□□□□□□] 20% - Waypoint 1 reached
[■■■□□□□□□□] 30% - Scanning...
[■■■■□□□□□□] 40% - Waypoint 2 reached
[■■■■■□□□□□] 50% - Anomaly detected
[■■■■■■□□□□] 60% - Analyzing
[■■■■■■■□□□] 70% - Clear
[■■■■■■■■□□] 80% - Returning
[■■■■■■■■■□] 90% - Waypoint 3
[■■■■■■■■■■] 100% - Patrol complete

All sectors clear.`;

const DRONE_LAND = `INITIATING LANDING SEQUENCE...
${'═'.repeat(40)}
[1] Reducing altitude...... 50m → 20m
[2] Stabilizing hover..... DONE
[3] Descending............ 20m → 5m
[4] Final approach........ 5m → 0m
[5] Touchdown............. DONE

Drone-001: LANDED
Battery: 78% (22min flight)
Mission: COMPLETE`;

const FPGA_ASCII = `FPGA Resource Monitor
${'═'.repeat(40)}
Device:     /dev/xilinx_fpga0
Model:      XC7K325T-FFG900
BRAM:       4450 KB (2340 KB used)
DSP Slices: 840 (412 used)
FF:         203800 (89400 used)
LUT:        101900 (51200 used)
Clock:      100 MHz (PLL locked)

Status: PROGRAMMED
Bitstream: kalman_filter_v2.3.bit

    ╔═══════════════════════════╗
    ║  ▓▓▓▓  FPGA  ▓▓▓▓        ║
    ║  ┌───┬───┬───┬───┐        ║
    ║  │   │   │   │   │        ║
    ║  ├───┼───┼───┼───┤        ║
    ║  │ ■ │ ■ │ ■ │ ■ │  I/O  ║
    ║  ├───┼───┼───┼───┤        ║
    ║  │   │   │   │   │        ║
    ║  └───┴───┴───┴───┘        ║
    ║   [■] [■] [■] [■]         ║
    ╚═══════════════════════════╝`;

const FPGA_BOOT = `FPGA Boot Sequence
${'═'.repeat(40)}
[  0%] Power-on self-test....... PASS
[ 10%] Loading bitstream........ kalman_filter_v2.3.bit
[ 30%] Configuring fabric....... DONE
[ 40%] Programming BRAM......... 2340 KB
[ 50%] Initializing DSP slices.. 412/840
[ 60%] Setting up clocking...... 100 MHz
[ 70%] Configuring I/O pins......
[ 80%] Running diagnostic....... PASS
[ 90%] FPGA ready............... ONLINE
[100%] System operational

FPGA: BOOT COMPLETE`;

const FPGA_ROUTE = `FPGA Route Analysis
${'═'.repeat(40)}
Analyzing signal paths...

Signal: kalman_input → matmul → state_update → output

Path latency: 23.4 ns (4 cycles @ 170 MHz)
Route analysis:
  ▸ LUT: 847 (utilization: 0.8%)
  ▸ FF:  1204 (utilization: 0.6%)
  ▸ BRAM: 2 (utilization: 0.04%)
  ▸ DSP:  6 (utilization: 0.7%)

Critical path: state_update (12.1 ns)
Fmax: 170 MHz (synthesized)

Route status: OPTIMAL`;

const ML_ASCII = `Neural Network Architecture
${'═'.repeat(40)}
        Input (128)
           │
    ┌──────┴──────┐
    ▼             ▼
   Dense        Dense
   (64)         (64)
    │             │
    └──────┬──────┘
           ▼
    ┌──────┴──────┐
    ▼             ▼
   Dense        Dropout
   (32)         (0.2)
    │
    ▼
   Output (10)

Total params: 16,450
Optimizer: Adam
Loss: CrossEntropy`;

const ML_TRAIN = `Training Progress
${'═'.repeat(40)}
Epoch 1/50  ████░░░░░░░░░░░░  8%
Loss: 2.341  Acc: 0.112  Val: 0.098

Epoch 10/50 ████████████░░░░░ 20%
Loss: 1.892  Acc: 0.341  Val: 0.312

Epoch 25/50 ██████████████████ 50%
Loss: 0.923  Acc: 0.689  Val: 0.654

Epoch 40/50 ████████████████████ 80%
Loss: 0.445  Acc: 0.876  Val: 0.841

Epoch 50/50 ████████████████████ 100%
Loss: 0.312  Acc: 0.923  Val: 0.898

Training complete. Model saved.`;

const ML_INFER = `Inference Engine
${'═'.repeat(40)}
Model: classifier_v2.3.onnx
Input: [128 features]
Output: 10 classes

Running inference...
Input shape: (1, 128)
Output shape: (1, 10)

Predictions:
  Class 0: 0.02%
  Class 1: 0.08%
  Class 2: 0.15%
  Class 3: 1.42%
  Class 4: 3.21%
  Class 5: 8.94%
  Class 6: 12.33%
  Class 7: 23.41%
  Class 8: 31.82%
  Class 9: 18.62%

Top prediction: Class 8 (31.82%)
Latency: 0.42 ms

Inference complete.`;

const droneCommand: CommandDefinition = {
  aliases: ['drone', 'drones'],
  description: 'Show drone ASCII art',
  category: 'ascii',
  execute: () => ({ output: DRONE_FRAMES[0], action: 'none' }),
};

const droneFlyCommand: CommandDefinition = {
  aliases: ['drone fly', 'drone run', 'fly drone', 'launch drone', 'drone launch'],
  description: 'Drone flight animation',
  category: 'ascii',
  execute: () => ({ output: `${DRONE_FRAMES[0]}\n\nFlying...\n${DRONE_PATROL}`, action: 'none' }),
};

const dronePatrolCommand: CommandDefinition = {
  aliases: ['drone patrol', 'patrol'],
  description: 'Drone patrol simulation',
  category: 'ascii',
  execute: () => ({ output: DRONE_PATROL, action: 'none' }),
};

const droneScanCommand: CommandDefinition = {
  aliases: ['drone scan', 'scan', 'survey'],
  description: 'Drone area scan',
  category: 'ascii',
  execute: () => ({ output: `RUNNING AREA SCAN...
${'═'.repeat(40)}
COVERAGE: 847m²
ANOMALIES: 3 detected
OBJECTS: 12 classified

Scan complete.`, action: 'none' }),
};

const droneLandCommand: CommandDefinition = {
  aliases: ['drone land', 'land'],
  description: 'Drone landing sequence',
  category: 'ascii',
  execute: () => ({ output: DRONE_LAND, action: 'none' }),
};

const fpgaCommand: CommandDefinition = {
  aliases: ['fpga'],
  description: 'Show FPGA resource monitor',
  category: 'ascii',
  execute: () => ({ output: FPGA_ASCII, action: 'none' }),
};

const fpgaBootCommand: CommandDefinition = {
  aliases: ['fpga boot', 'boot fpga'],
  description: 'FPGA boot sequence',
  category: 'ascii',
  execute: () => ({ output: FPGA_BOOT, action: 'none' }),
};

const fpgaRouteCommand: CommandDefinition = {
  aliases: ['fpga route', 'route'],
  description: 'FPGA route analysis',
  category: 'ascii',
  execute: () => ({ output: FPGA_ROUTE, action: 'none' }),
};

const fpgaSynthCommand: CommandDefinition = {
  aliases: ['fpga synth', 'synth'],
  description: 'FPGA synthesis report',
  category: 'ascii',
  execute: () => ({ output: `FPGA Synthesis Report\n${'═'.repeat(40)}\nDevice: XC7K325T\nStrategy: Performance\nStatus: SUCCESS\n\nUtilization:\n  Slice LUTs:  67% (68,273/101,900)\n  Slice FFs:   45% (91,710/203,800)\n  BRAM:        52% (106/206)\n  DSP:         38% (319/840)\n  IO:          23% (74/320)\n\nTiming:\n  WNS: 0.112 ns\n  WHS: 0.089 ns\n  Fmax: 170.2 MHz\n\nSynthesis complete.`, action: 'none' }),
};

const mlCommand: CommandDefinition = {
  aliases: ['ml', 'ai', 'nn'],
  description: 'Show neural network diagram',
  category: 'ascii',
  execute: () => ({ output: ML_ASCII, action: 'none' }),
};

const mlTrainCommand: CommandDefinition = {
  aliases: ['ml train', 'train'],
  description: 'ML training progress',
  category: 'ascii',
  execute: () => ({ output: ML_TRAIN, action: 'none' }),
};

const mlInferCommand: CommandDefinition = {
  aliases: ['ml infer', 'infer', 'predict'],
  description: 'ML inference',
  category: 'ascii',
  execute: () => ({ output: ML_INFER, action: 'none' }),
};

const mlGraphCommand: CommandDefinition = {
  aliases: ['ml graph', 'graph'],
  description: 'Show network architecture',
  category: 'ascii',
  execute: () => ({ output: ML_ASCII, action: 'none' }),
};

const fpgaBitstreamCommand: CommandDefinition = {
  aliases: ['fpga bitstream', 'bitstream'],
  description: 'Show FPGA bitstream information',
  category: 'ascii',
  execute: () => ({
    output: `FPGA Bitstream Analysis
${TERMINAL_DIVIDER}
File: kalman_filter_v2.3.bit
Size: 12.4 MB
Format: Xilinx .bit
Checksum: 0x8F4A2B9C

Bitstream Structure:
  [HEADER]     0x0000 - 0x00FF  (256 bytes)
  [CONFIG]     0x0100 - 0x04FF  (1 KB)
  [FABRIC]     0x0500 - 0xC7FF  (49 KB)
  [BRAM_INIT]  0xC800 - 0xDFFF  (6 KB)
  [TRAILER]    0xE000 - 0xE0FF  (256 bytes)

Status: VALID
Integrity: VERIFIED`,
    action: 'none',
  }),
};

const launchDronesCommand: CommandDefinition = {
  aliases: ['launch drones', 'drones launch', 'deploy drones'],
  description: 'Launch drone swarm',
  category: 'ascii',
  execute: () => ({
    output: `SWARM DEPLOYMENT INITIATED
${TERMINAL_DIVIDER}
[SYS] Initializing swarm protocol...
[SYS] Establishing mesh network...

Node Status:
  NODE-01 [■] ONLINE  - Alt: 50m  Battery: 92%
  NODE-02 [■] ONLINE  - Alt: 50m  Battery: 88%
  NODE-03 [■] ONLINE  - Alt: 50m  Battery: 95%
  NODE-04 [■] ONLINE  - Alt: 50m  Battery: 91%

Formation: DIAMOND
Pattern: PATROL_ALPHA
Coverage: 2.4 km²

Status: SWARM OPERATIONAL
All nodes responding.`,
    action: 'none',
  }),
};

export function registerAsciiCommands() {
  registerCommand(droneCommand);
  registerCommand(droneFlyCommand);
  registerCommand(dronePatrolCommand);
  registerCommand(droneScanCommand);
  registerCommand(droneLandCommand);
  registerCommand(fpgaCommand);
  registerCommand(fpgaBootCommand);
  registerCommand(fpgaRouteCommand);
  registerCommand(fpgaSynthCommand);
  registerCommand(mlCommand);
  registerCommand(mlTrainCommand);
  registerCommand(mlInferCommand);
  registerCommand(mlGraphCommand);
  registerCommand(fpgaBitstreamCommand);
  registerCommand(launchDronesCommand);
}
