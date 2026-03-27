---
title: "Safety in Collaborative Robotics"
excerpt: "Understanding ISO 10218 and ISO 15066 standards for human-robot collaboration in shared workspaces"
date: 2024-10-01
tags: ["Robotics", "Safety", "ISO Standards", "Collaborative Robotics"]
category: "Robotics"
readingTime: 10
featured: false
---

Collaborative robots (cobots) are designed to work alongside humans without safety fences. But ensuring safe operation requires careful system design.

## Key Standards

### ISO 10218-1/2
- Industrial robot safety requirements
- Part 1: Robots
- Part 2: Robot systems integration

### ISO 15066
- Collaborative robot safety
- Defines permissible contact forces
- Body region quasi-static limits
- Transient impact limits

## Collaborative Operation Modes

1. **Safety-rated monitored stop**
2. **Hand guiding**
3. **Speed and separation monitoring**
4. **Power and force limiting**

## Power and Force Limiting (PFL)

The most common approach:

- **Quasistatic compression**: < 140N for most body regions
- **Transient impact**: < 50J for high-mass robots
- Depends on: effective mass, velocity, contact area

## Implementation

- Force/torque sensors
- Collision detection
- Workspace monitoring
- Safe motion planning
