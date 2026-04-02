---
title: "FPGA Kalman Filter - First Synthesis Results"
description: "Initial implementation of a pipelined Kalman filter on Xilinx Artix-7. Resource utilization and latency measurements."
date: 2026-03-25
author: "Jorge Mayorga"
category: "FPGA"
tags: ["fpga", "kalman-filter", "hardware", "signal-processing"]
featured: false
---

First successful synthesis of the FPGA Kalman Filter core. Here's what I learned:

## Architecture

The design uses a fully pipelined architecture with:
- **Input Buffer**: 256 samples deep
- **Predict Step**: Matrix multiplication pipeline
- **Update Step**: Cholesky decomposition for covariance
- **Output Buffer**: Streaming results

## Resource Utilization (xc7a35t)

| Resource | Used | Available | % |
|----------|------|-----------|---|
| LUT | 1,847 | 20,800 | 8.9% |
| FF | 2,156 | 41,600 | 5.2% |
| DSP | 24 | 90 | 26.7% |
| BRAM | 8 | 50 | 16.0% |

Surprisingly low utilization. The limiting factor was actually the matrix inversion, not the multiplications.

## Latency

- **Per-sample latency**: 14 clock cycles (140 ns @ 100MHz)
- **Throughput**: 7.1 MHz (full pipeline)
- **State dimension tested**: 4x4 (position, velocity, acceleration)

## Issues Found

1. Numerical overflow in covariance matrix update
2. Fixed-point precision trade-offs
3. BRAM timing closure at high frequencies

## Next Steps

- Test with 8x8 and 12x12 state dimensions
- Implement automatic precision scaling
- Compare against ARM NEON implementation

Working bitstream available on request.
