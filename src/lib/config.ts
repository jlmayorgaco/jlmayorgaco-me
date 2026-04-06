/**
 * Site Configuration
 * Centralized configuration for themes, layouts, and constants
 */

// Site metadata
export const SITE_TITLE = 'jlmayorga.co';
export const SITE_DESCRIPTION = 'Research Engineer | Robotics, Distributed Control & Full-Stack Systems';
export const SITE_URL = 'https://jlmayorga.co';

// Analytics - set your GA4 measurement ID here
export const GA_MEASUREMENT_ID = '';

// Primary Navigation (always visible)
export const NAV_ITEMS = [
  { href: '/projects', label: 'Projects' },
  { href: '/research', label: 'Research' },
  { href: '/datalab', label: 'Lab' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
] as const;

// Secondary Navigation (dropdown)
export const NAV_SECONDARY = [
  { href: '/now', label: 'Now' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/papers', label: 'Papers' },
  { href: '/media', label: 'Media' },
  { href: '/tutorials', label: 'Tutorials' },
  { href: '/contact', label: 'Contact' },
] as const;

// Social links
export const SOCIAL_LINKS = [
  { href: 'https://github.com/jlmayorga', label: 'GitHub', icon: 'github' },
  { href: 'https://linkedin.com/in/jlmayorga', label: 'LinkedIn', icon: 'linkedin' },
  { href: 'https://twitter.com/jlmayorga', label: 'Twitter', icon: 'twitter' },
] as const;

// Valid themes for the lab interface
export const VALID_THEMES = ['lab', 'dark', 'blueprint', 'copper', 'matrix'] as const;
export type Theme = (typeof VALID_THEMES)[number];

// Valid accent colors
export const VALID_ACCENTS = ['teal', 'mint', 'amber', 'white', 'copper', 'violet'] as const;
export type Accent = (typeof VALID_ACCENTS)[number];

// Valid layout modes
export const VALID_LAYOUTS = ['default', 'mosaic', 'grid', 'split', 'terminal'] as const;
export type Layout = (typeof VALID_LAYOUTS)[number];

// Accent color mappings
export const ACCENT_COLORS: Record<Accent, string> = {
  teal: '#3fb9a7',
  mint: '#50c878',
  amber: '#d29922',
  white: '#e8ebe9',
  copper: '#b8956a',
  violet: '#9d7cbf',
};

// Lab identity constants
export const LAB_IDENTITY = {
  initials: 'JLMT',
  label: 'LAB',
  role: 'Research Engineer',
  focus: 'Robotics · Distributed Control · FPGA',
  nodeStatus: 'ACTIVE',
  uptime: '99.9%',
} as const;

// Terminal configuration
export const TERMINAL_CONFIG = {
  bootDelay: 100,
  typewriterSpeed: 15,
  maxHistory: 100,
  promptSymbol: '$',
  dividerChar: '═',
  dividerLength: 40,
} as const;

// Animation timing constants
export const ANIMATION = {
  ledPulseInterval: 3000,
  signalFlowDuration: 8000,
  droneSpawnMin: 15000,
  droneSpawnMax: 30000,
  panelShuffleDuration: 400,
  focusHighlightDuration: 2000,
} as const;

// Robot arm configuration
export const ROBOT_CONFIG = {
  jointLimits: {
    j1: { min: -180, max: 180 },
    j2: { min: -90, max: 90 },
    j3: { min: -135, max: 135 },
  },
  positions: {
    home: { j1: 0, j2: 0, j3: 0 },
    park: { j1: 45, j2: -30, j3: -60 },
    pick: { j1: -30, j2: 45, j3: 90 },
    place: { j1: 30, j2: -20, j3: 45 },
  },
  adjustmentStep: 5,
} as const;

// Hover/LED physics constants
export const PHYSICS = {
  hover: {
    chargeRate: 0.003,
    decayRate: 0.0008,
    minCharge: 0.08,
  },
  led: {
    instabilityThreshold: 4000,
    maxInstabilityTime: 10000,
    flickerProbability: 0.012,
    minFlickerDuration: 50,
    maxFlickerDuration: 150,
  },
} as const;

// Circuit background configuration
export const CIRCUIT_CONFIG = {
  influenceRadius: 180,
  falloffCurve: 2.5,
  cursorGlowRadius: 120,
  cursorGlowOpacity: 0.015,
} as const;

// Mini-game configuration
export const GAMES = {
  coffee: {
    brewTime: 5000,
    temperatureTarget: 93,
    pressureTarget: 9,
  },
  guess: {
    maxAttempts: 6,
    words: ['FPGA', 'ROBOT', 'DRONE', 'KALMAN', 'CONTROL', 'CIRCUIT'],
  },
} as const;
