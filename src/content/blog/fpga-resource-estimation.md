---
title: "FPGA Resource Estimation: Don't Trust the Synthesis Report"
description: "Why post-synthesis resource estimates can be off by 40%+ and how to get accurate predictions using hierarchical budgeting and pragma directives."
date: 2024-09-12T09:15:00Z
tags: ["fpga", "synthesis", "resource-estimation", "vivado", "timing"]
category: "lab-notes"
status: "completed"
---

## TL;DR

Synthesis reports underestimated BRAM usage by 43% on our Kalman filter design. Root cause: inference of pipeline registers and optimization boundaries. Solution: hierarchical resource budgets + explicit pragma directives. Now accurate within 5%.

---

## The Surprise

Project: 12-state Kalman filter for motor control (100 kHz update rate)

**Initial Synthesis Report:**
```
LUT:    4,247  (8.1%)
FF:     6,112  (5.8%)
BRAM:   8.5    (6.0%)
DSP:    24     (10.0%)
```

Looks great! Plenty of headroom on our Zynq-7020.

**Post-Implementation:**
```
LUT:    5,891  (11.2%)  ✓
FF:     8,234  (7.8%)   ✓
BRAM:   16.5   (11.7%)  ✗ FAIL - needed 18, only 16 available!
DSP:    24     (10.0%)  ✓
```

BRAM nearly **doubled** during implementation. Project delayed 2 weeks.

---

## Why Estimates Are Wrong

### 1. Register Inference

Synthesis tool doesn't know about pipeline stages you'll add:

```vhdl
-- Your code
signal data : std_logic_vector(31 downto 0);
begin
    data <= a * b + c;  -- Single expression
end;

-- What synthesis sees initially
-- (combinatorial path)

-- What you actually need
process(clk)
begin
    if rising_edge(clk) then
        mult_reg <= a * b;      -- DSP + FF
        add_reg <= mult_reg + c; -- DSP/FF
        data <= add_reg;         -- FF
    end if;
end process;
```

Each pipeline stage adds FFs not visible in initial RTL.

### 2. BRAM Inference Changes

```vhdl
-- Simple array
type ram_type is array(0 to 1023) of std_logic_vector(31 downto 0);
signal ram : ram_type;
```

**Synthesis:** "Oh, that's 1 BRAM (36Kb)"

**Implementation reality:**
- True dual-port? → 2 BRAMs
- Different clocks? → 2 BRAMs
- Byte writes? → More BRAMs
- Parity bits needed? → Different configuration

### 3. Optimization Boundaries

Hierarchical design with `KEEP_HIERARCHY`:

```tcl
# Constraint file
set_property KEEP_HIERARCHY true [get_cells kalman_core]
```

Prevents cross-boundary optimization. Resource usage increases 15-25% but timing becomes predictable.

---

## Hierarchical Resource Budgeting

### Top-Down Allocation

```
Total Available (Zynq-7020):
  LUT:  53,200
  FF:   106,400
  BRAM: 280
  DSP:  220

Budget:
  ├─ Kalman Core (60%)
  │   ├─ Predict (30%)
  │   │   ├─ State Update: LUT=4k, FF=6k, DSP=12
  │   │   └─ Covariance Predict: LUT=6k, FF=8k, DSP=8, BRAM=6
  │   └─ Update (30%)
  │       ├─ Kalman Gain: LUT=5k, FF=4k, DSP=16, BRAM=4
  │       └─ State Correct: LUT=3k, FF=3k, DSP=4
  ├─ Interface (20%)
  │   └─ AXI Stream: LUT=3k, FF=4k
  └─ Margin (20%) ← CRITICAL
      └─ For routing, debug, late changes
```

### The 20% Margin Rule

Always reserve 20% for:
- **Routing congestion** (LUTs used as routing)
- **Clock domain crossing** (extra FFs)
- **Debug logic** (ILA cores, 10-15% each)
- **Late feature additions** (inevitable)

---

## Pragma Directives for Accuracy

### 1. Resource Pragmas (Vivado HLS/SystemVerilog)

```systemverilog
// Force specific implementation
(* use_dsp48 = "yes" *) 
mult_32x32 u_mult (.A(a), .B(b), .P(product));

// Force BRAM usage
(* ram_style = "block" *)
reg [31:0] data_buffer [0:1023];

// Force distributed RAM (LUTRAM)
(* ram_style = "distributed" *)
reg [7:0] small_lut [0:63];
```

### 2. Pipeline Pragmas

```systemverilog
// Explicit pipeline stages
(* latency = 3 *)
function automatic [31:0] cordic_atan;
    // ... 3-stage CORDIC implementation
endfunction
```

### 3. Inline Control

```systemverilog
// Prevent function inlining (preserve hierarchy)
(* inline = "off" *)
function automatic matrix_mult;
    // Complex multiplication function
endfunction
```

