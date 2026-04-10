/**
 * Site Configuration
 * Centralized configuration for site metadata, navigation,
 * social links, badges, themes, UI constants, and lab settings.
 */

// ============================================================
// SITE METADATA
// ============================================================

export const SITE_TITLE = 'jlmayorga.co';
export const SITE_DESCRIPTION =
  'Research Engineer | Robotics, Distributed Control & Full-Stack Systems';
export const SITE_URL = 'https://jlmayorga.co';

// Analytics
export const GA_MEASUREMENT_ID = '';

// ============================================================
// NAVIGATION
// ============================================================

export type NavItem = {
  href: string;
  label: string;
  isActive?: boolean;
};

// Primary navigation
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/about', label: 'Me' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/tutorials', label: 'Tutorials' },
  { href: '/datalab', label: 'Lab' },
  { href: '/blog', label: 'Blog' },
] as const;

// Secondary navigation
export const NAV_SECONDARY: readonly NavItem[] = [
  { href: '/now', label: 'Now' },
  { href: '/media', label: 'Media' },
  { href: '/projects', label: 'Projects' },
  { href: '/research', label: 'Research' },
  { href: '/papers', label: 'Papers' },
  { href: '/contact', label: 'Contact' },
] as const;

// ============================================================
// SOCIAL LINKS
// ============================================================

export type SocialBrand =
  | 'github'
  | 'linkedin'
  | 'scholar'
  | 'orcid'
  | 'ieee'
  | 'arxiv'
  | 'email'
  | 'cv';

export type SocialLink = {
  label: string;
  href: string;
  brand: SocialBrand;
  external?: boolean;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: 'Email',
    href: 'mailto:jl.mayorga.co+me@gmail.com',
    brand: 'email',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/jorge-luis-mayorga-taborda-a33a16102/',
    brand: 'linkedin',
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/jlmayorgaco',
    brand: 'github',
    external: true,
  },
  {
    label: 'Google Scholar',
    href: 'https://scholar.google.com/citations?user=C08gmDcAAAAJ&hl=es',
    brand: 'scholar',
    external: true,
  },
  {
    label: 'ORCID',
    href: 'https://orcid.org/0000-0002-0774-2176',
    brand: 'orcid',
    external: true,
  },
  // {
  //   label: 'IEEE Xplore',
  //   href: 'https://ieeexplore.ieee.org/author/37088045767',
  //   brand: 'ieee',
  //   external: true,
  // },
  // {
  //   label: 'arXiv',
  //   href: 'https://arxiv.org/',
  //   brand: 'arxiv',
  //   external: true,
  // },
] as const;

// ============================================================
// TECH / SPECIALTY BADGES
// ============================================================

export type TechBadge = {
  label: string;
  alt?: string;
  src: string;
  height?: number;
};

/**
 * Builds a Shields.io badge URL.
 *
 * Notes:
 * - `label` is URL-encoded safely.
 * - `logo` should be the plain logo slug, not pre-encoded.
 *   Example: use `c++`, not `c%2B%2B`.
 */
const createBadge = (
  label: string,
  color: string,
  options?: {
    logo?: string;
    logoColor?: string;
    height?: number;
  }
): TechBadge => {
  const { logo, logoColor = 'white', height = 22 } = options ?? {};

  const encodedLabel = encodeURIComponent(label);
  const logoParam = logo ? `&logo=${encodeURIComponent(logo)}` : '';
  const logoColorParam = logo ? `&logoColor=${encodeURIComponent(logoColor)}` : '';

  return {
    label,
    alt: label,
    height,
    src: `https://img.shields.io/badge/${encodedLabel}-${color}?style=flat${logoParam}${logoColorParam}`,
  };
};

/**
 * Concrete technologies, frameworks, platforms, tools, and libraries.
 * Use these for the visual “stack” UI.
 */
