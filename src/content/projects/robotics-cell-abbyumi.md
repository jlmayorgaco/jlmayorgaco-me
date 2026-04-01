---
title: "Robotics Cell — ABB YuMi"
summary: "Collaborative robotics cell for electronic assembly tasks using dual-arm ABB YuMi robot"
year: 2024
status: "published"
tags: ["Robotics", "Simulation", "Collaborative Robotics", "Safety"]
stack: ["CoppeliaSim", "ROS", "Robotics Simulation", "Motion Planning"]
featured: false
order: 3
links:
  demo: "https://jlmayorga.co/projects/abb-yumi"
roadmap:
  completion: 75
  current_phase: "Validation"
  phases:
    - label: "Idea"
      status: "completed"
      date: "2023-01"
    - label: "Research"
      status: "completed"
      date: "2023-04"
    - label: "Prototype"
      status: "completed"
      date: "2023-09"
    - label: "Validation"
      status: "active"
      date: "2024-03"
    - label: "Future"
      status: "planned"
      date: "2024-12"
  what_works:
    - "Dual-arm coordination control"
    - "Workspace zoning with proximity sensors"
    - "ISO 10218-1/2 compliant safety"
    - "Pick-and-place assembly pipeline"
  limitations:
    - "Simulation only, no physical robot"
    - "Simplified force feedback model"
    - "Limited to electronic assembly"
  next_steps:
    - "Physical robot deployment"
    - "Real force feedback integration"
    - "Multi-task extension"
---

## Problem

Safe human-robot collaboration in shared workspaces requires:
- Precise workspace zoning
- Collision avoidance
- Task coordination between dual arms

## Approach

- **Workspace zoning**: Virtual safety boundaries using proximity sensors
- **Safety standards compliance**: ISO 10218-1/2 and ISO 15066 for collaborative robots
- **Task coordination**: Synchronized dual-arm manipulation
- **Assembly pipeline**: Pick-and-place with precision alignment

## System Architecture

- Dual-arm coordination controller
- Human interaction model (detection, prediction, response)
- Assembly pipeline with quality inspection
- Real-time safety monitoring

## Technical Details

- Trajectory planning with jerk-limited motion
- Force feedback for compliant insertion
- Vision-based part localization
- Task state machine for sequential operations

## Results

- Successful electronic assembly demonstration
- Collision-free operation in shared workspace
- Cycle time: 45 seconds per unit

## Tools

- CoppeliaSim for physics simulation
- ROS for inter-process communication
- Custom controllers for arm coordination
