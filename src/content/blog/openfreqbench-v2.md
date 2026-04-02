---
title: "OpenFreqBench v2.0 - Multi-Scenario Framework"
description: "Major update to the frequency benchmarking framework with support for realistic grid scenarios and automated report generation."
date: 2026-03-30
author: "Jorge Mayorga"
category: "Projects"
tags: ["openfreqbench", "benchmarking", "power-systems", "estimation"]
featured: false
---

Released v2.0 of OpenFreqBench with major improvements:

## What's New

**Multi-Scenario Engine**
- Configurable disturbance scenarios (frequency steps, ramps, oscillations)
- Realistic PMU data replay
- Stress testing under edge conditions

**Automated Reporting**
- PDF report generation with matplotlib figures
- Comparative analysis across estimators
- Statistical significance testing

**Estimator API v2**
- Standardized parameter interface
- Streaming support for continuous data
- Memory profiling tools

## Preliminary Results

Testing against 6 estimators (DFT, PLL-SOGI, EKF, UKF, RA-EKF, Neural) across 1000 synthetic scenarios:

| Estimator | Avg Error | Max Error | Latency |
|----------|-----------|-----------|---------|
| DFT | 0.015 Hz | 0.089 Hz | 12 μs |
| EKF | 0.008 Hz | 0.042 Hz | 89 μs |
| RA-EKF | 0.006 Hz | 0.031 Hz | 156 μs |

EKF variants showing best robustness to noise. Neural network approach promising but needs more training data.

## Next Steps

- Hardware-in-the-loop validation with real inverter data
- Koopman operator methods comparison
- Web interface for scenario configuration

Code: github.com/jlmayorga/openfreqbench
