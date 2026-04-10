
You are working on a production codebase.

Your job is to execute exactly one ticket at a time, safely and with high engineering quality.

## Core rules
- Read the ticket carefully and follow it exactly.
- Do not work on multiple tickets in one run.
- Do not change unrelated files unless strictly necessary for the ticket.
- Prefer minimal, robust, maintainable changes.
- Follow SOLID, KISS, DRY, clean code, and existing project conventions.
- Refactor when needed, but keep scope controlled.
- Preserve behavior outside the ticket scope.
- Use BEM for CSS naming when touching UI components.
- Favor reusable components and isolated logic.
- Avoid hacks, magic numbers, duplicated code, and global side effects.
- Do not commit secrets, build artifacts, cache files, or unrelated formatting noise.

## Required execution flow
1. Read the ticket file.
2. Restate the objective in 3-7 bullets.
3. Inspect the relevant files only.
4. Propose a short implementation plan.
5. Implement the changes.
6. Run the required checks from the ticket.
7. Fix any errors found.
8. Summarize:
   - files changed
   - what was implemented
   - risks / follow-ups
9. If and only if all checks pass, create a git commit automatically.
10. Output the exact commit message used.

## Commit safety rules
Create a git commit only if:
- the ticket acceptance criteria are satisfied,
- the code builds or passes the relevant checks,
- there are no obvious runtime-breaking errors,
- the diff is scoped to the ticket.

Do NOT commit if:
- tests/checks fail,
- the implementation is incomplete,
- you had to skip validation,
- the diff includes unrelated changes,
- there is uncertainty about correctness.

If commit is blocked, explain clearly why and stop.

## Git commit format
Use Conventional Commits plus ticket id:

<type>(<scope>): <short summary> [<TICKET-ID>]

Examples:
- feat(nav): implement adaptive overflow menu [TOPNAV-009]
- refactor(nav): split top nav into reusable subcomponents [TOPNAV-001]
- fix(nav): align overflow trigger with primary tabs [TOPNAV-005]

## Commit body template
Ticket: <TICKET-ID>

What changed:
- ...
- ...
- ...

Validation:
- ...
- ...
- ...

Notes:
- ...
- ...

## Output format
At the end, always output:
- Ticket executed
- Files changed
- Validation run
- Commit created: yes/no
- Commit message

Phase 1 — Architecture and refactor foundation
TOPNAV-001 — Split TopNav.astro into reusable subcomponents

Goal: separate concerns and make the nav reusable.

Refactor into:

TopNav.astro
TopNavBrand.astro
TopNavPrimary.astro
TopNavOverflow.astro
TopNavStatus.astro
top-nav.css or top-nav.scss
top-nav.ts

Why:
Right now one file owns structure, styles, desktop nav, mobile nav, dropdown, and behavior. That is fine for v1, but not for a scalable portfolio system.

Acceptance criteria:

Main wrapper becomes orchestration only.
Each subcomponent has one responsibility.
No duplicated markup for nav item variants.
TOPNAV-002 — Define a stable component API

Goal: make the component configurable without editing internals.

Suggested props:

primaryItems
secondaryItems
brand
status
currentPath
sticky
showStatus
showBrand
maxVisibleItems only as fallback, not primary overflow strategy

Acceptance criteria:

Component can be reused on multiple layouts.
No hard dependency on imported config objects inside presentation layer.
TOPNAV-003 — Establish BEM naming and CSS ownership rules

Goal: clean CSS structure.

Suggested block:

.top-nav

Elements/modifiers:

.top-nav__bar
.top-nav__brand
.top-nav__nav
.top-nav__list
.top-nav__item
.top-nav__link
.top-nav__link--active
.top-nav__overflow
.top-nav__overflow-trigger
.top-nav__overflow-menu
.top-nav__status
.top-nav__mobile-toggle
.top-nav--sticky
.top-nav--menu-open
.top-nav--compact

Acceptance criteria:

Remove generic names like .nav-link, .dropdown-menu, .status-item.
No styling by document context.
All top-nav styles are locally understandable.
TOPNAV-004 — Extract design tokens for navigation geometry

Goal: eliminate magic numbers and achieve pixel consistency.

Tokens to define:

--top-nav-height
--top-nav-item-height
--top-nav-item-padding-x
--top-nav-gap
--top-nav-radius
--top-nav-border-width
--top-nav-dropdown-offset-y
--top-nav-hit-area-min
--top-nav-shadow
--top-nav-z-index

Why:
Your misalignment issue is almost certainly caused by several independent paddings, borders, and heights instead of one geometry model.

Phase 2 — Pixel-perfect layout and visual consistency
TOPNAV-005 — Normalize tab geometry for primary links and More

Goal: make every tab sit on the same baseline and use the exact same box model.

Current issue:
More visually feels like a different species of control.

Fix direction:

Primary items and overflow trigger must use the same height, border, radius, padding, and alignment.
Use one shared class for all “tab buttons”.
Arrow icon must align to text cap height, not float independently.

Acceptance criteria:

Every item aligns on a single visual baseline.
Same hover/active/focus metrics.
No 1 px jumps between neighboring items.
TOPNAV-006 — Redesign dropdown anchoring and spacing

Goal: make the dropdown feel intentionally connected.

Problems in screenshot:

It feels too detached vertically.
The left edge and top relationship feel arbitrary.
The panel is too blunt compared to the refined tab row.

Fix direction:

