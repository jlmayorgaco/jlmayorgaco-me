import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type DroneStatus = 'docked' | 'launching' | 'airborne' | 'returning' | 'snapshot';

type Vec2 = {
  x: number;
  y: number;
};

type SnapshotItem = {
  id: string;
  title: string;
  caption: string;
  image: string;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const DEFAULT_GALLERY: SnapshotItem[] = [
  {
    id: 'control-room',
    title: 'Control Lab',
    caption: 'Tuning estimators, validating dynamics, chasing clean signals.',
    image: '/images/easter-egg/control-lab-cartoon.webp',
  },
  {
    id: 'fpga-bench',
    title: 'FPGA Bench',
    caption: 'Exploring embedded acceleration, timing and hardware pipelines.',
    image: '/images/easter-egg/fpga-bench-cartoon.webp',
  },
  {
    id: 'robotics-bay',
    title: 'Robotics Bay',
    caption: 'Distributed coordination, autonomy, and systems thinking in motion.',
    image: '/images/easter-egg/robotics-bay-cartoon.webp',
  },
  {
    id: 'data-station',
    title: 'Data Station',
    caption: 'Making experiments readable, visual and rigorous.',
    image: '/images/easter-egg/data-station-cartoon.webp',
  },
];

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
};

const DroneSvg = ({
  thrusting = false,
  scanning = false,
}: {
  thrusting?: boolean;
  scanning?: boolean;
}) => {
  return (
    <svg
      className="ee-drone-svg"
      viewBox="0 0 220 140"
      role="img"
      aria-label="Recon drone"
    >
      <defs>
        <linearGradient id="droneBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(180,190,210,0.92)" />
        </linearGradient>

        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(130,255,210,0.95)" />
          <stop offset="100%" stopColor="rgba(130,255,210,0)" />
        </radialGradient>

        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="110" cy="118" rx="52" ry="10" className="ee-drone-shadow" />

      <g className={`ee-drone-frame ${thrusting ? 'is-thrusting' : ''}`}>
        <line x1="56" y1="54" x2="88" y2="48" className="ee-drone-arm" />
        <line x1="132" y1="48" x2="164" y2="54" className="ee-drone-arm" />
        <line x1="60" y1="82" x2="86" y2="88" className="ee-drone-arm" />
        <line x1="134" y1="88" x2="160" y2="82" className="ee-drone-arm" />

        <g transform="translate(48 44)">
          <circle cx="0" cy="0" r="13" className="ee-drone-prop-ring" />
          <circle cx="0" cy="0" r="7" className="ee-drone-prop-core" />
        </g>
        <g transform="translate(172 44)">
          <circle cx="0" cy="0" r="13" className="ee-drone-prop-ring" />
          <circle cx="0" cy="0" r="7" className="ee-drone-prop-core" />
        </g>
        <g transform="translate(52 92)">
          <circle cx="0" cy="0" r="13" className="ee-drone-prop-ring" />
          <circle cx="0" cy="0" r="7" className="ee-drone-prop-core" />
        </g>
        <g transform="translate(168 92)">
          <circle cx="0" cy="0" r="13" className="ee-drone-prop-ring" />
          <circle cx="0" cy="0" r="7" className="ee-drone-prop-core" />
        </g>

        <g>
          <ellipse cx="110" cy="70" rx="44" ry="22" fill="url(#droneBodyGradient)" />
          <rect x="80" y="52" width="60" height="36" rx="16" className="ee-drone-shell" />
          <circle cx="110" cy="70" r="14" fill="url(#coreGlow)" filter="url(#softGlow)" />
          <circle cx="110" cy="70" r="6" className="ee-drone-core" />
          <path d="M94 94 L88 106 H132 L126 94" className="ee-drone-leg" />
        </g>

        {scanning && (
          <g className="ee-drone-scan">
            <path d="M110 86 L95 132 L125 132 Z" className="ee-drone-scan-beam" />
          </g>
        )}
      </g>
    </svg>
  );
};

function useBodyPortal(): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const existing = document.getElementById('ee-drone-portal-root');
    if (existing) {
      setTarget(existing);
      return;
    }

    const el = document.createElement('div');
    el.id = 'ee-drone-portal-root';
    document.body.appendChild(el);
    setTarget(el);

    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  return target;
}