export const TECH_STACK_BADGES: readonly TechBadge[] = [
  // ------------------------------------------------------------
  // Frontend core
  // ------------------------------------------------------------
  createBadge('Angular', 'DD0031', { logo: 'angular' }),
  createBadge('React', '20232A', { logo: 'react', logoColor: '61DAFB' }),
  createBadge('Vue.js', '4FC08D', { logo: 'vuedotjs' }),
  createBadge('Next.js', '000000', { logo: 'next.js' }),
  createBadge('Astro', 'BC52EE', { logo: 'astro' }),
  createBadge('React Native', '20232A', { logo: 'react', logoColor: '61DAFB' }),
  createBadge('Three.js', '000000', { logo: 'three.js' }),
  createBadge('WebGL', '990000'),
  createBadge('HTML5', 'E34F26', { logo: 'html5' }),
  createBadge('CSS3', '1572B6', { logo: 'css3' }),
  createBadge('SCSS', 'CC6699', { logo: 'sass' }),
  createBadge('LESS', '1D365D', { logo: 'less' }),
  createBadge('JavaScript', 'F7DF1E', { logo: 'javascript', logoColor: '000000' }),
  createBadge('TypeScript', '3178C6', { logo: 'typescript' }),

  // ------------------------------------------------------------
  // Frontend architecture / state
  // ------------------------------------------------------------
  createBadge('RxJS', 'B7178C', { logo: 'reactivex' }),
  createBadge('NgRx', 'BA2BD2', { logo: 'ngrx' }),
  createBadge('Redux', '764ABC', { logo: 'redux' }),
  createBadge('Vuex', '4FC08D', { logo: 'vuedotjs' }),
  createBadge('Pinia', 'FFD859', { logo: 'pinia', logoColor: '000000' }),
  createBadge('Nx', '143055', { logo: 'nx' }),
  createBadge('Webpack', '8DD6F9', { logo: 'webpack', logoColor: '000000' }),

  // ------------------------------------------------------------
  // Data visualization / graphics / motion
  // ------------------------------------------------------------
  createBadge('D3.js', 'F9A03C', { logo: 'd3.js' }),
  createBadge('Highcharts', '2F7ED8'),
  createBadge('Canvas', '222222'),
  createBadge('Lottie', '00DDB3'),
  createBadge('Fabric.js', 'C0392B'),

  // ------------------------------------------------------------
  // Realtime / APIs
  // ------------------------------------------------------------
  createBadge('WebSockets', '010101'),
  createBadge('Socket.io', '010101', { logo: 'socketdotio' }),
  createBadge('REST API', '0A66C2'),
  createBadge('Google Maps API', '4285F4', { logo: 'googlemaps' }),

  // ------------------------------------------------------------
  // Backend
  // ------------------------------------------------------------
  createBadge('Node.js', '339933', { logo: 'node.js' }),
  createBadge('Express', '000000', { logo: 'express' }),
  createBadge('NestJS', 'E0234E', { logo: 'nestjs' }),
  createBadge('Python', '3776AB', { logo: 'python' }),
  createBadge('Django', '092E20', { logo: 'django' }),
  createBadge('Flask', '000000', { logo: 'flask' }),
  createBadge('FastAPI', '009688', { logo: 'fastapi' }),
  createBadge('PHP', '777BB4', { logo: 'php' }),
  createBadge('Laravel', 'FF2D20', { logo: 'laravel' }),
  createBadge('WordPress', '21759B', { logo: 'wordpress' }),
  createBadge('WooCommerce', '96588A', { logo: 'woocommerce' }),
  createBadge('Java', 'ED8B00', { logo: 'openjdk' }),
  createBadge('Spring Boot', '6DB33F', { logo: 'springboot' }),

  // ------------------------------------------------------------
  // Cloud / platform
  // ------------------------------------------------------------
  createBadge('Firebase', 'FFCA28', { logo: 'firebase', logoColor: '000000' }),
  createBadge('Supabase', '3ECF8E', { logo: 'supabase' }),
  createBadge('AWS', '232F3E', { logo: 'amazonaws' }),
  createBadge('EC2', 'FF9900', { logo: 'amazonaws' }),
  createBadge('RDS', '527FFF', { logo: 'amazonrds' }),
  createBadge('S3', '569A31', { logo: 'amazons3' }),
  createBadge('CodeDeploy', '3B48CC', { logo: 'amazonaws' }),

  // ------------------------------------------------------------
  // Databases / cache / messaging
  // ------------------------------------------------------------
  createBadge('PostgreSQL', '4169E1', { logo: 'postgresql' }),
  createBadge('MySQL', '4479A1', { logo: 'mysql' }),
  createBadge('MariaDB', '003545', { logo: 'mariadb' }),
  createBadge('MongoDB', '47A248', { logo: 'mongodb' }),
  createBadge('Redis', 'DC382D', { logo: 'redis' }),
  createBadge('Cassandra', '1287B1', { logo: 'apachecassandra' }),
  createBadge('SQLite', '003B57', { logo: 'sqlite' }),
  createBadge('Kafka', '231F20', { logo: 'apachekafka' }),

  // ------------------------------------------------------------
  // Data / ML / CV
  // ------------------------------------------------------------
  createBadge('Pandas', '150458', { logo: 'pandas' }),
  createBadge('NumPy', '013243', { logo: 'numpy' }),
  createBadge('Scikit-learn', 'F7931E', { logo: 'scikitlearn' }),
  createBadge('PyTorch', 'EE4C2C', { logo: 'pytorch' }),
  createBadge('TensorFlow', 'FF6F00', { logo: 'tensorflow' }),
  createBadge('OpenCV', '5C3EE8', { logo: 'opencv' }),
  createBadge('Machine Learning', '0F172A'),

  // ------------------------------------------------------------
  // Scientific / engineering / robotics tooling
  // ------------------------------------------------------------
  createBadge('MATLAB', 'E16737', { logo: 'mathworks' }),
  createBadge('Simulink', 'E16737', { logo: 'mathworks' }),
  createBadge('LabVIEW', 'FFDB00'),
  createBadge('CODESYS', 'C00000'),
  createBadge('CoppeliaSim', '6B7280'),
  createBadge('ROS', '22314E', { logo: 'ros' }),
  createBadge('Arduino', '00979D', { logo: 'arduino' }),
  createBadge('Raspberry Pi', 'A22846', { logo: 'raspberrypi' }),
  createBadge('IoT', '0EA5E9'),

  // ------------------------------------------------------------
  // Systems / languages closer to hardware
  // ------------------------------------------------------------
  createBadge('C', 'A8B9CC', { logo: 'c' }),
  createBadge('C++', '00599C', { logo: 'c++' }),
  createBadge('Rust', '000000', { logo: 'rust' }),
  createBadge('FPGA', '4B5563', { logo: 'intel' }),
  createBadge('VHDL', '6B7280'),

  // ------------------------------------------------------------
  // Research / scientific computing
  // ------------------------------------------------------------
  createBadge('R', '276DC3', { logo: 'r' }),
  createBadge('Bibliometrix', '1D4ED8'),
  createBadge('LaTeX', '008080', { logo: 'latex' }),
  createBadge('Jupyter', 'F37626', { logo: 'jupyter' }),
  createBadge('Gemini API', '8E75FF'),
  createBadge('LLMs', '111827'),
  createBadge('RAG', '0F766E'),

  // ------------------------------------------------------------
  // Power systems / domain software
  // ------------------------------------------------------------
  createBadge('PandaPower', 'F59E0B'),
  createBadge('ANDES', '0F766E'),
] as const;

