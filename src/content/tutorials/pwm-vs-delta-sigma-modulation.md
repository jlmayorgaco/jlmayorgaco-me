---
title: "PWM vs Delta-Sigma Modulation for Power Electronics"
description: "Compare pulse-width modulation and delta-sigma modulation for digital power conversion and control applications."
level: "advanced"
duration: "60 min"
date: 2024-03-10
tags: ["pwm", "delta-sigma", "modulation", "power-electronics", "dsp", "signal-processing"]
category: "Power Electronics"
draft: false
featured: true
---

# PWM vs Delta-Sigma Modulation

## Overview

Both PWM and delta-sigma modulation convert digital signals to analog, but they differ fundamentally in approach and application.

## Pulse-Width Modulation (PWM)

### How It Works

PWM varies the duty cycle of a fixed-frequency square wave:

- **Frequency**: Fixed (e.g., 20 kHz)
- **Duty Cycle**: Varies 0-100%
- **Output**: Average voltage = duty cycle × VDD

### Advantages

- Simple implementation
- Predictable frequency (easier to filter)
- Widely supported in hardware
- Excellent for motor control

### Limitations

- Fixed switching frequency
- Limited resolution at high frequencies
- Harmonic content at fundamental and multiples

## Delta-Sigma Modulation

### How It Works

Delta-sigma uses feedback to shape quantization noise:

- **Frequency**: Variable (typically oversampled)
- **1-bit output**: Stream of 1s and 0s
- **Noise shaping**: Moves noise to high frequencies

### Advantages

- Very high effective resolution
- Excellent noise shaping
- Simplifies analog front-end
- Ideal for audio DACs and ADCs

### Limitations

- Requires oversampling
- Higher complexity
- Output requires low-pass filtering

## Comparison Table

| Aspect | PWM | Delta-Sigma |
|--------|-----|-------------|
| Resolution | Limited | Very High |
| Frequency | Fixed | Variable |
| Complexity | Low | High |
| Filtering | Easy | Requires steep LP |
| Latency | Low | Higher |
| THD | Moderate | Excellent |

## When to Use Each

**Use PWM for:**
- Motor control (BLDC, PMSM)
- LED dimming
- Simple DACs
- Power conversion

**Use Delta-Sigma for:**
- High-precision audio
- Sensors with high dynamic range
- Precision measurement
- Software-defined radio

## Implementation Example

### PWM in ESP32

```cpp
ledcWrite(channel, dutyCycle);  // 8-16 bit resolution
```

### Delta-Sigma in FPGA

```verilog
module delta_sigma (
    input clk,
    input [15:0] data_in,
    output reg dout
);
    reg [15:0] integrator = 0;
    reg [15:0] feedback = 0;
    
    always @(posedge clk) begin
        integrator <= integrator + data_in - feedback;
        dout <= integrator[15];
        feedback <= {16{dout}};
    end
endmodule
```

## Conclusion

Choose PWM for simplicity and real-time control. Choose delta-sigma for resolution and noise performance.