export default function EasterEggDronePanel(): JSX.Element {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const portalTarget = useBodyPortal();
  const reducedMotion = usePrefersReducedMotion();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<DroneStatus>('docked');
  const [launched, setLaunched] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [autopilot, setAutopilot] = useState(true);

  const [position, setPosition] = useState<Vec2>({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState<Vec2>({ x: 0, y: 0 });

  const positionRef = useRef<Vec2>({ x: 0, y: 0 });
  const velocityRef = useRef<Vec2>({ x: 0, y: 0 });
  const inputRef = useRef<Vec2>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const returnTargetRef = useRef<Vec2>({ x: 0, y: 0 });
  const snapshotTimeoutRef = useRef<number | null>(null);

  const gallery = useMemo(() => DEFAULT_GALLERY, []);
  const availableNext = gallery.find((item) => !unlockedIds.includes(item.id));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    const initial = {
      x: rect.left + rect.width * 0.5 - 56,
      y: rect.top + rect.height * 0.32,
    };

    positionRef.current = initial;
    setPosition(initial);
  }, [mounted]);

  const updateReturnTarget = (): void => {
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    returnTargetRef.current = {
      x: rect.left + rect.width * 0.5 - 56,
      y: rect.top + rect.height * 0.26,
    };
  };

  useEffect(() => {
    updateReturnTarget();

    const onResize = () => {
      updateReturnTarget();

      const maxX = window.innerWidth - 112;
      const maxY = window.innerHeight - 112;

      positionRef.current = {
        x: clamp(positionRef.current.x, 0, maxX),
        y: clamp(positionRef.current.y, 0, maxY),
      };

      setPosition(positionRef.current);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', updateReturnTarget, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', updateReturnTarget);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const tick = (ts: number) => {
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      }

      const dt = Math.min((ts - lastTsRef.current) / 16.6667, 2.4);
      lastTsRef.current = ts;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const droneWidth = 112;
      const droneHeight = 112;

      let x = positionRef.current.x;
      let y = positionRef.current.y;
      let vx = velocityRef.current.x;
      let vy = velocityRef.current.y;

      const input = inputRef.current;
      const maxSpeed = 7.2;
      const thrust = 0.48;
      const damping = autopilot ? 0.986 : 0.975;
      const bounce = 0.88;

      if (status === 'launching') {
        vx += 0.22 * dt;
        vy -= 0.34 * dt;

        if (Math.hypot(vx, vy) > 2.8) {
          setStatus('airborne');
        }
      } else if (status === 'returning') {
        const tx = returnTargetRef.current.x;
        const ty = returnTargetRef.current.y;

        const dx = tx - x;
        const dy = ty - y;
        const dist = Math.hypot(dx, dy);

        vx += dx * 0.0085 * dt;
        vy += dy * 0.0085 * dt;

        if (dist < 10) {
          x = tx;
          y = ty;
          vx = 0;
          vy = 0;
          setStatus('docked');
          setLaunched(false);
          setAutopilot(true);
        }
      } else if (status === 'airborne' || status === 'snapshot') {
        if (input.x !== 0 || input.y !== 0) {
          vx += input.x * thrust * dt;
          vy += input.y * thrust * dt;
          setAutopilot(false);
        } else if (autopilot) {
          const t = ts * 0.001;
          vx += Math.sin(t * 0.9) * 0.032 * dt;
          vy += Math.cos(t * 1.2) * 0.028 * dt;
        } else {
          vx += Math.sin(ts * 0.0008) * 0.015 * dt;
          vy += Math.cos(ts * 0.001) * 0.015 * dt;
        }
      }

      vx *= Math.pow(damping, dt);
      vy *= Math.pow(damping, dt);

      const speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        const factor = maxSpeed / speed;
        vx *= factor;
        vy *= factor;
      }

      x += vx * dt;
      y += vy * dt;

      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx) * bounce;
      } else if (x >= viewportWidth - droneWidth) {
        x = viewportWidth - droneWidth;
        vx = -Math.abs(vx) * bounce;
      }

      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy) * bounce;
      } else if (y >= viewportHeight - droneHeight) {
        y = viewportHeight - droneHeight;
        vy = -Math.abs(vy) * bounce;
      }

      positionRef.current = { x, y };
      velocityRef.current = { x: vx, y: vy };

      setPosition({ x, y });
      setVelocity({ x: vx, y: vy });

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [autopilot, reducedMotion, status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!launched) return;

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          inputRef.current.y = -1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          inputRef.current.y = 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          inputRef.current.x = -1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputRef.current.x = 1;
          break;
        case ' ':
          event.preventDefault();
          handleSnapshot();
          break;
        default:
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'ArrowDown':
        case 's':
        case 'S':
          inputRef.current.y = 0;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputRef.current.x = 0;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [launched]);

  useEffect(() => {
    return () => {
      if (snapshotTimeoutRef.current) {
        window.clearTimeout(snapshotTimeoutRef.current);
      }
    };
  }, []);

  const launchDrone = (): void => {
    if (launched || status === 'launching') return;
    updateReturnTarget();

    setLaunched(true);
    setStatus('launching');
    setAutopilot(true);

    velocityRef.current = { x: 1.6, y: -2.2 };
    setVelocity(velocityRef.current);
  };

  const recallDrone = (): void => {
    if (!launched) return;
    updateReturnTarget();

    inputRef.current = { x: 0, y: 0 };
    setStatus('returning');
    setAutopilot(true);
  };

  const setDirectionalInput = (dir: Partial<Vec2>, active: boolean): void => {
    if (!launched) return;

    inputRef.current = {
      x: typeof dir.x === 'number' ? (active ? dir.x : 0) : inputRef.current.x,
      y: typeof dir.y === 'number' ? (active ? dir.y : 0) : inputRef.current.y,
    };

    if (active) {
      setAutopilot(false);
    }
  };

  const handleSnapshot = (): void => {
    if (!launched || !availableNext) return;

    setStatus('snapshot');

    if (snapshotTimeoutRef.current) {
      window.clearTimeout(snapshotTimeoutRef.current);
    }

    snapshotTimeoutRef.current = window.setTimeout(() => {
      setUnlockedIds((prev) => (prev.includes(availableNext.id) ? prev : [...prev, availableNext.id]));
      setShowGallery(true);
      setStatus('airborne');
    }, 460);
  };

  const speedLabel = Math.hypot(velocity.x, velocity.y).toFixed(1);

  return (
    <div className="ee-drone-panel" ref={panelRef}>
      <div className="ee-drone-panel__header">
        <div className="ee-drone-panel__title-wrap">
          <span className="ee-drone-panel__kicker">Recon Drone</span>
          <h3 className="ee-drone-panel__title">Field explorer module</h3>
        </div>

        <div className="ee-drone-panel__status">
          <span className={`ee-drone-panel__status-dot is-${status}`} />
          <span className="ee-drone-panel__status-text">{status}</span>
        </div>
      </div>

      <div className="ee-drone-panel__dock">
        <div className="ee-drone-panel__dock-ring" />
        <div className="ee-drone-panel__dock-core" />
        <div className="ee-drone-panel__dock-label">Dock / Launch Bay</div>
      </div>

      <div className="ee-drone-panel__controls">
        <div className="ee-drone-panel__actions">
          <button
            type="button"
            className="ee-drone-btn ee-drone-btn--primary"
            onClick={launchDrone}
            disabled={launched && status !== 'docked'}
          >
            Launch
          </button>

          <button
            type="button"
            className="ee-drone-btn"
            onClick={recallDrone}
            disabled={!launched}
          >
            Recall
          </button>

          <button
            type="button"
            className="ee-drone-btn"
            onClick={handleSnapshot}
            disabled={!launched || !availableNext}
          >
            Snapshot
          </button>
        </div>

        <div className="ee-drone-panel__pad-block">
          <div className="ee-drone-panel__pad-title">Manual pad</div>

          <div className="ee-drone-pad" aria-label="Drone directional pad">
            <button
              type="button"
              className="ee-drone-pad__btn ee-drone-pad__btn--up"
              onMouseDown={() => setDirectionalInput({ y: -1 }, true)}
              onMouseUp={() => setDirectionalInput({ y: -1 }, false)}
              onMouseLeave={() => setDirectionalInput({ y: -1 }, false)}
              onTouchStart={() => setDirectionalInput({ y: -1 }, true)}
              onTouchEnd={() => setDirectionalInput({ y: -1 }, false)}
              aria-label="Move up"
            >
              ↑
            </button>

            <button
              type="button"
              className="ee-drone-pad__btn ee-drone-pad__btn--left"
              onMouseDown={() => setDirectionalInput({ x: -1 }, true)}
              onMouseUp={() => setDirectionalInput({ x: -1 }, false)}
              onMouseLeave={() => setDirectionalInput({ x: -1 }, false)}
              onTouchStart={() => setDirectionalInput({ x: -1 }, true)}
              onTouchEnd={() => setDirectionalInput({ x: -1 }, false)}
              aria-label="Move left"
            >
              ←
            </button>

            <button
              type="button"
              className="ee-drone-pad__btn ee-drone-pad__btn--center"
              onClick={() => setAutopilot((prev) => !prev)}
              aria-label="Toggle autopilot"
            >
              {autopilot ? 'AUTO' : 'MAN'}
            </button>

            <button
              type="button"
              className="ee-drone-pad__btn ee-drone-pad__btn--right"
              onMouseDown={() => setDirectionalInput({ x: 1 }, true)}
              onMouseUp={() => setDirectionalInput({ x: 1 }, false)}
              onMouseLeave={() => setDirectionalInput({ x: 1 }, false)}
              onTouchStart={() => setDirectionalInput({ x: 1 }, true)}
              onTouchEnd={() => setDirectionalInput({ x: 1 }, false)}
              aria-label="Move right"
            >
              →
            </button>

            <button
              type="button"
              className="ee-drone-pad__btn ee-drone-pad__btn--down"
              onMouseDown={() => setDirectionalInput({ y: 1 }, true)}
              onMouseUp={() => setDirectionalInput({ y: 1 }, false)}
              onMouseLeave={() => setDirectionalInput({ y: 1 }, false)}
              onTouchStart={() => setDirectionalInput({ y: 1 }, true)}
              onTouchEnd={() => setDirectionalInput({ y: 1 }, false)}
              aria-label="Move down"
            >
              ↓
            </button>
          </div>

          <p className="ee-drone-panel__hint">
            Use pad or keyboard: WASD / arrows. Space takes a snapshot.
          </p>
        </div>
      </div>

      <div className="ee-drone-panel__telemetry">
        <div className="ee-drone-stat">
          <span className="ee-drone-stat__label">Mode</span>
          <span className="ee-drone-stat__value">{autopilot ? 'Autopilot' : 'Manual'}</span>
        </div>

        <div className="ee-drone-stat">
          <span className="ee-drone-stat__label">Velocity</span>
          <span className="ee-drone-stat__value">{speedLabel}</span>
        </div>

        <div className="ee-drone-stat">
          <span className="ee-drone-stat__label">Snapshots</span>
          <span className="ee-drone-stat__value">
            {unlockedIds.length}/{gallery.length}
          </span>
        </div>
      </div>

      <div className="ee-drone-panel__gallery-strip">
        {gallery.map((item) => {
          const unlocked = unlockedIds.includes(item.id);
          return (
            <button
              type="button"
              key={item.id}
              className={`ee-drone-gallery-chip ${unlocked ? 'is-unlocked' : 'is-locked'}`}
              disabled={!unlocked}
              onClick={() => setShowGallery(true)}
            >
              {unlocked ? item.title : 'Locked'}
            </button>
          );
        })}
      </div>

      {portalTarget &&
        createPortal(
          <>
            <div
              className={`ee-drone-overlay ${launched || status !== 'docked' ? 'is-visible' : 'is-hidden'} ${
                status === 'snapshot' ? 'is-flashing' : ''
              }`}
              aria-hidden="true"
            >
              <div
                className={`ee-drone-overlay__drone is-${status}`}
                style={{
                  transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${clamp(
                    velocity.x * 5.5,
                    -18,
                    18,
                  )}deg)`,
                }}
              >
                <DroneSvg
                  thrusting={status === 'launching' || status === 'airborne' || status === 'returning'}
                  scanning={status === 'snapshot'}
                />
              </div>
            </div>

            {showGallery && (
              <div className="ee-drone-gallery-modal" role="dialog" aria-modal="true" aria-label="Drone snapshots gallery">
                <div className="ee-drone-gallery-modal__backdrop" onClick={() => setShowGallery(false)} />

                <div className="ee-drone-gallery-modal__panel">
                  <div className="ee-drone-gallery-modal__header">
                    <div>
                      <span className="ee-drone-gallery-modal__kicker">Mission archive</span>
                      <h4 className="ee-drone-gallery-modal__title">Recon snapshots</h4>
                    </div>

                    <button
                      type="button"
                      className="ee-drone-gallery-modal__close"
                      onClick={() => setShowGallery(false)}
                      aria-label="Close gallery"
                    >
                      ×
                    </button>
                  </div>

                  <div className="ee-drone-gallery-modal__grid">
                    {gallery.map((item) => {
                      const unlocked = unlockedIds.includes(item.id);
                      return (
                        <article
                          key={item.id}
                          className={`ee-drone-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                        >
                          <div className="ee-drone-card__media">
                            {unlocked ? (
                              <img src={item.image} alt={item.title} loading="lazy" />
                            ) : (
                              <div className="ee-drone-card__placeholder">Locked mission</div>
                            )}
                          </div>

                          <div className="ee-drone-card__body">
                            <h5 className="ee-drone-card__title">
                              {unlocked ? item.title : 'Unknown zone'}
                            </h5>
                            <p className="ee-drone-card__caption">
                              {unlocked ? item.caption : 'Capture more snapshots to unlock this record.'}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>,
          portalTarget,
        )}
    </div>
  );
}