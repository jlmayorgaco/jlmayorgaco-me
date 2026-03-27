---
title: "ESP32 CAN Bus Communication Guide"
description: "Learn how to implement CAN bus communication on ESP32 for automotive and industrial embedded systems."
level: "intermediate"
duration: "45 min"
date: 2024-02-20
tags: ["esp32", "can-bus", "embedded", "microcontroller", "automotive", "protocol"]
category: "Embedded Systems"
draft: false
featured: false
---

# ESP32 CAN Bus Communication Guide

## Introduction

Controller Area Network (CAN bus) is a robust vehicle bus standard designed to allow microcontrollers and devices to communicate with each other without a host computer. The ESP32 with its integrated CAN controller makes it an excellent choice for automotive and industrial projects.

## Hardware Requirements

- ESP32 development board
- MCP2562 or SN65HVD230 CAN transceiver
- 120Ω terminating resistor (optional for short runs)
- Oscilloscope for debugging (recommended)

## CAN Bus Basics

CAN operates on a multi-master broadcast bus:
- **High Speed**: Up to 1 Mbps
- **Standard CAN**: 11-bit identifier
- **Extended CAN**: 29-bit identifier
- **Differential signaling**: Immune to noise

## Implementation

### Pin Configuration

```cpp
// CAN TX on GPIO 4, CAN RX on GPIO 5
#define CAN_TX_PIN 4
#define CAN_RX_PIN 5
```

### Basic Initialization

```cpp
#include <ESP32CAN.h>
#include <CAN_config.h>

CAN_device_t CAN_cfg = {
    .speed = CAN_SPEED_500KBPS,
    .tx_pin_id = GPIO_NUM_4,
    .rx_pin_id = GPIO_NUM_5,
    .queue_size_size = 10,
};

void setup() {
    Serial.begin(115200);
    CAN_init();
}
```

### Sending Messages

```cpp
void sendCANMessage(uint16_t id, uint8_t data[8]) {
    CAN_msg_t msg;
    msg.identifier = id;
    msg.flags.extended = 0;
    msg.flags.rtr = 0;
    msg.dlc = 8;
    memcpy(msg.data, data, 8);
    
    CAN_write(&msg);
}
```

## Troubleshooting

Common issues include:
- Missing termination resistors
- Ground loop problems
- Incorrect baud rate
- Transceiver voltage mismatch

## Conclusion

CAN bus on ESP32 opens up possibilities for automotive diagnostics, industrial networks, and robotics communication.
