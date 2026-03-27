---
title: "Sensor Fusion Framework"
description: "Multi-sensor fusion framework combining IMU, GPS, and vision for robust robot localization."
year: 2021
category: "Robotics"
tags: ["Sensor Fusion", "Kalman Filter", "Localization", "ROS"]
featured: false
status: "published"
order: 5
---

# Sensor Fusion Framework

A modular sensor fusion framework for robot localization combining multiple sensor modalities.

## Overview

EKF-based sensor fusion framework supporting various sensor combinations for robust outdoor/indoor localization.

## Technical Details

- **Sensors**: IMU, GPS, LiDAR, Vision
- **Filter**: Extended Kalman Filter with error state
- **Platform**: ROS2, C++
- **Accuracy**: < 10cm outdoor, < 5cm with LiDAR

## Features

- Modular sensor plugins
- Automatic sensor calibration
- Fault detection and isolation
- Real-time performance
