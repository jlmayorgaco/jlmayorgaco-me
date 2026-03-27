# PROJECTS.md — JLMT LAB

## PRINCIPLE

Projects must represent **real engineering systems**, not demos.

Each project must show:

* problem
* system thinking
* architecture
* trade-offs
* technical depth

---

## 1. OpenFreqBench

Type: Research Platform
Status: Active

Description:
Open benchmarking framework for frequency and RoCoF estimators in modern low-inertia power systems.

Problem:
Most estimator comparisons are:

* not reproducible
* too idealized
* not stress-tested

Approach:

* dual-rate simulation (EMT + DSP)
* realistic disturbance scenarios
* latency vs robustness evaluation

System:

* modular estimator interface
* multi-scenario simulation engine
* statistical evaluation pipelines

Stack:

* Python
* signal processing
* ML estimators
* numerical simulation

Focus:

* estimation theory
* control systems
* power systems
* benchmarking

---

## 2. FPGA Kalman Estimation

Type: Research / Hardware
Status: Exploratory

Description:
Design of hardware-native Kalman filter architectures for real-time estimation.

Problem:
Most FPGA implementations are:

* pseudo-CPU
* not parallel
* not scalable

Approach:

* parallel estimator cores
* hardware-native architecture
* low-latency pipelines

Applications:

* IMU sensor fusion
* power system estimation

Stack:

* VHDL
* signal processing
* embedded systems

---

## 3. Robotics Cell — ABB YuMi

Type: Robotics / Simulation
Status: Academic / Applied

Description:
Collaborative robotics cell for electronic assembly tasks.

Problem:
Safe human-robot collaboration in shared spaces.

Approach:

* workspace zoning
* safety standards (ISO 10218 / ISO 15066)
* task coordination

System:

* dual-arm coordination
* human interaction model
* assembly pipeline

Tools:

* CoppeliaSim
* robotics simulation

---

## 4. Distributed AGV Coordination

Type: Multi-Agent Systems
Status: Concept / Research

Description:
Decentralized coordination of AGVs using only local information.

Problem:
Centralized control does not scale.

Approach:

* local communication
* emergent coordination
* graph-based control

Focus:

* distributed control
* cooperative systems
* scalability

---

## 5. r-biblio-synth

Type: Research Tool

Description:
Automates literature analysis and bibliometric synthesis.

Goal:

* reduce friction in research workflows
* enable structured knowledge extraction

Stack:

* R
* data analysis
* bibliometrics

---

## 6. DefensaTributaria

Type: Full-stack Product

Description:
Legal-tech platform for automated case intake, document processing, and scheduling.

System:

* quote wizard
* payment integration
* CRM sync
* file handling

Stack:

* Next.js
* Supabase
* Wompi
* Zoho

Focus:

* production-grade systems
* workflow automation

---

## 7. IoT Monitoring Systems

Type: Industrial / IoT

Description:
Real-time dashboards for monitoring industrial systems.

Features:

* real-time streaming
* alerts
* visualization
* large-scale data

Stack:

* Angular
* D3.js
* WebSockets
* Node.js

Impact:

* improved latency
* large-scale monitoring

---

## 8. CATTLE.IO

Type: IoT + ML

Description:
Sensor network for cattle monitoring with ML integration.

System:

* NodeMCU sensors
* Raspberry Pi
* ML inference

Stack:

* TensorFlow
* Django
* Angular

---

## RULES FOR CLAUDE

When generating project pages:

* emphasize system design
* explain trade-offs
* avoid marketing tone
* connect theory and implementation
