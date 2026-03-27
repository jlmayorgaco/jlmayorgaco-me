---
title: "ESP32 Wireless Mesh Network"
description: "Custom wireless mesh networking protocol for IoT sensor networks with sub-millisecond latency."
year: 2023
category: "Networking"
tags: ["ESP32", "Mesh Networks", "IoT", "Wireless"]
featured: false
status: "published"
order: 3
---

# ESP32 Wireless Mesh Network

A custom wireless mesh networking protocol built on ESP-NOW for low-latency IoT applications.

## Overview

Designed for applications requiring reliable, low-latency communication without the overhead of traditional IP-based networking.

## Technical Details

- **Protocol**: Custom layer 2 mesh on ESP-NOW
- **Nodes**: Up to 100+ in single mesh
- **Latency**: < 5ms typical, < 20ms worst case
- **Range**: Up to 400m per hop

## Features

- Automatic route discovery and recovery
- Geographic routing for mobile nodes
- Time-synchronized transmissions
- AES-128 encryption
