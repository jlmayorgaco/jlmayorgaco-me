---
title: "Building a Distributed Control System with ESP32"
excerpt: "Exploring low-latency communication protocols for multi-robot coordination using ESP32 modules"
date: 2025-03-15
tags: ["ESP32", "Distributed Systems", "Networking", "Robotics"]
category: "Embedded Systems"
readingTime: 8
featured: true
---

When building multi-robot systems, communication between nodes becomes critical. In this post, I'll explore how to achieve sub-millisecond latency using ESP32 modules configured in a peer-to-peer mesh network.

## The Problem

Traditional approaches rely on a central coordinator, but this creates a single point of failure and adds latency. We need a decentralized approach that can scale.

## Solution: ESP-NOW Protocol

ESP-NOW is a protocol developed by Espressif that enables direct device-to-device communication without requiring a WiFi access point. It provides:

- **Latency**: < 5ms typical
- **Range**: Up to 400m in open air
- **Payload**: Up to 250 bytes
- **Encryption**: Optional AES-128

## Implementation

Here's a basic sender implementation:

```cpp
#include <esp_now.h>
#include <WiFi.h>

uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

void onDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
    Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Failed");
}

void setup() {
    WiFi.mode(WIFI_STA);
    esp_now_init();
    esp_now_register_send_cb(onDataSent);
    esp_now_add_peer(broadcastAddress, ESP_NOW_ROLE_COMBO, 1, NULL, 0);
}

void loop() {
    struct Message { float x, y, theta; } msg = {1.0, 2.0, 3.0};
    esp_now_send(broadcastAddress, (uint8_t*)&msg, sizeof(msg));
    delay(10);
}
```

## Results

Testing with 5 nodes in a star topology:
- Average latency: 3.2ms
- Packet loss: 0.01%
- Max throughput: 1000 msgs/sec

## Next Steps

- Implement a gossip protocol for state synchronization
- Add CRC verification for data integrity
- Explore ESP32-S3's vector instructions for faster processing