/**
 * Domain expertise and research specialties.
 * These are not always “software stack” items, so keep them separate.
 */
export const SPECIALTY_BADGES: readonly TechBadge[] = [
  createBadge('Control Systems', '0F172A'),
  createBadge('PID', '2563EB'),
  createBadge('LQR', '1D4ED8'),
  createBadge('Kalman Filter', '7C3AED'),
  createBadge('Game Theory', '9333EA'),
  createBadge('Multi-Agent Systems', '0F766E'),
  createBadge('Robotics', '0891B2'),
  createBadge('Distributed Control', '0E7490'),
  createBadge('State Estimation', '4F46E5'),
  createBadge('Power Systems', 'B45309'),
  createBadge('PMU', '92400E'),
  createBadge('Frequency Estimation', 'D97706'),
  createBadge('RoCoF', 'B91C1C'),
  createBadge('Signal Processing', '334155'),
  createBadge('Computer Vision', '7C2D12'),
  createBadge('Sensor Fusion', '4C1D95'),
] as const;

// ============================================================
// THEMES / APPEARANCE
// ============================================================

export const VALID_THEMES = ['lab', 'dark', 'blueprint', 'copper', 'matrix'] as const;
export type Theme = (typeof VALID_THEMES)[number];

export const VALID_ACCENTS = ['teal', 'mint', 'amber', 'white', 'copper', 'violet'] as const;
export type Accent = (typeof VALID_ACCENTS)[number];

export const VALID_LAYOUTS = ['default', 'mosaic', 'grid', 'split', 'terminal'] as const;
export type Layout = (typeof VALID_LAYOUTS)[number];

export const ACCENT_COLORS: Record<Accent, string> = {
  teal: '#3fb9a7',
  mint: '#50c878',
  amber: '#d29922',
  white: '#e8ebe9',
  copper: '#b8956a',
  violet: '#9d7cbf',
};

// ============================================================
// LAB IDENTITY
// ============================================================

export const LAB_IDENTITY = {
  initials: 'JLMT',
  label: 'LAB',
  role: 'Research Engineer',
  focus: 'Robotics · Distributed Control · FPGA',
  nodeStatus: 'ACTIVE',
  uptime: '99.9%',
} as const;

// ============================================================
// TERMINAL
// ============================================================

export const TERMINAL_CONFIG = {
  bootDelay: 100,
  typewriterSpeed: 15,
  maxHistory: 100,
  promptSymbol: '$',
  dividerChar: '═',
  dividerLength: 40,
} as const;

// ============================================================
// ANIMATION
// ============================================================

export const ANIMATION = {
  ledPulseInterval: 3000,
  signalFlowDuration: 8000,
  droneSpawnMin: 15000,
  droneSpawnMax: 30000,
  panelShuffleDuration: 400,
  focusHighlightDuration: 2000,
} as const;

// ============================================================
// ROBOT ARM
// ============================================================

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

// ============================================================
// PHYSICS / HOVER / LED
// ============================================================

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

// ============================================================
// CIRCUIT BACKGROUND
// ============================================================

export const CIRCUIT_CONFIG = {
  influenceRadius: 180,
  falloffCurve: 2.5,
  cursorGlowRadius: 120,
  cursorGlowOpacity: 0.015,
} as const;

// ============================================================
// MINI GAMES
// ============================================================

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