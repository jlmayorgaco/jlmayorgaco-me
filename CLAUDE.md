# CLAUDE.md — JLMT LAB (Astro Portfolio)

## PROJECT OVERVIEW

This project is a **technical portfolio / research workstation UI** built with **Astro**.

It is NOT a generic website.

It represents a:

* Robotics lab
* Distributed control system
* Machine learning diagnostics station
* Embedded / FPGA / software engineering workspace

The UI must feel like a:

> **Technical research station / industrial dashboard / robotics lab interface**

NOT:

* SaaS dashboard
* startup landing page
* hacker terminal
* cyberpunk green UI
* generic blog template

---

## CORE DESIGN PRINCIPLES

### 1. This is a SYSTEM, not a page

Every UI element must feel like part of a system:

* panels = hardware modules
* cards = lab units
* sections = stations
* labels = instrumentation
* UI = control interface

---

### 2. Visual identity = JLMT LAB

Brand must be embedded into the system:

* identity panel (top-left)
* logo as system badge
* subtle watermark usage
* consistent naming (LAB, NODE, SYSTEM, etc.)

---

### 3. Design style

Target aesthetic:

* industrial / technical / robotics lab
* clean but rich
* structured
* modular
* layered
* physical-feeling panels

NOT:

* minimal UI
* flat design
* playful design
* cluttered “steampunk”
* neon hacker aesthetic

---

## TECH STACK

* Astro (primary framework)
* Static-first architecture
* Content Collections (NO database)
* CSS (custom, tokens-based)
* Minimal JS
* SVG preferred over heavy libraries
* Avoid unnecessary dependencies

---

## ARCHITECTURE RULES

### DO NOT:

* introduce random libraries
* rewrite structure without reason
* break routes
* change content system
* convert everything to React unnecessarily
* add client-side JS without clear need

### DO:

* use `.astro` components by default
* use islands only when needed
* keep SSR intact
* maintain performance
* keep components modular

---

## TOKEN OPTIMIZATION (CRITICAL)

You MUST minimize token usage.

### Rules:

* DO NOT rewrite entire files unless required
* DO NOT restate code unnecessarily
* DO NOT explain basic concepts
* DO NOT produce long generic explanations
* FOCUS on actionable changes

### Output style:

* concise
* structured
* surgical
* high-signal only

---

## WORKFLOW MODE

### ALWAYS work in this order:

1. **Audit**
2. **Plan**
3. **Implement**
4. **Summarize**

DO NOT jump directly to code without understanding context.

---

## TASK EXECUTION RULES

### 1. Work in SMALL TASKS ONLY

Never attempt large refactors.

Prefer:

* 3–4 focused changes per iteration

---

### 2. Preserve existing structure

Improve, do not rebuild.

---

### 3. Avoid visual regression

Do not break:

* layout
* spacing
* responsive
* typography

---

### 4. Respect design system

All changes must align with:

* tokens
* spacing scale
* typography hierarchy
* color system

---

## DESIGN SYSTEM RULES

### Color

Mobile and desktop MUST match.

DO NOT:

* introduce new color schemes
* switch to black/green hacker mode
* create alternate themes

---

### Panels

Panels must feel:

* physical
* layered
* slightly industrial
* structured

Use:

* subtle borders
* inset shadows
* panel headers
* technical labels

---

### Cards

Cards are NOT generic.

They must feel like:

* lab modules
* hardware units
* system nodes

---

### Typography

* technical labels → mono font
* content → sans-serif
* no broken glyphs
* no inconsistent sizes

---

## VISUAL LANGUAGE (MANDATORY)

The UI must include:

### Robotics

* robot arm / nodes / trajectories (visual hints)

### Control

* waveforms
* signals
* system labels

### ML

* graphs / clusters / diagnostics (subtle)

### Embedded

* PCB hints
* system labels
* I/O concepts

---

## MAIN DISPLAY RULE

The central display must be:

* the strongest visual element
* not just text
* not just terminal
* a real "system screen"

---

## MOBILE RULES

Mobile must:

* match desktop design system
* NOT use different colors
* NOT become black/green UI
* be a stacked version of desktop
* maintain identity

---

## MOTION RULES

Motion must be:

* subtle
* meaningful
* system-like

Allowed:

* LED blink
* signal pulse
* hover glow
* waveform animation

NOT allowed:

* excessive animation
* random motion
* heavy libraries without reason

---

## BLOG / RESEARCH RULES

Must feel like:

* lab notebook
* research log
* technical archive

NOT:

* generic blog

---

## WHEN FIXING UI

Always check:

* spacing
* alignment
* hierarchy
* consistency
* responsiveness
* visual balance

---

## WHEN ADDING VISUALS

Ask:

> Does this look like a real system component?

If not → remove or redesign.

---

## RESPONSE FORMAT

Always respond with:

### 1. Audit (short)

What is wrong

### 2. Plan (short)

What will be changed

### 3. Implementation (focused)

Code or changes

### 4. Summary (short)

What improved

---

## FINAL QUALITY BAR

The result must feel like:

> A premium technical lab interface designed by a senior engineer-designer.

If it looks like a template → it is wrong.

If it looks like a hacker UI → it is wrong.

If it looks like a clean but generic dashboard → still not enough.

---

## PRIORITY ORDER (VERY IMPORTANT)

Always prioritize:

1. MAIN DISPLAY
2. Visual consistency
3. Layout & spacing
4. Panel quality
5. Robotics/control identity
6. Mobile consistency
7. Micro-interactions

---

## LAST RULE

Do not aim for "pretty".

Aim for:

> **convincing, technical, structured, and intentional**
