export type IdentityPanelSlideId = 'intro' | 'stack' | 'poster' | 'easter-egg';

export type IdentityPanelCtaVariant = 'primary' | 'secondary';

export type IdentityPanelFactIcon =
  | 'location'
  | 'collab'
  | 'current'
  | 'mode'
  | 'custom';

export type IdentityPanelActionIcon =
  | 'cv'
  | 'projects'
  | 'scholar'
  | 'contact'
  | 'mail'
  | 'custom';

export type IdentityPanelSocialBrand =
  | 'github'
  | 'scholar'
  | 'linkedin'
  | 'ieee'
  | 'orcid'
  | 'arxiv'
  | 'email'
  | 'cv'
  | 'custom';

export interface IdentityPanelCta {
  href: string;
  label: string;
  icon?: IdentityPanelActionIcon | string;
  variant?: IdentityPanelCtaVariant;
  external?: boolean;
}

export interface IdentityPanelStat {
  label: string;
  value: string;
  led?: boolean;
}

export interface IdentityPanelQuickFact {
  label: string;
  value: string;
  icon?: IdentityPanelFactIcon | string;
}

export interface IdentityPanelMetric {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface IdentityPanelSocialLink {
  label: string;
  href: string;
  brand: IdentityPanelSocialBrand | string;
}

export interface IdentityPanelSlideBase {
  id: IdentityPanelSlideId;
  label: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export interface IdentityIntroSlideData {
  name: string;
  title: string;
  tagline: string;
  focusItems: string[];
  quickFacts: IdentityPanelQuickFact[];
  socialLinks: IdentityPanelSocialLink[];
  actions: IdentityPanelCta[];
}

export interface IdentityStackGroup {
  title?: string;
  items: IdentityStackItem[];
}

export interface IdentityStackSlideData {
  groups: IdentityStackGroup[];
}

export interface IdentityPosterSlideData {
  imageSrc: string;
  imageAlt: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
}

export interface IdentityEasterEggAction {
  label: string;
  href?: string;
  action?: 'reveal' | 'launch' | 'copy' | 'theme';
}

export interface IdentityEasterEggSlideData {
  title: string;
  lines: string[];
  action?: IdentityEasterEggAction;
}

export interface IdentityPanelSlidesData {
  intro: IdentityIntroSlideData;
  stack: IdentityStackSlideData;
  poster: IdentityPosterSlideData;
  'easter-egg': IdentityEasterEggSlideData;
}

export interface IdentityPanelProps {
  class?: string;
  panelLabel?: string;
  moduleId?: string;
  footerLabel?: string;
  ledPulse?: boolean;

  initialSlide?: IdentityPanelSlideId;
  slides?: IdentityPanelSlideBase[];
  data: IdentityPanelSlidesData;

  portCount?: number;
  activePortIndex?: number;

  experienceStartYear?: number;

  stats?: IdentityPanelStat[];
  metrics?: IdentityPanelMetric[];
}

export interface IdentityStackItem {
  label: string;
  src: string;
  alt?: string;
  height?: number;
  href?: string;
}

