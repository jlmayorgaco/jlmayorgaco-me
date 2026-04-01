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
roadmap:
  completion: 80
  current_phase: "Validation"
  phases:
    - label: "Idea"
      status: "completed"
      date: "2023-01"
    - label: "Research"
      status: "completed"
      date: "2023-06"
    - label: "Prototype"
      status: "completed"
      date: "2024-01"
    - label: "Validation"
      status: "active"
      date: "2024-06"
    - label: "Future"
      status: "planned"
      date: "2025-06"
  what_works:
    - "Dual-rate EMT + DSP simulation"
    - "Modular estimator API"
    - "Multi-scenario disturbance injection"
    - "Automated statistical evaluation"
  limitations:
    - "Limited to single-phase analysis"
    - "No real-time hardware input"
    - "ML estimators need more training data"
  next_steps:
    - "Three-phase system support"
    - "Real PMU data integration"
    - "Web interface for results visualization"
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
