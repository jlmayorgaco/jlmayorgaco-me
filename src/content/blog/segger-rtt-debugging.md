---
title: "Printf Debugging at Scale: A Love Letter to SEGGER RTT"
description: "Why we abandoned UART debugging for 20+ embedded nodes and adopted SEGGER RTT - achieving 2MB/s transfer rates with zero CPU overhead and printf that actually works in interrupts."
date: 2024-07-20T11:00:00Z
tags: ["embedded", "debugging", "segger", "rtt", "logging", "printf"]
category: "lab-notes"
status: "completed"
---

## TL;DR

SEGGER RTT transformed our embedded debugging. 2MB/s throughput, works in interrupts, zero overhead when idle. Replaced 6 different debug methods across our fleet. Setup takes 10 minutes, saves hours daily.

---

## The Debugging Zoo

Our embedded projects accumulated debugging methods like layers of sediment:

| Project | Method | Problems |
|---------|--------|----------|
| Motor Controller | UART @ 115200 | Slow, conflicts with RS-485 bus |
| Sensor Node | SWO | 64KB/s max, requires trace pins |
| Gateway | Semihosting | 100x slowdown, crashes on disconnect |
| Power Monitor | LED blinking | Information density: zero |
| FPGA Bridge | JTAG UART | Vendor-specific, flaky |
| Test Fixture | GDB printf | Stops execution, alters timing |

Each tool had different setup, different limitations, different workflows. Context switching cost was real.

---

## Enter SEGGER RTT

**Real-Time Transfer** - uses debug interface (SWD/JTAG) for bidirectional communication.

### How It Works

```
┌──────────────────────────────────────────┐
│              Target (MCU)                │
│  ┌─────────┐      ┌─────────────────┐   │
│  │ Your    │      │   RTT Control   │   │
│  │ Code    │─────►│   Block (RAM)   │   │
│  │         │◄─────│   (Up/Down      │   │
│  └─────────┘      │    Buffers)     │   │
│                   └────────┬────────┘   │
└────────────────────────────┼────────────┘
                             │ SWD/JTAG
┌────────────────────────────┼────────────┐
│           Debugger         │            │
│  ┌─────────────────────────┴─────────┐  │
│  │      J-Link / DAPLink             │  │
│  │   (Reads/writes control block)    │  │
│  └─────────────────┬─────────────────┘  │
│                    │ USB                │
│  ┌─────────────────┴─────────────────┐  │
│  │      J-Link RTT Viewer / GDB      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Key insight:** Uses existing debug interface. No extra pins, no extra hardware.

---

## Implementation

### 1. Add RTT to Project

```bash
# SEGGER RTT is open source (BSD-3)
git clone https://github.com/SEGGERMicro/RTT.git

# Add to build
target_sources(app PRIVATE
    RTT/SEGGER_RTT.c
    RTT/SEGGER_RTT_printf.c
)
```

### 2. Minimal Code Changes

```c
#include "SEGGER_RTT.h"

int main(void) {
    // Initialize once
    SEGGER_RTT_Init();
    
    // Printf that works anywhere
    SEGGER_RTT_printf(0, "System boot\r\n");
    
    while (1) {
        // In your loop
        SEGGER_RTT_printf(0, "Motor speed: %d RPM\r\n", rpm);
        
        // Even in interrupts!
        // (with caveats - see below)
    }
}
```

### 3. ISR-Safe Logging

```c
void TIM2_IRQHandler(void) {
    // ⚠️ Don't use full printf in ISR
    // Use write buffer directly
    
    static char buf[64];
    int len = snprintf(buf, sizeof(buf), 
                       "IRQ: %lu\n", 
                       HAL_GetTick());
    
    SEGGER_RTT_Write(0, buf, len);
    // Non-blocking, interrupt-safe
}
```

---

## Performance Comparison

| Method | Speed | CPU Impact | Works in ISR | Setup Time |
|--------|-------|------------|--------------|------------|
| UART 115200 | 14 KB/s | Medium | No (blocking) | 30 min |
| UART 921600 | 115 KB/s | Medium | No | 30 min |
| SWO | 64 KB/s | Low | Yes | 1 hour |
| Semihosting | 10 KB/s | **Severe** | No | 10 min |
| **RTT** | **2 MB/s** | **Zero** | **Yes** | **10 min** |

**RTT bandwidth:** Determined by debug probe speed, not MCU.
- J-Link: Up to 3 MB/s
- ST-Link v3: ~1 MB/s
- DAPLink: ~500 KB/s

---

## Advanced Usage

### Multiple Channels

```c
// Channel 0: Debug logs
// Channel 1: Binary telemetry
// Channel 2: CLI interface

void telemetry_task(void) {
    uint8_t packet[32];
    while (1) {
        build_telemetry_packet(packet);
        SEGGER_RTT_Write(1, packet, sizeof(packet));
        osDelay(10);
    }
}
```

### Terminal Colors

```c
#define RTT_COLOR_RED     "\x1B[31m"
#define RTT_COLOR_GREEN   "\x1B[32m"
#define RTT_COLOR_YELLOW  "\x1B[33m"
#define RTT_COLOR_RESET   "\x1B[0m"

