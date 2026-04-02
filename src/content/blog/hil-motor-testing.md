---
title: "Hardware-in-the-Loop: Validating Motor Controllers Without Burning Hardware"
description: "A practical guide to HIL testing for power electronics - from MATLAB/Simulink models to real-time validation using Speedgoat and custom FPGA interfaces."
date: 2024-11-15T10:00:00Z
tags: ["hardware-in-the-loop", "motor-control", "fpga", "testing", "power-electronics"]
category: "lab-notes"
status: "completed"
---

## TL;DR

Successfully implemented HIL testing for 3-phase BLDC motor controllers. Reduced hardware damage incidents by 90% and caught 12 critical timing bugs before PCB fabrication. Key insight: model fidelity matters less than edge case coverage.

---

## The Problem

Burning MOSFETs is expensive. Burning MOSFETs **during firmware development** is both expensive and demoralizing. Our motor controller project hit a wall:

- 3 driver boards destroyed in 2 weeks
- Root causes: timing bugs, PWM dead-time errors, current limit oversights
- Each iteration cost $200+ and 5 days PCB turnaround

We needed a way to validate control algorithms **before** connecting real hardware.

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Controller    │◄───►│   HIL Simulator  │◄───►│  Plant Model    │
│   (Device Under │     │   (Speedgoat)    │     │  (Simulink)     │
│    Test)        │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │    PWM Signals         │   Analog/Digital I/O
        │    (1-20 kHz)          │   (Current, Position, Faults)
        ▼                        ▼
   ┌─────────┐            ┌──────────────┐
   │  FPGA   │            │  Interface   │
   │  I/O    │            │  Board       │
   └─────────┘            └──────────────┘
```

---

## Implementation

### Plant Model Fidelity Levels

Tested three levels of model complexity:

| Level | Components | Execution Time | Use Case |
|-------|-----------|----------------|----------|
| L0 | Ideal voltage source, no dynamics | 10 µs | Algorithm logic |
| L1 | RL load + back-EMF | 25 µs | Current loop tuning |
| L2 | Full electrical + mechanical + thermal | 100 µs | System validation |

**Finding:** L1 captured 95% of real-world bugs. L2 only found 2 additional issues in 6 months.

### Critical Timing Requirements

```matlab
% HIL Configuration - Speedgoat Target
hil_config = struct(...
    'sample_time', 10e-6, ...        % 100 kHz main loop
    'pwm_resolution', 1e-9, ...      % 1 ns (simulated)
    'adc_latency', 2.5e-6, ...       % Match real ADC
    'io_delay', 500e-9 ...           % FPGA propagation
);
```

### FPGA Interface Logic

Capturing PWM edges in real-time:

```vhdl
entity pwm_capture is
    port (
        clk : in std_logic;           -- 100 MHz
        pwm_in : in std_logic_vector(5 downto 0);
        duty_out : out std_logic_vector(11 downto 0);
        period_out : out std_logic_vector(11 downto 0);
        valid : out std_logic
    );
end entity;

architecture rtl of pwm_capture is
    signal counter : unsigned(11 downto 0);
    signal rise_time : unsigned(11 downto 0);
begin
    process(clk)
    begin
        if rising_edge(clk) then
            -- Edge detection and time stamping
            if pwm_in(0) = '1' and pwm_prev = '0' then
                rise_time <= counter;
                period_out <= std_logic_vector(counter);
            elsif pwm_in(0) = '0' and pwm_prev = '1' then
                duty_out <= std_logic_vector(counter - rise_time);
                valid <= '1';
            end if;
            counter <= counter + 1;
        end if;
    end process;
end architecture;
```

---

## Bugs Found via HIL

### Bug #1: Dead-Time Violation

**Symptom:** Intermittent shoot-through at high duty cycles

**Root Cause:** PWM update timing allowed dead-time to collapse during duty cycle transitions.

**Detection:** Current waveform showed 200ns overlap spikes in HIL simulation.

**Fix:** Double-buffered PWM updates synchronized to PWM period boundaries.

### Bug #2: Current Sampling Aliasing

**Symptom:** Noisy current readings at specific motor speeds

**Root Cause:** ADC triggered at PWM center, but switching noise wasn't fully settled.

**Detection:** HIL simulation with accurate switching noise model revealed the pattern.

**Fix:** Adjustable ADC trigger delay + oversampling.

### Bug #3: Velocity Loop Instability

**Symptom:** Oscillation at 2.3 Hz under load

**Root Cause:** Encoder velocity calculation had unfiltered quantization noise.

**Detection:** Mechanical model in HIL showed limit cycling.

**Fix:** Moving average filter + observer-based velocity estimation.

---

## Validation Metrics

| Metric | Before HIL | After HIL | Improvement |
|--------|-----------|-----------|-------------|
| Hardware damage events | 3/month | 0.3/month | 90% ↓ |
| Control bugs in production | 8/release | 1/release | 87% ↓ |
| Validation cycle time | 5 days | 4 hours | 96% ↓ |
| Test coverage | ~40% | 94% | 135% ↑ |

---

## Lessons Learned

### 1. Model Fidelity Trade-offs

Don't chase perfect models. Chase **representative** models:

- Electrical dynamics: High fidelity required
- Mechanical dynamics: Medium fidelity sufficient  
- Thermal dynamics: Low fidelity acceptable for control testing

### 2. Real-Time Constraints Matter

Your HIL must run **faster** than your controller:

```
HIL_sample_time ≤ Controller_sample_time / 10
```

This gives 10x oversampling for signal reconstruction.

### 3. Fault Injection is Essential

HIL's real value is in testing fault scenarios:

- Sensor disconnects
- Power supply transients
- Communication timeouts
- Temperature derating

These are expensive/dangerous to test on real hardware.

---

## Hardware Setup

**Target Platform:** Speedgoat Performance
**FPGA:** Xilinx Zynq-7020 (custom carrier)
**I/O:**
- 6x PWM input (1-20 kHz)
- 3x analog output (±10V, current feedback)
- 2x quadrature encoder simulation
- 8x digital I/O (faults, enables)

**Cost:** ~$15K setup vs. $3K in damaged hardware (first month alone)

---

## Code Repository

HIL test framework: [github.com/jlmayorgaco/hil-motor-test](https://github.com/jlmayorgaco/hil-motor-test)

Includes:
- Simulink plant models (L0-L2)
- VHDL FPGA interface
- Python test automation
- CI/CD integration examples

---

## Next Steps

- [ ] Add thermal modeling for long-duration tests
- [ ] Implement automated parameter sweeps
- [ ] Connect to hardware CI pipeline

---

*Status: COMPLETE | Last Updated: 2024-11-15*
