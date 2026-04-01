---
title: "Distributed AGV Coordination"
summary: "Decentralized coordination of Autonomous Guided Vehicles using local communication"
year: 2024
status: "wip"
tags: ["Multi-Agent Systems", "Distributed Control", "Graph Theory", "Coordination"]
stack: ["Python", "ROS2", "Graph Theory", "Control Theory"]
featured: false
order: 4
links:
  repo: "https://github.com/jlmayorga/agv-coordination"
roadmap:
  completion: 40
  current_phase: "Research"
  phases:
    - label: "Idea"
      status: "completed"
      date: "2023-06"
    - label: "Research"
      status: "active"
      date: "2023-09"
    - label: "Prototype"
      status: "pending"
      date: "2024-06"
    - label: "Validation"
      status: "pending"
      date: "2025-01"
    - label: "Future"
      status: "planned"
      date: "2025-06"
  what_works:
    - "Consensus-based formation control"
    - "Conflict detection algorithms"
    - "Dynamic topology handling"
    - "Simulation framework in Python"
  limitations:
    - "Limited to 2D planar motion"
    - "No physical hardware validation"
    - "Simplified communication model"
  next_steps:
    - "Hardware-in-the-loop testing"
    - "ROS2 integration for real robots"
    - "Fault tolerance mechanisms"
---

## Problem

Centralized AGV control does not scale:
- Single point of failure
- Computational bottleneck
- Communication overhead
- Not robust to network partitions

## Approach

- **Local communication**: Agents only exchange information with neighbors
- **Emergent coordination**: Global behavior arises from local rules
- **Graph-based control**: Topology-aware control algorithms
- **Consensus protocols**: Agreement on path planning and conflict resolution

## Focus Areas

- Distributed control theory
- Cooperative multi-agent systems
- Scalability analysis
- Robustness to failures

## Technical Details

- Consensus-based formation control
- Conflict detection and resolution
- Dynamic graph topology handling
- Latency-tolerant protocols

## Research Questions

- How does local information affect global performance?
- What is the minimum communication required for coordination?
- How to handle agent failures gracefully?
