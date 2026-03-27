---
title: "FPGA Kalman Estimation"
summary: "Hardware-native Kalman filter architectures for real-time state estimation"
year: 2024
status: "wip"
tags: ["FPGA", "Kalman Filter", "Hardware Architecture", "Signal Processing"]
stack: ["VHDL", "Signal Processing", "Embedded Systems", "Hardware Design"]
featured: false
order: 2
links:
  repo: "https://github.com/jlmayorga/fpga-kalman"
---

## Problem

Most FPGA implementations of Kalman filters are:
- Pseudo-CPU approaches (not truly parallel)
- Not optimized for hardware execution
- Not scalable to high-dimensional systems

## Approach

- **Parallel estimator cores**: Multiple Kalman filter instances running concurrently
- **Hardware-native architecture**: Pipelined data flow, no soft-core processor
- **Low-latency pipelines**: Minimize clock cycles per estimation update
- **Configurable dimensions**: Support for 1D to 20D state spaces

## Applications

- IMU sensor fusion (position, velocity, orientation)
- Power system state estimation (frequency, RoCoF)
- Robot localization (EKF-SLAM)

## Technical Details

- Cholesky decomposition in hardware
- Matrix inversion using Gauss-Jordan elimination
- Fixed-point with dynamic precision scaling
- Streaming interface for continuous data

## Challenges

- Numerical stability with limited precision
- Resource utilization vs latency trade-offs
- Scalability for higher-dimensional systems