---

## Estimation Methodology

### Phase 1: Module-Level Estimation

For each module, create estimation script:

```python
# resource_estimator.py
kalman_predict = {
    'matrix_mult_12x12': {
        'dsp': 12 * 12,  # One DSP per element
        'lut': 12 * 12 * 4,  # Address generation
        'ff': 12 * 12 * 32,  # Pipeline registers
        'bram': 2  # Coefficient storage
    },
    'state_update': {
        'dsp': 12,
        'lut': 200,
        'ff': 400
    }
}

def estimate_total(modules, margin=1.2):
    """Apply 20% margin to account for synthesis overhead"""
    total = {'lut': 0, 'ff': 0, 'bram': 0, 'dsp': 0}
    for mod in modules:
        for res in total:
            total[res] += mod.get(res, 0) * margin
    return total
```

### Phase 2: Synthesis Checkpoints

```tcl
# Vivado Tcl - check after each major module
synth_design -top kalman_predict -part xc7z020clg400-1
report_utilization -file predict_util.rpt

# Compare against budget
set lut_used [get_property LUT [get_runs synth_1]]
set lut_budget 8000

if {$lut_used > $lut_budget} {
    puts "WARNING: Predict over budget: $lut_used / $lut_budget"
}
```

### Phase 3: Incremental Implementation

```tcl
# Place and route critical modules first
place_design -directive Explore
route_design -directive AggressiveExplore

report_timing_summary -file timing.rpt
report_utilization -file post_route_util.rpt
```

---

## Case Study: Kalman Filter (Corrected)

### Original Underestimate

| Resource | Synthesis | Implementation | Error |
|----------|-----------|----------------|-------|
| LUT | 4,247 | 5,891 | +38% |
| FF | 6,112 | 8,234 | +35% |
| BRAM | 8.5 | 16.5 | +94% |
| DSP | 24 | 24 | 0% |

### With Budgeting + Pragmas

```systemverilog
// Explicit BRAM allocation
(* ram_style = "block" *)
reg [31:0] P_matrix [0:143];  // 12x12 covariance, 144*32b = 5760b = 2 BRAMs

(* ram_style = "block" *)
reg [31:0] Q_matrix [0:143];  // Process noise, 2 BRAMs

(* ram_style = "block" *)
reg [31:0] R_matrix [0:35];   // Measurement noise, 6x6, 1 BRAM

// Force DSP usage for multiplies
(* use_dsp48 = "yes" *)
matrix_mult_12x6 u_gain_calc (...);
```

### Revised Estimates

| Resource | Estimated | Actual | Error |
|----------|-----------|--------|-------|
| LUT | 6,100 | 5,891 | +3.5% |
| FF | 8,500 | 8,234 | +3.2% |
| BRAM | 17 | 16.5 | +3.0% |
| DSP | 24 | 24 | 0% |

---

## Quick Reference: Estimation Multipliers

Apply these to your manual estimates:

| Component | Synthesis→Impl | Notes |
|-----------|----------------|-------|
| Pure logic (LUTs) | ×1.15 | Routing overhead |
| Registers (FF) | ×1.20 | Clock gating, pipeline |
| BRAM (inferred) | ×1.50 | Dual-port, byte-write |
| BRAM (explicit) | ×1.10 | With pragma |
| DSP | ×1.00 | Usually accurate |
| Muxes | ×1.30 | Wide muxes expand |

---

## Tools Comparison

| Tool | Accuracy | Speed | Best For |
|------|----------|-------|----------|
| Manual calc | ~70% | Instant | Architecture planning |
| Vivado Synth | ~85% | Minutes | Quick checks |
| Vivado Impl | 100% | Hours | Final validation |
| RapidWright | ~90% | Seconds | Custom analysis |

---

## Script: Automated Estimation

```python
#!/usr/bin/env python3
"""Vivado resource estimator from RTL analysis"""

import re
from pathlib import Path

def estimate_vhdl(filepath):
    """Parse VHDL and estimate resources"""
    content = Path(filepath).read_text()
    
    # Count multiplies (DSP candidates)
    multiplies = len(re.findall(r'\*', content))
    
    # Count array declarations (BRAM candidates)
    arrays = re.findall(r'type\s+\w+\s+is\s+array', content)
    
    # Count process blocks (FF candidates)
    processes = len(re.findall(r'process', content))
    
    # Estimate with margins
    estimate = {
        'dsp': multiplies,
        'bram': len(arrays) * 1.5,  # Conservative
        'ff': processes * 50,  # Rough
        'lut': processes * 30
    }
    
    return estimate

# Usage
est = estimate_vhdl('kalman_filter.vhd')
print(f"Estimated: {est}")
```

---

*Status: COMPLETE | Last Updated: 2024-09-12*
