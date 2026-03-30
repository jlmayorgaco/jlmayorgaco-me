import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

const ROCOF_ASCII = `RoCoF Monitor (Rate of Change of Frequency)
${'═'.repeat(40)}
Grid Frequency:    60.002 Hz
RoCoF:            -12.4 mHz/s
Status:           STABLE

Low-inertia threshold: 50 mHz/s
Current margin: 37.6 mHz/s ✓

System: NOMINAL`;

const CONSENSUS_ASCII = `Distributed Consensus Protocol
${'═'.repeat(40)}
Agents: 6 connected
Topology: Ring
Consensus: ACHIEVED

Agent 1: x = 0.342 ✓
Agent 2: x = 0.341 ✓
Agent 3: x = 0.343 ✓
Agent 4: x = 0.342 ✓
Agent 5: x = 0.341 ✓
Agent 6: x = 0.342 ✓

Convergence: ε < 0.001
Iterations: 23
Protocol: GLA (Gossip-Localized-Average)`;

const GRAPH_LQR_ASCII = `Graph-LQR Controller Design
${'═'.repeat(40)}
System: Multi-Agent Formation
Graph: 6 nodes, 12 edges
Type: Balanced Tree

LQR Parameters:
  Q = diag(10, 10, 10)
  R = diag(1, 1, 1)

Distributed Solution:
  P₁ = [[2.34, 0.12], [0.12, 1.89]]
  P₂ = [[2.31, 0.15], [0.15, 1.92]]
  ...

Closed-loop eigenvalues:
  λ₁ = -2.14 ± 0.31j
  λ₂ = -1.89 ± 0.28j
  λ₃ = -2.01 ± 0.19j

Stability: ASYMPTOTIC ✓`;

const SWARM_ASCII = `Swarm Robotics Simulation
${'═'.repeat(40)}
Agents: 12 active
Formation: HEXAGONAL
Controller: Consensus-based

[■] Node 1 .... 0.0, 2.3
[■] Node 2 .... 1.9, 3.1
[■] Node 3 .... 4.1, 2.0
[■] Node 4 .... 3.2, 0.5
[■] Node 5 .... 1.1, 1.2
[■] Node 6 .... 2.8, 4.1
[■] Node 7 .... 0.5, 1.9
[■] Node 8 .... 3.5, 1.7
[■] Node 9 .... 1.7, 3.8
[■] Node 10 ... 4.2, 0.9
[■] Node 11 ... 2.1, 2.6
[■] Node 12 ... 0.9, 4.0

Formation error: 0.023m
Convergence: COMPLETE
Status: OPERATIONAL`;

const LOW_INERTIA_ASCII = `Low-Inertia Grid Analysis
${'═'.repeat(40)}
Scenario: 30% IBR penetration
Base frequency: 60.000 Hz
System inertia: H = 2.4 s

Frequency Response:
  Step 1: t=0s, ΔP = +5%
  Step 2: t=0.5s, Freq = 59.87 Hz
  Step 3: t=1.2s, RoCoF = -45 mHz/s
  Step 4: t=2.1s, Freq = 59.94 Hz (stabilizing)

Observations:
  ▸ RoCoF exceeds traditional thresholds
  ▸ Frequency nadir: 59.87 Hz
  ▸ Primary reserves: DEPLOYED
  ▸ Fast frequency response: ACTIVE

Grid status: STABLE (marginal)`;

const OPENFREQ_ASCII = `OpenFreqBench - Benchmark Results
${'═'.repeat(40)}
Test: Dynamic Frequency Estimation
Grid: IEEE 68-bus (low-inertia scenario)

Estimators tested:
  [1] DFT-4cycle     MAPE: 0.023%  LAT: 0.4ms
  [2] PLL-SOGI       MAPE: 0.041%  LAT: 0.2ms
  [3] EKF-8states    MAPE: 0.012%  LAT: 1.1ms
  [4] Neural-Net     MAPE: 0.008%  LAT: 2.3ms

Best: Neural-Net (accuracy)
Runner-up: EKF-8states (speed/accuracy)

Benchmark: COMPLETE
Report: /benchmarks/freq_est_2024.pdf`;

const rocofCommand: CommandDefinition = {
  aliases: ['rocof', 'roccof', 'frequency'],
  description: 'Show RoCoF monitor',
  category: 'research',
  execute: () => ({ output: ROCOF_ASCII, action: 'none' }),
};

const consensusCommand: CommandDefinition = {
  aliases: ['consensus', 'agreement'],
  description: 'Distributed consensus protocol',
  category: 'research',
  execute: () => ({ output: CONSENSUS_ASCII, action: 'none' }),
};

const graphLqrCommand: CommandDefinition = {
  aliases: ['graph lqr', 'glqr', 'graph-lqr'],
  description: 'Graph-LQR controller',
  category: 'research',
  execute: () => ({ output: GRAPH_LQR_ASCII, action: 'none' }),
};

const swarmCommand: CommandDefinition = {
  aliases: ['swarm', 'multi-agent', 'mas'],
  description: 'Swarm robotics simulation',
  category: 'research',
  execute: () => ({ output: SWARM_ASCII, action: 'none' }),
};

const lowInertiaCommand: CommandDefinition = {
  aliases: ['low-inertia', 'inertia', 'grid'],
  description: 'Low-inertia grid analysis',
  category: 'research',
  execute: () => ({ output: LOW_INERTIA_ASCII, action: 'none' }),
};

const openfreqbenchCommand: CommandDefinition = {
  aliases: ['openfreqbench', 'benchmark', 'bench', 'ofb'],
  description: 'OpenFreqBench results',
  category: 'research',
  execute: () => ({ output: OPENFREQ_ASCII, action: 'none' }),
};

const DISTRIBUTED_CONTROL_ASCII = `Distributed Control Systems
${TERMINAL_DIVIDER}
Architecture: Multi-Agent Network
Communication: Gossip Protocol
Consensus: AVERAGE

Network Topology:
  Node 1 ←→ Node 2 ←→ Node 3
    ↕         ↕         ↕
  Node 6 ←→ Node 5 ←→ Node 4

Control Law:
  uᵢ(t) = Σⱼ aᵢⱼ(xⱼ - xᵢ)

Convergence Rate: λ₂ = 0.34
Algebraic Connectivity: STABLE
Status: SYNCHRONIZED`;

const DISTRIBUTED_CONTROL_CMD: CommandDefinition = {
  aliases: ['distributed-control', 'dist-ctrl', 'ctrl-dist'],
  description: 'Distributed control systems info',
  category: 'research',
  execute: () => ({ output: DISTRIBUTED_CONTROL_ASCII, action: 'none' }),
};

export function registerResearchCommands() {
  registerCommand(rocofCommand);
  registerCommand(consensusCommand);
  registerCommand(graphLqrCommand);
  registerCommand(swarmCommand);
  registerCommand(lowInertiaCommand);
  registerCommand(openfreqbenchCommand);
  registerCommand(DISTRIBUTED_CONTROL_CMD);
}
