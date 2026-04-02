---
title: "Thoughts on Real-Time Systems Debugging"
description: "Why real-time bugs are different and techniques for finding them."
date: 2026-02-28
author: "Jorge Mayorga"
category: "Engineering"
tags: ["debugging", "real-time", "fpga", "embedded-systems"]
featured: false
---

Real-time systems bugs are different from regular software bugs. Here's what I've learned:

## The Problem

In real-time systems, timing matters as much as correctness. A correct result arriving late is often worse than wrong on time.

## Techniques That Work

### 1. Timing instrumentation

```verilog
// Timestamp every critical event
always @(posedge clk) begin
    if (start_signal) begin
        start_time <= timestamp_counter;
    end
    if (done_signal) begin
        end_time <= timestamp_counter;
        latency <= end_time - start_time;
    end
end
```

### 2. Assertions everywhere

```verilog
// Check bounds
assert property (@(posedge clk) 
    (valid && data_in >= MIN && data_in <= MAX));
```

### 3. Shadow registers

Use two registers for "before" and "after" comparison.

### 4. Signal taps

Route critical signals to dedicated output pins for external logic analyzer.

## What Doesn't Work

- Printf debugging (too slow)
- Simulation alone (doesn't catch timing issues)
- Assuming hardware works (it usually doesn't)

## War Story

Found a bug that only appeared every ~1000 cycles. Turned out to be a subtle BRAM read-after-write hazard. Logic simulation passed. FPGA showed the glitch. Scope confirmed: ILA saved the day.

## Tools

- Vivado Logic Analyzer (ILA)
- SignalTap (Intel)
- Oscilloscope for hardware timing
- ModelSim for unit testing