Anchor menu edge precisely to trigger edge.
Add a controlled vertical offset, likely 6px to 8px.
Remove the visual impression that it is “hanging”.
Consider a subtle caret/notch or shadow transition from trigger to menu.
Make width intentional: either match trigger minimum or align to an 8 px grid.

Acceptance criteria:

Trigger-to-menu relationship feels precise.
Open state looks designed, not default absolute positioning.
TOPNAV-007 — Improve nav density and information hierarchy

Goal: reduce visual noise.

Current issue:
You have dot, label, screw, border, gradient line, dropdown dots, arrow, LEDs, status frame. It is stylish, but close to over-decorated.

Fix direction:

Keep one leading indicator only.
Make “screw” optional only for very large desktop.
Reduce decorative redundancy.
Primary labels should carry hierarchy, not ornaments.

Acceptance criteria:

Cleaner scan path.
Same aesthetic, less clutter.
TOPNAV-008 — Rebalance header proportions

Goal: improve relationship between brand, nav, and status.

Current issue:
The brand panel is visually strong; nav row is dense; status is isolated. The header composition can feel slightly segmented instead of unified.

Fix direction:

Define fixed vertical rhythm.
Lock nav row center alignment.
Adjust brand width or status width depending on viewport.
Consider making status less prominent than primary nav.

Acceptance criteria:

Stronger overall composition.
Visual center stays on navigation, not on side widgets.
Phase 3 — UX behavior for larger navs

This is the most important part for your “larger navs” problem.

TOPNAV-009 — Implement a real overflow algorithm

Goal: move items into More automatically based on available width.

Do not:

Hardcode which items are primary forever.
Rely only on media queries.

Do:

Measure available nav width.
Keep highest-priority items visible.
Move lower-priority items into overflow when needed.
Recompute on resize.

Recommended data model:

type NavItem = {
  label: string;
  href: string;
  priority: number;
  group?: string;
  icon?: string;
  shortLabel?: string;
};

Acceptance criteria:

Header never breaks layout when labels grow.
Overflow is deterministic and priority-based.
More only appears when needed.
TOPNAV-010 — Support progressive label compression before overflow

Goal: avoid sending items to More too early.

Pattern:

Full labels
Short labels
Reduced paddings
Then overflow

Example:

Portfolio → Work
Research stays
Tutorials → Guides

Acceptance criteria:

Better use of horizontal space.
More elegant scaling before dropdown fallback.
TOPNAV-011 — Add nav grouping strategy

Goal: improve IA when there are many sections.

For bigger navs, do not treat everything as one flat list.

Recommended grouping:

Core: Projects, Research, Lab, Blog
Secondary: Portfolio, Papers, Media, Tutorials
Utility: About, Contact, Now

Another strong option:

Keep 4–5 primary items max.
Everything else lives in a structured mega-dropdown or “Explore” panel.

Acceptance criteria:

Clearer mental model.
Better content discoverability.
TOPNAV-012 — Consider replacing simple dropdown with panel navigation

Goal: solve overflow more elegantly for portfolio/lab sites.

For your style, a plain dropdown is functional, but a “navigation panel” would fit better:

title
grouped links
short descriptions
maybe icons
keyboard accessible
aligned to brand aesthetic

This is better than a raw list once the site grows.

Acceptance criteria:

Overflow area feels premium, not like a fallback.
Better discoverability for secondary sections.
Phase 4 — Accessibility, interaction, and quality
TOPNAV-013 — Make dropdown fully accessible

Goal: proper ARIA and keyboard support.

Must include:

aria-expanded
aria-controls
aria-haspopup="menu" or suitable semantic pattern
roving focus or simple focus loop
arrow key support if menu pattern is used
close on Escape
return focus to trigger on close

Acceptance criteria:

Keyboard-only user can operate the nav.
Focus states are visible and intentional.
TOPNAV-014 — Improve mobile nav into a real drawer/panel

Goal: stop treating mobile as “desktop links shown vertically”.

Current mobile logic is minimal.

Better approach:

open a panel or drawer
include brand summary
show primary + secondary clearly
lock body scroll
trap focus
animate without layout jank

Acceptance criteria:

Mobile feels designed, not degraded from desktop.
TOPNAV-015 — Replace inline script behavior with isolated component logic

Goal: improve maintainability and avoid brittle DOM querying.

Current issue:
document.querySelector is global and fragile if the component appears more than once.

Fix direction:

Scope behavior to component root.
Use one init function.
Support multiple instances safely.
Clean up listeners if needed.

Acceptance criteria:

No global collisions.
More predictable behavior.
TOPNAV-016 — Add visual regression and responsive QA checklist

Goal: protect pixel perfection over time.

Test breakpoints at minimum:

320
375
480
640
768
1024
1280
1440
1728

Scenarios:

long labels
active item in overflow
status hidden
brand hidden
12+ nav items
zoom 125% / 150%
keyboard navigation
RTL-ready sanity
reduced motion

Acceptance criteria:

No 1 px drift across breakpoints.
No clipped menu, overlap, or broken anchor.
Suggested priority order

If you want the most efficient implementation order:

TOPNAV-004 — tokens and geometry
TOPNAV-005 — normalize tab alignment
TOPNAV-001 — split component
TOPNAV-003 — BEM refactor
TOPNAV-009 — real overflow algorithm
TOPNAV-006 — better dropdown anchoring
TOPNAV-013 — accessibility
TOPNAV-014 — mobile drawer
TOPNAV-016 — QA and regression
TOPNAV-012 — upscale overflow into panel nav



