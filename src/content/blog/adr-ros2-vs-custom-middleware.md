---
title: "Architecture Decision Records: Why We Chose ROS2 Over Custom Middleware"
description: "Documenting the trade-offs that led to adopting ROS2 for multi-robot coordination - including the 3 months we spent building a custom DDS before admitting it was a mistake."
date: 2024-08-05T16:00:00Z
tags: ["architecture", "ros2", "dds", "middleware", "multi-agent", "adr"]
category: "lab-notes"
status: "completed"
---

## TL;DR

Spent 3 months building custom DDS-based middleware. Hit walls with discovery, QoS, and tooling. Migrated to ROS2 in 2 weeks. Custom solution had better latency (800µs vs 1.2ms) but worse everything else. ROS2 was the right call.

---

## Context

Project: Coordination system for 6-20 mobile robots in warehouse automation
Requirements:
- Real-time path planning updates (10 Hz)
- Fault tolerance (handle 2 robot failures)
- Dynamic reconfiguration (add/remove robots)
- Low latency (< 5ms control loop)
- Deterministic timing

Team: 3 engineers, 6 months timeline

---

## Option A: Custom Middleware (The Seductive Choice)

### Rationale

"ROS is bloated. We only need pub/sub. We'll build exactly what we need."

### Implementation

```cpp
// Custom DDS-lite implementation
class LightweightDDS {
public:
    bool publish(const Topic& topic, const void* data, size_t len);
    bool subscribe(const Topic& topic, Callback cb);
    
private:
    UDPSocket transport_;      // UDP multicast
    Serializer serializer_;    // Custom binary protocol
    DiscoveryService discovery_;  // Custom peer finding
};
```

**Week 1-2:** Basic pub/sub working. Latency: 400µs. "This is amazing!"

**Week 3-4:** Discovery problems. Robots don't find each other on network partitions.

**Week 5-8:** QoS implementation. Reliable delivery, durability, history. Scope creep.

**Week 9-10:** Debugging tools. Need packet capture, latency histograms, topic introspection.

**Week 11-12:** Security. Authentication, encryption. TLS over UDP complexity.

### What We Built (3 months)

- UDP multicast transport
- Custom serialization (binary, schema-based)
- Basic discovery (mDNS-like)
- Simple QoS (reliable + best-effort)
- CLI debugging tools
- Python bindings

**Lines of code:** ~8,000 C++, ~2,000 Python
**Bugs found:** 47 (17 race conditions, 9 memory leaks)

### Problems Encountered

1. **Discovery doesn't scale**: Linear search O(n) fails at 15+ nodes
2. **QoS is hard**: Exactly-once semantics required distributed transaction logic
3. **No ecosystem**: Can't use rviz, rosbag, rqt_graph
4. **Documentation burden**: Every team member needs training on custom protocol
5. **Bus factor = 1**: Only one engineer fully understood the transport layer

---

## Option B: ROS2 (The Pragmatic Choice)

### Migration

```bash
# Install ROS2 Humble
sudo apt install ros-humble-desktop

# Create workspace
mkdir -p ~/swarm_ws/src
cd ~/swarm_ws/src

# Our nodes become ROS2 packages
git clone https://github.com/jlmayorgaco/swarm_coordination.git
cd ..

colcon build
source install/setup.bash
```

**Porting effort:** 2 weeks for 6 major components

### ROS2 Architecture

```
┌─────────────────────────────────────────┐
│          Application Layer              │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Planner │ │ Monitor │ │Controller│  │
│  └────┬────┘ └────┬────┘ └────┬─────┘  │
│       │           │           │         │
│  ┌────┴───────────┴───────────┴────┐    │
│  │         ROS2 Client Library      │    │
│  │     (rclcpp / rclpy)             │    │
│  └─────────────┬────────────────────┘    │
│                │                        │
│  ┌─────────────┴────────────────────┐    │
│  │         RMW Interface            │    │
│  │    (DDS abstraction layer)       │    │
│  └─────────────┬────────────────────┘    │
│                │                        │
│  ┌─────────────┴────────────────────┐    │
│  │        DDS Implementation        │    │
│  │   (CycloneDDS / FastDDS)         │    │
│  └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## Comparative Analysis

### Performance

| Metric | Custom DDS | ROS2 (FastDDS) | Notes |
|--------|-----------|----------------|-------|
| Latency (local) | 400 µs | 600 µs | ROS2 overhead |
| Latency (network) | 800 µs | 1,200 µs | Serialization |
| Throughput | 50 MB/s | 35 MB/s | ROS2 serialization |
| CPU (idle) | 2% | 4% | ROS2 background threads |
| Memory | 45 MB | 85 MB | ROS2 infrastructure |

**Verdict:** Custom wins on performance, but marginally.

### Development Velocity

| Task | Custom DDS | ROS2 | Winner |
|------|-----------|------|--------|
| New message type | 4 hours | 15 minutes | ROS2 |
| Add visualization | 3 days | 5 minutes | ROS2 |
| Record/replay data | 2 weeks | `ros2 bag` | ROS2 |
| Debug timing | Custom tools | `ros2 topic hz` | ROS2 |
| Simulation | Build custom | Gazebo integration | ROS2 |

**Verdict:** ROS2 dominates development speed.

### Operational Complexity

| Concern | Custom DDS | ROS2 |
|---------|-----------|------|
| Security patches | Own effort | Community |
| DDS upgrades | N/A | Seamless |
| Tooling | Custom | Industry standard |
| Hiring | Train everyone | Use existing skills |
| Documentation | Maintain yourself | Extensive |

---

## Key ROS2 Advantages

### 1. QoS Profiles

```cpp
// Reliable command delivery
rmw_qos_profile_t cmd_qos = rmw_qos_profile_services_default;
cmd_qos.reliability = RMW_QOS_POLICY_RELIABILITY_RELIABLE;
cmd_qos.durability = RMW_QOS_POLICY_DURABILITY_TRANSIENT_LOCAL;

