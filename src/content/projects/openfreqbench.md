---
title: "OpenFreqBench"
summary: "Open benchmarking framework for frequency and RoCoF estimators in modern low-inertia power systems"
year: 2025
status: "published"
tags: ["Research Platform", "Estimation", "Power Systems", "Benchmarking"]
stack: ["Python", "Signal Processing", "ML Estimators", "Numerical Simulation"]
featured: true
order: 1
links:
  repo: "https://github.com/jlmayorga/openfreqbench"
---

## Problem

Most estimator comparisons are:
- Not reproducible
- Too idealized
- Not stress-tested under realistic conditions

## System Architecture

- **Dual-rate simulation**: EMT + DSP simulation at different time scales
- **Modular estimator interface**: Standardized API for plugging in new estimators
- **Multi-scenario simulation engine**: Configurable disturbance scenarios
- **Statistical evaluation pipelines**: Automated metrics and reporting

## Approach

- Realistic disturbance injection (frequency steps, ramps, oscillations)
- Latency vs robustness evaluation framework
- Comprehensive metric collection (settling time, overshoot, steady-state error)

## Focus Areas

- Estimation theory
- Control systems
- Power systems
- Benchmarking methodology

## Technical Details

The framework supports multiple estimator types:
- IpDFT (Interpolated Discrete Fourier Transform)
- SRF-PLL (Synchronous Reference Frame PLL)
- SOGI-FLL (Second-Order Generalized Integrator FLL)
- EKF/UKF/RA-EKF (Extended/Unscented/Re алгоритми Kalman Filters)
- Koopman-based methods
- ML-based estimators

## Results

- Reproducible benchmark environment
- Stress-oriented evaluation methodology
- Identification of hidden failure modes in edge cases
