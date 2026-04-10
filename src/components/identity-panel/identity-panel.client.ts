type IdentityPanelSlideId = 'intro' | 'stack' | 'poster' | 'easter-egg';

type IdentityPanelElements = {
  root: HTMLElement;
  slides: HTMLElement[];
  triggers: HTMLButtonElement[];
  prevButton?: HTMLButtonElement | null;
  nextButton?: HTMLButtonElement | null;
};

const PANEL_SELECTOR = '[data-identity-panel]';
const SLIDE_SELECTOR = '[data-identity-slide]';
const TRIGGER_SELECTOR = '[data-identity-trigger]';
const PREV_SELECTOR = '[data-identity-prev]';
const NEXT_SELECTOR = '[data-identity-next]';

const ACTIVE_CLASS = 'is-active';

class IdentityPanelController {
  private readonly root: HTMLElement;
  private readonly slides: HTMLElement[];
  private readonly triggers: HTMLButtonElement[];
  private readonly prevButton?: HTMLButtonElement | null;
  private readonly nextButton?: HTMLButtonElement | null;

  private activeIndex = 0;

  constructor({ root, slides, triggers, prevButton, nextButton }: IdentityPanelElements) {
    this.root = root;
    this.slides = slides;
    this.triggers = triggers;
    this.prevButton = prevButton;
    this.nextButton = nextButton;

    if (this.slides.length === 0) {
      return;
    }

    this.activeIndex = this.resolveInitialIndex();
    this.bindEvents();
    this.setActiveSlide(this.activeIndex, { moveFocus: false });
  }

  private resolveInitialIndex(): number {
    const initialIndexAttr = this.root.dataset.initialIndex;
    const initialSlideAttr = this.root.dataset.initialSlide as IdentityPanelSlideId | undefined;

    if (initialIndexAttr) {
      const parsed = Number.parseInt(initialIndexAttr, 10);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed < this.slides.length) {
        return parsed;
      }
    }

    if (initialSlideAttr) {
      const foundIndex = this.slides.findIndex(
        (slide) => slide.dataset.identitySlide === initialSlideAttr
      );

      if (foundIndex >= 0) {
        return foundIndex;
      }
    }

    const explicitActiveIndex = this.slides.findIndex((slide) =>
      slide.classList.contains(ACTIVE_CLASS)
    );

    return explicitActiveIndex >= 0 ? explicitActiveIndex : 0;
  }

  private bindEvents(): void {
    this.triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', () => {
        this.setActiveSlide(index, { moveFocus: false });
      });

      trigger.addEventListener('keydown', (event) => {
        this.onTriggerKeydown(event, index);
      });
    });

    this.prevButton?.addEventListener('click', () => {
      this.goToPrevious();
    });

    this.nextButton?.addEventListener('click', () => {
      this.goToNext();
    });

    this.root.addEventListener('keydown', (event) => {
      this.onRootKeydown(event);
    });
  }

  private onTriggerKeydown(event: KeyboardEvent, currentIndex: number): void {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        this.focusTrigger(this.getSafeIndex(currentIndex + 1));
        break;
      }

      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        this.focusTrigger(this.getSafeIndex(currentIndex - 1));
        break;
      }

      case 'Home': {
        event.preventDefault();
        this.focusTrigger(0);
        break;
      }

      case 'End': {
        event.preventDefault();
        this.focusTrigger(this.slides.length - 1);
        break;
      }

      case 'Enter':
      case ' ': {
        event.preventDefault();
        this.setActiveSlide(currentIndex, { moveFocus: false });
        break;
      }

      default:
        break;
    }
  }

  private onRootKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isInsideTrigger = target?.matches(TRIGGER_SELECTOR);

    if (isInsideTrigger) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault();
        this.goToNext();
        break;
      }

      case 'ArrowLeft': {
        event.preventDefault();
        this.goToPrevious();
        break;
      }

      default:
        break;
    }
  }

  private goToPrevious(): void {
    this.setActiveSlide(this.getSafeIndex(this.activeIndex - 1), { moveFocus: false });
  }

  private goToNext(): void {
    this.setActiveSlide(this.getSafeIndex(this.activeIndex + 1), { moveFocus: false });
  }

  private getSafeIndex(index: number): number {
    if (index < 0) {
      return this.slides.length - 1;
    }

    if (index >= this.slides.length) {
      return 0;
    }

    return index;
  }

  private focusTrigger(index: number): void {
    this.triggers[index]?.focus();
  }

  private setActiveSlide(index: number, options: { moveFocus: boolean }): void {
    this.activeIndex = this.getSafeIndex(index);

    this.slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === this.activeIndex;

      slide.classList.toggle(ACTIVE_CLASS, isActive);
      slide.toggleAttribute('hidden', !isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    this.triggers.forEach((trigger, triggerIndex) => {
      const isActive = triggerIndex === this.activeIndex;

      trigger.classList.toggle(ACTIVE_CLASS, isActive);
      trigger.classList.toggle('is-active', isActive);
      trigger.classList.toggle('port-active', isActive);
      trigger.setAttribute('aria-selected', String(isActive));
      trigger.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    const activeSlide = this.slides[this.activeIndex];
    const activeSlideId = activeSlide?.dataset.identitySlide ?? String(this.activeIndex);

    this.root.dataset.activeIndex = String(this.activeIndex);
    this.root.dataset.activeSlide = activeSlideId;

    if (options.moveFocus) {
      activeSlide?.focus();
    }
  }
}

const getPanelElements = (root: HTMLElement): IdentityPanelElements | null => {
  const slides = Array.from(root.querySelectorAll<HTMLElement>(SLIDE_SELECTOR));
  const triggers = Array.from(root.querySelectorAll<HTMLButtonElement>(TRIGGER_SELECTOR));

  if (slides.length === 0 || triggers.length === 0 || slides.length !== triggers.length) {
    return null;
  }

  return {
    root,
    slides,
    triggers,
    prevButton: root.querySelector<HTMLButtonElement>(PREV_SELECTOR),
    nextButton: root.querySelector<HTMLButtonElement>(NEXT_SELECTOR),
  };
};

const initIdentityPanels = (): void => {
  const panelRoots = Array.from(document.querySelectorAll<HTMLElement>(PANEL_SELECTOR));

  panelRoots.forEach((root) => {
    if (root.dataset.identityPanelReady === 'true') {
      return;
    }

    const elements = getPanelElements(root);
    if (!elements) {
      return;
    }

    root.dataset.identityPanelReady = 'true';
    new IdentityPanelController(elements);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIdentityPanels, { once: true });
} else {
  initIdentityPanels();
}