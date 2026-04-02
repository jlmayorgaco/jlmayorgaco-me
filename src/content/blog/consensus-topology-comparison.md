---
title: "Consensus Algorithms - Ring vs Complete Topology"
description: "Experimental comparison of consensus convergence in ring and complete graph topologies with 6-agent swarm."
date: 2026-03-20
author: "Jorge Mayorga"
category: "Research"
tags: ["consensus", "multi-agent", "graph-theory", "distributed-control"]
featured: false
---

Running experiments on consensus convergence with different topologies. Results from 100 trials each:

## Setup

- 6 agents (simulated)
- Random initial states: position ∈ [-10, 10]
- Communication: perfect (no packet loss)
- Metric: convergence time to ε = 0.01

## Results

### Ring Topology (each agent → 2 neighbors)
```
Convergence time: 3.42 ± 0.87 seconds
Final consensus error: 0.008 ± 0.002
```

### Complete Graph (each agent → all others)
```
Convergence time: 1.23 ± 0.34 seconds
Final consensus error: 0.007 ± 0.001
```

### Hybrid (ring + shortcuts)
```
Convergence time: 1.89 ± 0.45 seconds
Final consensus error: 0.007 ± 0.001
```

## Analysis

Complete graph converges ~3x faster but requires n² communication links. For n=6:
- Ring: 6 links
- Complete: 36 links

The hybrid approach gives good trade-off: 12 links, 1.5x slower than complete.

## Code

```python
def consensus_step(states, adjacency):
    # Laplacian-based update
    L = compute_laplacian(adjacency)
    return states - 0.1 * L @ states
```

Used NetworkX for topology generation, custom simulator for dynamics.

## Real-World Implications

- In practice, communication isn't perfect
- Packet loss matters more in complete graphs
- Ring topologies more robust to node failure
