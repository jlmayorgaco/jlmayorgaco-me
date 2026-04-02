---
title: "Motor Controller - PID Tuning Adventures"
description: "Notes from tuning the FPGA PID controller. Why manual tuning beats Ziegler-Nichols for this application."
date: 2026-03-15
author: "Jorge Mayorga"
category: "Robotics"
tags: ["motor-control", "pid", "fpga", "control-systems"]
featured: false
---

Spent the week tuning the PID controller. Some observations:

## The Problem

The motor kept overshooting and oscillating at high speeds. Initial Ziegler-Nichols tuning gave aggressive gains that worked in simulation but oscillated wildly on hardware.

## What Worked

Manual tuning with these rules:
1. Start with low Kp, increase until oscillation
2. Add small Ki only if steady-state error exists
3. Increase Kd until overshoot is acceptable

Final gains: Kp=1.2, Ki=0.15, Kd=0.08

## Measured Performance

| Metric | Value |
|--------|-------|
| Rise time (0→90%) | 8.2 ms |
| Overshoot | 4.3% |
| Settling time (1%) | 12.4 ms |
| Steady-state error | < 0.1% |

## Why Ziegler-Nichols Failed

The method assumes plant is approximately second-order with no time delay. Our motor+driver has ~2ms computational delay from FPGA, which Z-N doesn't account for well.

## Code Snippet

```verilog
// Position controller
always @(posedge clk) begin
    error <= setpoint - position;
    integral <= integral + error * Ki;
    derivative <= error - prev_error;
    output <= Kp * error + integral + Kd * derivative;
    prev_error <= error;
end
```

Using fixed-point Q16.16 format for Ki, Kd to maintain precision.

## Next

- Add anti-windup for integral term
- Implement gain scheduling for different speed ranges
