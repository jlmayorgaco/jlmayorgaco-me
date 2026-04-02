---
title: "Comparing Consensus Algorithms: When to Use What"
description: "Empirical comparison of Average Consensus, Maximum Consensus, and Bias-Compensated algorithms in mesh networks - with convergence time analysis and practical implementation notes."
date: 2024-10-28T14:30:00Z
tags: ["multi-agent", "consensus", "distributed-control", "networks", "optimization"]
category: "lab-notes"
status: "completed"
---

## TL;DR

Benchmarked 3 consensus algorithms on 6-robot mesh network. Average Consensus fastest for homogeneous data (12 iterations), but fails with sensor biases. Bias-Compensated adds 40% overhead but handles real-world noise. Maximum Consensus surprisingly useful for leader election.

---

## Test Setup

### Hardware
- 6x ESP32-S3 nodes (240 MHz dual-core)
- NRF24L01+ radios (2.4 GHz, 2 Mbps)
- Custom PCB with IMU (MPU-9250) per node
- Mesh topology with 2-hop max diameter

### Network Characteristics
- Packet loss: 2-8% (measured)
- Latency: 3-15 ms (hop-dependent)
- Jitter: ±5 ms

### Algorithms Tested

1. **Average Consensus (Metropolis weights)**
2. **Maximum Consensus**
3. **Bias-Compensated Average Consensus (our method)**

---

## Algorithm Details

### 1. Average Consensus (Classic)

```python
def average_consensus_step(x, neighbors, weights):
    """
    x: local state
    neighbors: list of neighbor states
    weights: Metropolis-Hastings weights
    """
    x_new = x
    for j, w_ij in zip(neighbors, weights):
        x_new += w_ij * (j.state - x)
    return x_new

# Metropolis weight calculation
def metropolis_weight(i, j, degree_i, degree_j):
    return 1 / (1 + max(degree_i, degree_j))
```

**Properties:**
- Converges to true average: `lim x_i = mean(x_initial)`
- Convergence rate: ~O(1/λ₂) where λ₂ is graph Laplacian eigenvalue
- Works well with symmetric, doubly-stochastic weights

### 2. Maximum Consensus

```python
def max_consensus_step(x, neighbors):
    """Simple max operation"""
    return max(x, max(n.state for n in neighbors))
```

**Properties:**
- Converges in diameter(G) iterations (worst case)
- Useful for leader election, max temperature, etc.
- Not useful for averaging

### 3. Bias-Compensated Consensus (Our Contribution)

```python
class BiasCompensatedConsensus:
    def __init__(self, node_id):
        self.x = 0.0                    # State estimate
        self.b = 0.0                    # Bias estimate
        self.alpha = 0.1                # Consensus gain
        self.beta = 0.05                # Bias learning rate
        
    def step(self, measurement, neighbors):
        # Local sensing with unknown bias
        z = measurement + self.bias_true  # True bias unknown
        
        # Bias estimation via neighbor disagreement
        neighbor_avg = sum(n.x for n in neighbors) / len(neighbors)
        disagreement = z - neighbor_avg
        self.b += self.beta * disagreement
        
        # Compensated consensus update
        x_compensated = z - self.b
        self.x += self.alpha * sum(
            w * (n.x - self.x) 
            for n, w in zip(neighbors, weights)
        )
        
        return self.x
```

**Key Insight:** Uses neighbor disagreement to estimate and compensate local sensor bias.

---

## Experimental Results

### Convergence Time (100 trials, mean ± std)

| Algorithm | 6 Nodes | 12 Nodes | 24 Nodes | Notes |
|-----------|---------|----------|----------|-------|
| Average | 12 ± 2 | 28 ± 5 | 67 ± 12 | Fastest, bias-sensitive |
| Max | 4 ± 0 | 6 ± 1 | 8 ± 1 | Deterministic, topology-bound |
| Bias-Comp | 17 ± 3 | 42 ± 8 | 98 ± 18 | Robust, slower convergence |

**Metric:** Iterations to reach ε=0.01 consensus error

### Robustness to Sensor Bias

Injected 0.5 rad/s bias to 2 random nodes:

| Algorithm | Final Error | Behavior |
|-----------|-------------|----------|
| Average | 0.17 ± 0.08 | Consensus offset from true average |
| Max | N/A | Not applicable (max value, not average) |
| Bias-Comp | 0.02 ± 0.01 | Converges to true average |

### Packet Loss Resilience

| Loss Rate | Average | Bias-Comp | Notes |
|-----------|---------|-----------|-------|
| 0% | 12 iters | 17 iters | Baseline |
| 5% | 14 iters | 21 iters | Minor degradation |
| 10% | 19 iters | 31 iters | Significant slowdown |
| 20% | 35+ iters | 58+ iters | Often fails to converge |

---

## Practical Implementation Notes

### 1. Weight Selection Matters

Metropolis weights vs. Uniform weights on 12-node line graph:

```
Metropolis:  28 iterations to converge
Uniform:     67 iterations to converge
Optimal:     22 iterations (requires global knowledge)
```

Use Metropolis for unknown/dynamic topologies. Use optimal if topology is fixed.

### 2. Stop Condition Detection

```python
def check_convergence(states, epsilon=0.01):
    """Distributed stop detection"""
    local_max = max(abs(states[i] - states[j]) 
                   for j in neighbors)
    
    # Run max consensus on max error
    global_max = max_consensus(local_max)
    
    return global_max < epsilon
```

### 3. Quantization Effects

Fixed-point (16-bit) vs Float32 convergence:

| Precision | Final Error | Notes |
|-----------|-------------|-------|
| Float32 | 1e-6 | Reference |
| Fixed Q12 | 0.002 | Acceptable for most apps |
| Fixed Q8 | 0.08 | Visible quantization |

**Rule of thumb:** Use Q12 for embedded, Float32 for simulation.

---

## When to Use What

### Use Average Consensus when:
- Sensor biases are calibrated/known
- Network is reliable (< 5% loss)
- Fastest convergence is priority
- Homogeneous sensor types

### Use Maximum Consensus when:
- You need leader election
- Finding max temperature/load
- Topology diameter is small
- Deterministic convergence needed

### Use Bias-Compensated when:
- Sensors have unknown biases
- Heterogeneous sensor network
- Calibration is difficult/expensive
- Can tolerate slower convergence

---

## Real-World Application: Formation Control

Tested on 6-robot line formation:

```python
# Each robot runs:
x_desired = consensus(leader_x + offset_i)
y_desired = consensus(leader_y)
heading = consensus(leader_heading)

# Then local tracking controller
cmd_vel = pid(x_desired - x_actual, y_desired - y_actual)
```

**Results with Bias-Compensated:**
- Formation error: 3.2 ± 1.1 cm
- Convergence time: 4.2 seconds
- Robust to 2 robots with IMU drift

**Results with Average Consensus:**
- Formation error: 8.7 ± 3.4 cm (due to uncalibrated IMUs)
- Convergence time: 2.8 seconds

---

## Code & Data

Full benchmark suite: [github.com/jlmayorgaco/consensus-benchmark](https://github.com/jlmayorgaco/consensus-benchmark)

Includes:
- ESP32 firmware (Arduino/PlatformIO)
- Python visualization tools
- Network simulators (no hardware needed)
- Raw data from 500+ trials

---

## Open Questions

1. **Asynchronous consensus:** How do randomized update schedules affect convergence?
2. **Directed graphs:** Current results assume bidirectional links
3. **Time-varying topologies:** Mobile robots change network structure

---

*Status: COMPLETE | Last Updated: 2024-10-28*
