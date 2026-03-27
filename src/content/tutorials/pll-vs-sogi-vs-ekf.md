---
title: "PLL vs SOGI vs EKF: A Comparative Analysis"
description: "Understanding the differences between Phase-Locked Loops, Second-Order Generalized Integrators, and Extended Kalman Filters for frequency estimation."
level: "advanced"
duration: "45 min"
date: 2024-02-01
tags: ["pll", "sogi", "ekf", "frequency-estimation", "power-systems", "signal-processing"]
category: "Power Systems"
draft: false
featured: true
---

# PLL vs SOGI vs EKF: Frequency Estimation Comparison

## Overview

In modern power systems with high penetration of inverter-based resources (IBRs), accurate and fast frequency estimation is critical. This tutorial compares three popular estimation techniques.

## 1. Phase-Locked Loop (PLL)

### Basic Principle
The PLL synchronizes an internal oscillator to track the phase of the input signal.

### Advantages
- Simple implementation
- Well-understood behavior
- Low computational cost

### Disadvantages
- Performance degrades under harmonics
- Limited dynamic response
- Sensitive to frequency variations

### Implementation
```python
class PLL:
    def __init__(self, Kp, Ki):
        self.Kp = Kp
        self.Ki = Ki
        self.theta = 0
        self.error_integral = 0
    
    def update(self, v_alpha, v_beta, dt):
        # Park transformation
        v_d = v_alpha * np.cos(self.theta) + v_beta * np.sin(self.theta)
        v_q = -v_alpha * np.sin(self.theta) + v_beta * np.cos(self.theta)
        
        # PI controller
        self.error_integral += v_q * dt
        omega = self.Kp * v_q + self.Ki * self.error_integral
        
        # Update phase
        self.theta += omega * dt
        
        return omega, self.theta
```

## 2. Second-Order Generalized Integrator (SOGI)

### Basic Principle
The SOGI creates a quadrature signal pair with filtering properties.

### Advantages
- Excellent harmonic rejection
- Fast transient response
- Simple structure

### Disadvantages
- Requires pre-filtering for high harmonics
- Sensitive to DC offset

### Implementation
```python
class SOGI:
    def __init__(self, k, w):
        self.k = k
        self.w = w
        self.v_q = 0
        self.v_alpha_filt = 0
        self.v_beta_filt = 0
    
    def update(self, v_alpha, v_beta, dt):
        # Error signals
        e_alpha = v_alpha - self.v_alpha_filt
        e_beta = v_beta - self.v_beta_filt
        
        # Update quadrature signals
        self.v_q += self.w * dt * (e_alpha - self.k * self.v_q)
        
        self.v_alpha_filt += self.w * dt * (e_alpha - self.v_q)
        self.v_beta_filt += self.w * dt * (e_beta - self.v_q)
        
        return self.v_q, self.v_alpha_filt, self.v_beta_filt
```

## 3. Extended Kalman Filter (EKF)

### Basic Principle
The EKF is a nonlinear observer that estimates both state and frequency.

### Advantages
- Optimal in stochastic sense
- Handles nonlinearities
- Provides confidence intervals

### Disadvantages
- Complex tuning
- Higher computational cost
- Requires system model

## Performance Comparison

| Metric | PLL | SOGI | EKF |
|--------|-----|------|-----|
| Response Time | Slow | Medium | Fast |
| Harmonic Immunity | Poor | Excellent | Good |
| Computational Load | Low | Low | High |
| Tuning Complexity | Easy | Medium | Hard |

## When to Use Each

- **PLL**: Basic applications, low harmonic content
- **SOGI**: Grid-tied inverters, high harmonic environments
- **EKF**: Research applications, complex dynamics