void log_error(const char* msg) {
    SEGGER_RTT_printf(0, RTT_COLOR_RED "[ERROR] %s" RTT_COLOR_RESET "\n", msg);
}

void log_info(const char* msg) {
    SEGGER_RTT_printf(0, RTT_COLOR_GREEN "[INFO] %s" RTT_COLOR_RESET "\n", msg);
}
```

### Host-Side Tools

```bash
# J-Link RTT Viewer (GUI)
JLinkRTTViewerExe -d cortex-m4 -if swd

# Command line
JLinkRTTClient -d cortex-m4

# Python scripting
import pylink
jlink = pylink.JLink()
jlink.connect()
rtt = jlink.rtt_start()
data = jlink.rtt_read(0, 1024)
```

### GDB Integration

```gdb
# In .gdbinit
set remotelogfile rtt.log
monitor exec SetRTTSearchRanges 0x20000000 0x10000
```

---

## Real-World Workflow

### Debugging Motor Controller

```c
// Motor control loop with detailed logging
void motor_control_isr(void) {
    static uint32_t last_log = 0;
    uint32_t now = DWT->CYCCNT;
    
    // Read sensors
    int32_t current = adc_read_current();
    int32_t position = encoder_read();
    
    // Control law
    int32_t error = target_position - position;
    int32_t output = pid_update(error);
    
    // High-rate debug (1kHz but throttled display)
    if (now - last_log > SystemCoreClock / 10) {  // 10 Hz log
        SEGGER_RTT_printf(0, 
            "t:%lu pos:%ld err:%ld out:%ld\n",
            now, position, error, output);
        last_log = now;
    }
    
    pwm_set(output);
}
```

**Result:** Debug output without affecting 20 kHz control loop.

### Multi-Node Fleet

```bash
#!/bin/bash
# monitor_fleet.sh - Monitor 6 robots

for i in {0..5}; do
    JLinkRTTClient -select usb=${i} > robot_${i}.log &
done

# Combined view with timestamps
tail -f robot_*.log | ts
```

---

## Gotchas & Solutions

### 1. Buffer Overflow

**Problem:** Logging faster than host can read.

**Solution:** Check buffer space before write:

```c
if (SEGGER_RTT_GetAvailWriteSpace(0) >= len) {
    SEGGER_RTT_Write(0, data, len);
} else {
    // Buffer full - skip or handle
    overflow_count++;
}
```

### 2. Control Block Not Found

**Problem:** Debugger can't locate RTT control block.

**Solution:** Explicit address or search range:

```bash
# Tell J-Link where to look
JLinkRTTViewer -a 0x20002000

# Or auto-search (slower)
JLinkRTTViewer -r
```

### 3. Thread Safety

**Problem:** Multiple tasks logging simultaneously.

**Solution:** RTT is thread-safe, but your format buffer might not be:

```c
// ⚠️ Race condition!
static char buf[256];  // Shared!
void task_a(void) { snprintf(buf, ...); RTT_Write(0, buf, ...); }
void task_b(void) { snprintf(buf, ...); RTT_Write(0, buf, ...); }

// ✓ Fix: Stack buffer or RTT locking
void task_a(void) {
    char buf[256];  // Stack - thread safe
    snprintf(buf, ...);
    SEGGER_RTT_LOCK();
    SEGGER_RTT_Write(0, buf, strlen(buf));
    SEGGER_RTT_UNLOCK();
}
```

---

## Cost Analysis

| Item | Cost | Notes |
|------|------|-------|
| J-Link EDU Mini | $20 | Academic/educational |
| J-Link BASE | $400 | Commercial use |
| RTT License | Free | BSD-3 open source |
| Setup Time | 10 min | Per project |
| Daily Time Saved | ~1 hour | vs UART/SWO |

**ROI:** 1 week to break even on BASE model.

---

## Alternatives Considered

| Tool | Why Not |
|------|---------|
| ITM/SWO | Limited bandwidth, requires trace pins |
| USB CDC | Extra hardware, driver issues |
| Bluetooth LE | Too slow, adds complexity |
| SD Card | Not real-time, retrieval hassle |
| Network (lwIP) | Heavy stack, not for small MCUs |

---

## Migration Guide

### From UART

1. Remove UART initialization code
2. Replace `HAL_UART_Transmit()` with `SEGGER_RTT_Write()`
3. Remove UART pin configuration
4. Done - 30 minute refactor

### From Semihosting

1. Remove semihosting flags (`--specs=rdimon.specs`)
2. Replace `printf()` with `SEGGER_RTT_printf()`
3. Enjoy 100x speedup

---

## Resources

- SEGGER RTT: [segger.com/products/debug-probes/j-link/technology/rtt](https://www.segger.com/products/debug-probes/j-link/technology/about-real-time-transfer/)
- GitHub: [github.com/SEGGERMicro/RTT](https://github.com/SEGGERMicro/RTT)
- Our wrapper: [github.com/jlmayorgaco/rtt-logger](https://github.com/jlmayorgaco/rtt-logger)

---

*Status: COMPLETE | Last Updated: 2024-07-20*
