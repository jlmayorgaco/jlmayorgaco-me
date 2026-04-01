---
title: "Real-time Motor Controller"
summary: "FPGA-based motor controller with closed-loop PID control for robotic applications"
year: 2025
status: "published"
tags: ["FPGA", "Verilog", "Robotics", "Control Systems"]
stack: ["Verilog", "Vivado", "PWM", "Encoder"]
featured: true
order: 1
links:
  repo: "https://github.com/jlmayorga/motor-controller"
  demo: "https://jlmayorga.co/projects/motor-controller"
roadmap:
  completion: 65
  current_phase: "Prototype"
  phases:
    - label: "Idea"
      status: "completed"
      date: "2024-01"
    - label: "Research"
      status: "completed"
      date: "2024-03"
    - label: "Prototype"
      status: "completed"
      date: "2024-06"
    - label: "Validation"
      status: "active"
      date: "2025-01"
    - label: "Future"
      status: "planned"
      date: "2025-06"
  what_works:
    - "Closed-loop PID control at 20kHz"
    - "Encoder feedback with quadrature decoding"
    - "PWM generation up to 100kHz"
    - "10μs response time"
  limitations:
    - "DC motors only, no BLDC support"
    - "No thermal protection"
    - "Single motor only"
  next_steps:
    - "Add BLDC / FOC support"
    - "Implement CAN bus interface"
    - "Multi-axis coordination"
---

## Overview

This project implements a real-time motor controller on a Xilinx Artix-7 FPGA. The controller features closed-loop PID control with hardware-accelerated calculations for minimal latency.

## Problem

Robotic systems require precise motor control with response times under 100μs. Software-based controllers introduce unpredictable latency due to OS scheduling.

## Approach

- Implemented PID control algorithm in pure Verilog
- Used fixed-point arithmetic for deterministic timing
- Added encoder feedback with quadrature decoding
- Configurable PWM generation at up to 100kHz

## Results

- **Response time**: < 10μs latency
- **Position accuracy**: ±2 encoder counts
- **Max speed**: 10,000 RPM

## Technical Details

The controller uses a 16-bit fixed-point representation with 8-bit fractional precision. The PID gains are stored in BRAM and can be updated at runtime via SPI.

```verilog
// PID update cycle (every 10μs)
always @(posedge clk) begin
    if (enable) begin
        error <= setpoint - position;
        integral <= integral + error * Ki;
        derivative <= error - prev_error;
        output <= Kp * error + integral + Kd * derivative;
        prev_error <= error;
    end
end
```

## Future Work

- Add field-oriented control for BLDC motors
- Implement CAN bus interface for distributed control
- Integrate with ROS2 via FPGA-accelerated nodes