// Best-effort sensor streaming
rmw_qos_profile_t sensor_qos = rmw_qos_profile_sensor_data;
sensor_qos.reliability = RMW_QOS_POLICY_RELIABILITY_BEST_EFFORT;
```

This took us 3 weeks to implement custom. ROS2 provides it out of the box.

### 2. Discovery Server

```bash
# Start discovery server (for large networks)
ros2 daemon start

# Or use static peers for deterministic startup
export ROS_STATIC_PEERS="192.168.1.10;192.168.1.11"
```

Solves our scaling problem without custom code.

### 3. Lifecycle Nodes

```cpp
class ControlledNode : public rclcpp_lifecycle::LifecycleNode {
public:
    LifecycleNodeCallbackReturn on_configure(const State& state) {
        // Allocate resources
        return LifecycleNodeCallbackReturn::SUCCESS;
    }
    
    LifecycleNodeCallbackReturn on_activate(const State& state) {
        // Start processing
        return LifecycleNodeCallbackReturn::SUCCESS;
    }
};
```

Standardized state machine for clean startup/shutdown.

---

## When Custom Middleware Makes Sense

Despite our experience, there ARE valid reasons:

1. **Extreme latency requirements** (< 100 µs) - ROS2 overhead too high
2. **Certification requirements** (DO-178C, ISO 26262) - ROS2 not certified
3. **Resource constraints** (< 16 MB RAM) - ROS2 too heavy
4. **Custom transport** (SpaceWire, CAN FD, TTEthernet) - ROS2 DDS doesn't support

For our project (Linux SBCs, Ethernet, non-safety-critical): **none applied**.

---

## Migration Results

### Timeline

- Custom DDS development: 3 months
- ROS2 migration: 2 weeks
- Feature parity achieved: 3 weeks total

### Team Feedback

> "I can actually understand the codebase now."
> — Robotics Engineer #2

> "Debugging went from nightmare to pleasant."
> — Robotics Engineer #1

> "Why didn't we start with ROS2?"
> — Everyone, eventually

### Performance in Production

- 18 robots in warehouse pilot
- 99.7% uptime (3 restarts in 2 months)
- Average latency: 1.4ms (well under 5ms requirement)
- Zero message loss with QoS

---

## Architecture Decision Record

```markdown
# ADR-004: Adopt ROS2 for Middleware

## Status
Accepted

## Context
Need pub/sub middleware for multi-robot coordination. Evaluated custom DDS vs ROS2.

## Decision
Adopt ROS2 Humble with FastDDS RMW.

## Consequences

Positive:
- Reduced development time (estimated 6 months → 2 weeks)
- Access to ecosystem (rviz, rosbag, Gazebo)
- Standardized patterns (lifecycle, QoS)
- Easier hiring/training

Negative:
- 50% higher latency than custom (acceptable for requirements)
- 2x memory usage (acceptable for hardware)
- Dependency on external project

## Alternatives Considered
- Custom DDS: Rejected due to development burden
- MQTT: Rejected (not real-time capable)
- ZeroMQ: Rejected (no discovery, no QoS)
```

---

## Lessons Learned

### 1. NIH Syndrome is Real

Not Invented Here bias cost us 3 months. Default to proven solutions.

### 2. Underestimate Custom Complexity

We estimated 2 weeks for custom middleware. Actual: 3 months and incomplete.

### 3. Ecosystem Value is Hard to Quantify

How do you value "can use rviz"? In practice: enormous.

### 4. Performance Isn't Everything

Custom DDS was faster but worse in every other dimension.

---

*Status: COMPLETE | Last Updated: 2024-08-05*
