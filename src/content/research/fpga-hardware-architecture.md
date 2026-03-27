---
title: "Hardware-Native FPGA Architectures for Estimation"
excerpt: "Why traditional FPGA implementations of Kalman filters fall short, and how to design better ones"
date: 2024-12-01
tags: ["FPGA", "Kalman Filter", "Hardware Architecture", "Parallel Computing"]
category: "Hardware"
readingTime: 15
featured: false
---

Most FPGA implementations of estimation algorithms treat the FPGA as a soft CPU. This misses the fundamental advantage of hardware: parallelism.

## The Soft-CPU Problem

When you implement a Kalman filter on a soft-core processor (like MicroBlaze), you get:
- Sequential execution
- Limited parallelism
- Just like software, but slower

## Hardware-Native Approach

Instead, design with parallelism in mind:

### 1. Pipelined Data Flow

Process multiple samples simultaneously:

```
Stage 1: Input → Prediction
Stage 2: Prediction → Update
Stage 3: Update → Output
```

### 2. Parallel Measurement Updates

For systems with multiple sensors:

```
Sensor 1 ─┐
Sensor 2 ─┼──→ Kalman Gain ──→ State Update
Sensor 3 ─┘
```

### 3. Chordal Architecture

Exploit matrix sparsity to reduce computation:

- State transition matrix often sparse
- Measurement matrix often sparse
- Process independently, fuse results

## Results

- 10x latency reduction vs soft-CPU
- Deterministic timing (no OS)
- Scalable to higher dimensions
