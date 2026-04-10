import { SOCIAL_LINKS, TECH_STACK_BADGES, SPECIALTY_BADGES, TechBadge} from "../../lib/config";
import { IdentityPanelSlidesData } from "./IdentityPanel.types";

/**
 * Identity panel data
 * Uses config badges as the single source of truth.
 *
 * Keep this file focused on:
 * - grouping
 * - ordering
 * - content/copy
 *
 * Do not hardcode badge URLs here unless a badge truly does not exist in config.
 */

const ALL_BADGES: readonly TechBadge[] = [
  ...TECH_STACK_BADGES,
  ...SPECIALTY_BADGES,
] as const;

type IdentityStackBadge = {
  label: string;
  src: string;
  alt: string;
  height: number;
};

const normalizeBadge = (badge: TechBadge): IdentityStackBadge => ({
  label: badge.label,
  src: badge.src,
  alt: badge.alt ?? badge.label,
  height: badge.height ?? 22,
});

const findBadge = (label: string): IdentityStackBadge => {
  const badge = ALL_BADGES.find((item) => item.label === label);

  if (!badge) {
    throw new Error(`Missing badge in config for "${label}"`);
  }

  return normalizeBadge(badge);
};

const pickBadges = (...labels: string[]): IdentityStackBadge[] =>
  labels.map(findBadge);

export const identityPanelData = {
  intro: {
    name: 'Jorge L. Mayorga',
    title: 'Software Engineer\nControl & Robotics Researcher',
    tagline:
      'Building real-time systems across software, electronics, robotics, embedded control, and research tooling.',
    focusItems: [
      'Robotics',
      'Distributed Systems',
      'FPGA',
      'Control',
      'Software',
    ],
    quickFacts: [
      { label: 'Based', value: 'Bogotá, Colombia', icon: 'location' },
      { label: 'Years of Experience', value: '+9', icon: 'collab' },
      { label: 'Current', value: 'MSc Robotics', icon: 'current' },
      { label: 'Mode', value: 'Software + research', icon: 'mode' },
    ],
    socialLinks: SOCIAL_LINKS,
    actions: [
      { href: '/cv', label: 'View CV', icon: 'cv', variant: 'primary' },
      { href: '/projects', label: 'Projects', icon: 'projects', variant: 'secondary' },
      { href: '/papers', label: 'Scholar', icon: 'scholar', variant: 'secondary' },
      { href: '/contact', label: 'Contact', icon: 'contact', variant: 'secondary' },
    ],
  },

  stack: {
    groups: [
      {
        title: 'Frontend',
        items: pickBadges(
          'Angular',
          'React',
          'Vue.js',
          'Next.js',
          'Astro',
          'React Native',
          'Three.js',
          'WebGL',
          'HTML5',
          'CSS3',
          'SCSS',
          'LESS',
          'JavaScript',
          'TypeScript',
          'RxJS',
          'NgRx',
          'Redux',
          'Vuex',
          'Pinia',
          'Nx',
          'Webpack',
          'D3.js',
          'Highcharts',
          'Canvas',
          'Lottie',
          'Fabric.js'
        ),
      },
      {
        title: 'Backend / Cloud / Data',
        items: pickBadges(
          'Node.js',
          'Express',
          'NestJS',
          'Python',
          'Django',
          'Flask',
          'FastAPI',
          'PHP',
          'Laravel',
          'WordPress',
          'WooCommerce',
          'Java',
          'Spring Boot',
          'Firebase',
          'Supabase',
          'AWS',
          'EC2',
          'RDS',
          'S3',
          'CodeDeploy',
          'PostgreSQL',
          'MySQL',
          'MariaDB',
          'MongoDB',
          'Redis',
          'Cassandra',
          'SQLite',
          'Kafka',
          'WebSockets',
          'Socket.io',
          'REST API',
          'Google Maps API'
        ),
      },
      {
        title: 'ML / Scientific / Robotics / Embedded',
        items: pickBadges(
          'Pandas',
          'NumPy',
          'Scikit-learn',
          'PyTorch',
          'TensorFlow',
          'OpenCV',
          'Machine Learning',
          'MATLAB',
          'Simulink',
          'LabVIEW',
          'CODESYS',
          'CoppeliaSim',
          'ROS',
          'Arduino',
          'Raspberry Pi',
          'IoT',
          'C',
          'C++',
          'Rust',
          'FPGA',
          'VHDL',
          'R',
          'Bibliometrix',
          'LaTeX',
          'Jupyter',
          'Gemini API',
          'LLMs',
          'RAG',
          'PandaPower',
          'ANDES'
        ),
      },
      {
        title: 'Domains / Methods',
        items: pickBadges(
          'Control Systems',
          'PID',
          'LQR',
          'Kalman Filter',
          'Game Theory',
          'Multi-Agent Systems',
          'Robotics',
          'Distributed Control',
          'State Estimation',
          'Power Systems',
          'PMU',
          'Frequency Estimation',
          'RoCoF',
          'Signal Processing',
          'Computer Vision',
          'Sensor Fusion'
        ),
      },
    ],
  },

  poster: {
    imageSrc: '/images/identity/poster/poster2.png',
    imageAlt:
      'Illustrated poster of Jorge working on robotics, electronics, and software',
    eyebrow: 'Poster mode',
    title: 'Building quietly behind the interface',
    caption:
      'Software, electronics, robotics, embedded systems, and research workflows in one lab scene.',
  },

  'easter-egg': {
    title: 'GO / hidden mode',
    lines: [
      'boot sequence initialized',
      'robotics workspace online',
      'embedded toolchain ready',
      'signal estimation sandbox ready',
    ],
    action: {
      label: 'Launch',
      action: 'launch',
    },
  },
} satisfies IdentityPanelSlidesData;