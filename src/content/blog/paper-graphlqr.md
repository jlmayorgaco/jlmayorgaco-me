---
title: "Paper Notes: Graph-LQR for Multi-Agent Coordination"
description: "Summary and notes on 'Graph-LQR: Optimal distributed control with application to multi-robot systems'"
date: 2026-03-05
author: "Jorge Mayorga"
category: "Paper Notes"
tags: ["control-theory", "multi-agent", "graph-lqr", "optimal-control"]
featured: false
---

Paper: "Graph-LQR: Optimal Distributed Control with Application to Multi-Robot Systems"

## Core Contribution

Extends LQR theory to graph-structured systems. Key insight: the optimal distributed controller can be computed without centralized information if the graph topology is known.

## Key Results

1. **Structured Riccati equation** - For tree graphs, solution decouples into local subproblems
2. **Distributed computation** - Alternating direction method of multipliers (ADMM) for arbitrary graphs
3. **Bounds on performance loss** - Comparison to centralized LQR shows <10% degradation for well-connected graphs

## Practical Implications

For my AGV coordination work:
- Tree topologies (like spanning trees) enable exact distributed synthesis
- More general graphs need iterative methods
- Computation scales with graph diameter, not number of agents

## Questions

- How does this handle communication delays?
- Can it be extended to nonlinear dynamics?
- What about switching topologies?

## Next

Reading: "Consensus-Based Distributed Kalman Filter" for comparison
