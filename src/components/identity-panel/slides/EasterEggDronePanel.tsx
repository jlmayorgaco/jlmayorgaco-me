import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './EasterEggDronePanel.scss';

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
const DRONE_SIZE = 112;

const getDocumentDimensions = (): { width: number, height: number } => ({
  width: document.documentElement.scrollWidth,
  height: document.documentElement.scrollHeight,
});

const getScrollOffset = (): Vec2 => ({
  x: window.scrollX,
  y: window.scrollY,
});

const viewportToDocument = (pos: Vec2): Vec2 => ({
  x: pos.x + window.scrollX,
  y: pos.y + window.scrollY,
});

const documentToViewport = (pos: Vec2): Vec2 => ({
  x: pos.x - window.scrollX,
  y: pos.y - window.scrollY,
});

const KEY_DIRECTIONS: Record<string, Partial<Vec2>> = {
  ArrowUp: { y: -1 },
  w: { y: -1 },
  W: { y: -1 },
  ArrowDown: { y: 1 },
  s: { y: 1 },
  S: { y: 1 },
  ArrowLeft: { x: -1 },
  a: { x: -1 },
  A: { x: -1 },
  ArrowRight: { x: 1 },
  d: { x: 1 },
  D: { x: 1 },
};

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
  tiltX = 0,
  tiltY = 0,
  speed = 0,
}: {
  thrusting?: boolean;
  scanning?: boolean;
  tiltX?: number;
  tiltY?: number;
  speed?: number;
}) => {
  const propSpeed = thrusting ? '0.03s' : '0.12s';
  const tiltDeg = clamp(tiltX * 8, -12, 12);
  const pitchDeg = clamp(tiltY * 5, -8, 8);
  const bobY = Math.sin(speed * 0.5) * 2;
  const rotorBlur = thrusting ? 2 + speed * 0.5 : 0;

  return (
    <svg
      className="ee-drone-svg"
      viewBox="0 0 220 160"
      role="img"
      aria-label="DJI Phantom-style recon drone"
      style={{
        transform: `rotateX(${pitchDeg}deg) rotateZ(${tiltDeg}deg)`,
      }}
    >
      <defs>
        <linearGradient id="droneBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="50%" stopColor="rgba(230,235,245,0.92)" />
          <stop offset="100%" stopColor="rgba(210,220,235,0.9)" />
        </linearGradient>

        <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(200,210,225,0.95)" />
          <stop offset="100%" stopColor="rgba(180,190,210,0.9)" />
        </linearGradient>

        <linearGradient id="propellerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(100,110,130,0.9)" />
          <stop offset="100%" stopColor="rgba(70,80,100,0.95)" />
        </linearGradient>

        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(0,212,170,0.8)" />
          <stop offset="70%" stopColor="rgba(0,212,170,0.3)" />
          <stop offset="100%" stopColor="rgba(0,212,170,0)" />
        </radialGradient>

        <radialGradient id="ledGlowRed" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(255,50,50,0.9)" />
          <stop offset="100%" stopColor="rgba(255,50,50,0)" />
        </radialGradient>

        <radialGradient id="ledGlowGreen" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(50,255,100,0.9)" />
          <stop offset="100%" stopColor="rgba(50,255,100,0)" />
        </radialGradient>

        <filter id="softGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="rotorBlur">
          <feGaussianBlur stdDeviation={rotorBlur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="thrusterGlow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shadow with speed effect */}
      <ellipse 
        cx="110" 
        cy="145" 
        rx={55 - speed * 2} 
        ry={12 - speed * 0.6} 
        className="ee-drone-shadow"
        style={{
          opacity: 0.4 + speed * 0.15,
          transform: `scaleX(${1 - speed * 0.2})`,
          filter: 'blur(4px)',
        }}
        fill="rgba(0,0,0,0.3)"
      />

      <g 
        className={`ee-drone-frame ${thrusting ? 'is-thrusting' : ''}`}
        style={{ transform: `translateY(${bobY}px)` }}
      >
        {/* Arms - thicker, more realistic */}
        <g className="ee-drone-arms">
          {/* Front right arm */}
          <path 
            d="M110,70 L150,40 L155,45 L115,75 Z" 
            fill="url(#armGradient)"
            stroke="var(--drone-shell-highlight)"
            strokeWidth="1"
          />
          {/* Front left arm */}
          <path 
            d="M110,70 L70,40 L65,45 L105,75 Z" 
            fill="url(#armGradient)"
            stroke="var(--drone-shell-highlight)"
            strokeWidth="1"
          />
          {/* Back right arm */}
          <path 
            d="M110,85 L150,115 L155,110 L115,80 Z" 
            fill="url(#armGradient)"
            stroke="var(--drone-shell-highlight)"
            strokeWidth="1"
          />
          {/* Back left arm */}
          <path 
            d="M110,85 L70,115 L65,110 L105,80 Z" 
            fill="url(#armGradient)"
            stroke="var(--drone-shell-highlight)"
            strokeWidth="1"
          />
        </g>

        {/* Propellers with detailed blades */}
        <g className="ee-drone-propellers">
          {/* Front right propeller */}
          <g transform="translate(155,40)" filter={thrusting ? "url(#rotorBlur)" : undefined}>
            <circle cx="0" cy="0" r="16" fill="url(#propellerGradient)" stroke="var(--drone-border-bright)" strokeWidth="1" />
            {/* Propeller blades */}
            <g style={{ animationDuration: propSpeed, transformOrigin: 'center' }} className="ee-drone-prop-rotor">
              <path d="M0,-12 L-2,-18 L2,-18 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M12,0 L18,2 L18,-2 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M0,12 L2,18 L-2,18 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M-12,0 L-18,-2 L-18,2 Z" fill="rgba(60,70,90,0.9)" />
            </g>
            {thrusting && (
              <g className="ee-drone-thruster">
                <ellipse cx="0" cy="20" rx="8" ry="16" fill="rgba(0,212,170,0.25)" filter="url(#thrusterGlow)" />
                <ellipse cx="0" cy="18" rx="5" ry="10" fill="rgba(0,212,170,0.4)" />
              </g>
            )}
          </g>

          {/* Front left propeller */}
          <g transform="translate(65,40)" filter={thrusting ? "url(#rotorBlur)" : undefined}>
            <circle cx="0" cy="0" r="16" fill="url(#propellerGradient)" stroke="var(--drone-border-bright)" strokeWidth="1" />
            <g style={{ animationDuration: propSpeed, animationDirection: 'reverse', transformOrigin: 'center' }} className="ee-drone-prop-rotor">
              <path d="M0,-12 L-2,-18 L2,-18 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M12,0 L18,2 L18,-2 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M0,12 L2,18 L-2,18 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M-12,0 L-18,-2 L-18,2 Z" fill="rgba(60,70,90,0.9)" />
            </g>
            {thrusting && (
              <g className="ee-drone-thruster">
                <ellipse cx="0" cy="20" rx="8" ry="16" fill="rgba(0,212,170,0.25)" filter="url(#thrusterGlow)" />
                <ellipse cx="0" cy="18" rx="5" ry="10" fill="rgba(0,212,170,0.4)" />
              </g>
            )}
          </g>

          {/* Back right propeller */}
          <g transform="translate(155,110)" filter={thrusting ? "url(#rotorBlur)" : undefined}>
            <circle cx="0" cy="0" r="16" fill="url(#propellerGradient)" stroke="var(--drone-border-bright)" strokeWidth="1" />
            <g style={{ animationDuration: propSpeed, animationDirection: 'reverse', transformOrigin: 'center' }} className="ee-drone-prop-rotor">
              <path d="M0,-12 L-2,-18 L2,-18 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M12,0 L18,2 L18,-2 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M0,12 L2,18 L-2,18 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M-12,0 L-18,-2 L-18,2 Z" fill="rgba(60,70,90,0.9)" />
            </g>
            {thrusting && (
              <g className="ee-drone-thruster">
                <ellipse cx="0" cy="20" rx="8" ry="16" fill="rgba(0,212,170,0.25)" filter="url(#thrusterGlow)" />
                <ellipse cx="0" cy="18" rx="5" ry="10" fill="rgba(0,212,170,0.4)" />
              </g>
            )}
          </g>

          {/* Back left propeller */}
          <g transform="translate(65,110)" filter={thrusting ? "url(#rotorBlur)" : undefined}>
            <circle cx="0" cy="0" r="16" fill="url(#propellerGradient)" stroke="var(--drone-border-bright)" strokeWidth="1" />
            <g style={{ animationDuration: propSpeed, transformOrigin: 'center' }} className="ee-drone-prop-rotor">
              <path d="M0,-12 L-2,-18 L2,-18 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M12,0 L18,2 L18,-2 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M0,12 L2,18 L-2,18 Z" fill="rgba(60,70,90,0.9)" />
              <path d="M-12,0 L-18,-2 L-18,2 Z" fill="rgba(60,70,90,0.9)" />
            </g>
            {thrusting && (
              <g className="ee-drone-thruster">
                <ellipse cx="0" cy="20" rx="8" ry="16" fill="rgba(0,212,170,0.25)" filter="url(#thrusterGlow)" />
                <ellipse cx="0" cy="18" rx="5" ry="10" fill="rgba(0,212,170,0.4)" />
              </g>
            )}
          </g>
        </g>

        {/* LED lights on arms */}
        <g className="ee-drone-leds">
          {/* Front right - green */}
          <circle cx="145" cy="45" r="3" fill="url(#ledGlowGreen)" filter="url(#softGlow)" />
          {/* Front left - red */}
          <circle cx="75" cy="45" r="3" fill="url(#ledGlowRed)" filter="url(#softGlow)" />
          {/* Back right - red */}
          <circle cx="145" cy="105" r="3" fill="url(#ledGlowRed)" filter="url(#softGlow)" />
          {/* Back left - green */}
          <circle cx="75" cy="105" r="3" fill="url(#ledGlowGreen)" filter="url(#softGlow)" />
        </g>

        {/* Main body - more rounded, DJI Phantom style */}
        <g className="ee-drone-body">
          <ellipse cx="110" cy="75" rx="40" ry="20" fill="url(#droneBodyGradient)" stroke="var(--drone-shell-highlight)" strokeWidth="1.5" />
          <ellipse cx="110" cy="70" rx="30" ry="15" fill="rgba(255,255,255,0.1)" stroke="var(--drone-border-bright)" strokeWidth="0.5" />
          
          {/* Camera gimbal */}
          <g className="ee-drone-camera" transform="translate(110, 90)">
            <rect x="-8" y="0" width="16" height="12" rx="3" fill="rgba(30,30,35,0.9)" stroke="var(--drone-border)" strokeWidth="1" />
            <circle cx="0" cy="6" r="4" fill="rgba(0,0,0,0.7)" stroke="var(--drone-accent)" strokeWidth="1" />
            <ellipse cx="0" cy="14" rx="6" ry="3" fill="rgba(50,50,60,0.8)" />
          </g>

          {/* Central core with glow */}
          <circle cx="110" cy="75" r="12" fill="url(#coreGlow)" filter="url(#softGlow)" />
          <circle cx="110" cy="75" r="5" className="ee-drone-core" />
        </g>

        {/* Landing gear */}
        <g className="ee-drone-landing-gear">
          <path d="M100,95 L95,105 H105 Z" fill="var(--drone-leg)" stroke="var(--drone-shell-highlight)" strokeWidth="1" />
          <path d="M120,95 L125,105 H115 Z" fill="var(--drone-leg)" stroke="var(--drone-shell-highlight)" strokeWidth="1" />
        </g>

        {/* Scanning beam */}
        {scanning && (
          <g className="ee-drone-scan">
            <path d="M110 95 L90 140 L130 140 Z" className="ee-drone-scan-beam" fill="rgba(0,212,170,0.15)" stroke="var(--drone-accent)" strokeWidth="1" />
            <circle cx="110" cy="95" r="3" fill="var(--drone-accent)" filter="url(#softGlow)" />
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
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.overflow = 'visible';
    document.body.appendChild(el);
    setTarget(el);

    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  return target;
}

export default function EasterEggDronePanel(): React.JSX.Element {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const portalTarget = useBodyPortal();
  const reducedMotion = usePrefersReducedMotion();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<DroneStatus>('docked');
  const [launched, setLaunched] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [autopilot, setAutopilot] = useState(true);
  const [currentTilt, setCurrentTilt] = useState<Vec2>({ x: 0, y: 0 });

  const [position, setPosition] = useState<Vec2>({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState<Vec2>({ x: 0, y: 0 });

  const positionRef = useRef<Vec2>({ x: 0, y: 0 });
  const velocityRef = useRef<Vec2>({ x: 0, y: 0 });
  const inputRef = useRef<Vec2>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const returnTargetRef = useRef<Vec2>({ x: 0, y: 0 });
  const snapshotTimeoutRef = useRef<number | null>(null);
  const tiltRef = useRef<Vec2>({ x: 0, y: 0 });
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const gallery = useMemo(() => DEFAULT_GALLERY, []);
  const availableNext = gallery.find((item) => !unlockedIds.includes(item.id));

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDockPosition = (): Vec2 | null => {
    if (!panelRef.current) return null;
    const rect = panelRef.current.getBoundingClientRect();
    const scroll = getScrollOffset();

    return {
      x: rect.left + rect.width * 0.5 - DRONE_SIZE * 0.5 + scroll.x,
      y: rect.top + rect.height * 0.32 + scroll.y,
    };
  };

  useEffect(() => {
    if (!mounted) return;

    const initial = getDockPosition();
    if (!initial) return;
    positionRef.current = initial;
    setPosition(initial);
  }, [mounted]);

  const updateReturnTarget = (): void => {
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    const scroll = getScrollOffset();
    
    returnTargetRef.current = {
      x: rect.left + rect.width * 0.5 - DRONE_SIZE * 0.5 + scroll.x,
      y: rect.top + rect.height * 0.26 + scroll.y,
    };
  };

  useEffect(() => {
    updateReturnTarget();

    const onResize = () => {
      updateReturnTarget();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', updateReturnTarget, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', updateReturnTarget);
    };
  }, []);

  useEffect(() => {
    // if (reducedMotion) return;

    const tick = (ts: number) => {
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      }

      const dt = Math.min((ts - lastTsRef.current) / 16.6667, 2.4);
      lastTsRef.current = ts;
      
      const doc = getDocumentDimensions();
      const docWidth = doc.width;
      const docHeight = doc.height;
      const droneWidth = DRONE_SIZE;
      const droneHeight = DRONE_SIZE;

      let x = positionRef.current.x;
      let y = positionRef.current.y;
      let vx = velocityRef.current.x;
      let vy = velocityRef.current.y;

      const input = inputRef.current;
      const maxSpeed = 7.2;
      const thrust = 0.52;
      const damping = autopilot ? 0.984 : 0.972;
      const bounce = 0.82;
      const inertia = 0.92;

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

        vx += dx * 0.009 * dt;
        vy += dy * 0.009 * dt;

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

      let bounced = false;
      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx) * bounce;
        bounced = true;
      } else if (x >= docWidth - droneWidth) {
        x = docWidth - droneWidth;
        vx = -Math.abs(vx) * bounce;
        bounced = true;
      }

      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy) * bounce;
        bounced = true;
      } else if (y >= docHeight - droneHeight) {
        y = docHeight - droneHeight;
        vy = -Math.abs(vy) * bounce;
        bounced = true;
      }

      let targetTiltX = tiltRef.current.x;
      let targetTiltY = tiltRef.current.y;

      if (status === 'airborne' || status === 'snapshot' || status === 'launching') {
        targetTiltX = clamp(vx * 0.35, -1.5, 1.5);
        targetTiltY = clamp(vy * 0.25, -1, 1);
      } else {
        targetTiltX = 0;
        targetTiltY = 0;
      }

      tiltRef.current.x = lerp(tiltRef.current.x, targetTiltX, inertia);
      tiltRef.current.y = lerp(tiltRef.current.y, targetTiltY, inertia);

      if (bounced) {
        tiltRef.current.x *= -0.6;
        tiltRef.current.y *= -0.4;
      }

      positionRef.current = { x, y };
      velocityRef.current = { x: vx, y: vy };

      setPosition({ x, y });
      setVelocity({ x: vx, y: vy });
      setCurrentTilt({ x: tiltRef.current.x, y: tiltRef.current.y });

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
    const updateKeyboardInput = () => {
      let nextX = 0;
      let nextY = 0;

      pressedKeysRef.current.forEach((key) => {
        const dir = KEY_DIRECTIONS[key];
        if (!dir) return;
        if (typeof dir.x === 'number') nextX += dir.x;
        if (typeof dir.y === 'number') nextY += dir.y;
      });

      inputRef.current = {
        x: clamp(nextX, -1, 1),
        y: clamp(nextY, -1, 1),
      };
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!launched) {
        return;
      }

      if (event.key === ' ') {
        event.preventDefault();
        handleSnapshot();
        return;
      }

      if (!KEY_DIRECTIONS[event.key]) return;

      event.preventDefault();
      pressedKeysRef.current.add(event.key);
      updateKeyboardInput();
      setAutopilot(false);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!KEY_DIRECTIONS[event.key]) return;

      event.preventDefault();
      pressedKeysRef.current.delete(event.key);
      updateKeyboardInput();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      pressedKeysRef.current.clear();
      inputRef.current = { x: 0, y: 0 };
    };
  }, [launched]);

  useEffect(() => {
    return () => {
      if (snapshotTimeoutRef.current) {
        window.clearTimeout(snapshotTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showGallery) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowGallery(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGallery]);

  const launchDrone = (): void => {
    if (launched || status === 'launching') return;
    updateReturnTarget();

    setLaunched(true);
    setStatus('launching');
    setAutopilot(true);
    pressedKeysRef.current.clear();
    inputRef.current = { x: 0, y: 0 };

    const dockPosition = getDockPosition();
    if (dockPosition) {
      positionRef.current = dockPosition;
      setPosition(dockPosition);
    }

    velocityRef.current = { x: 1.6, y: -2.2 };
    setVelocity(velocityRef.current);
  };

  const recallDrone = (): void => {
    if (!launched) return;
    updateReturnTarget();

    inputRef.current = { x: 0, y: 0 };
    pressedKeysRef.current.clear();
    setStatus('returning');
    setAutopilot(true);
  };

  const setDirectionalInput = (
    dir: Partial<Vec2>,
    active: boolean,
    event?: React.PointerEvent<HTMLButtonElement>,
  ): void => {
    event?.preventDefault();

    if (!launched) {
      return;
    }

    if (active) {
      event?.currentTarget.setPointerCapture(event.pointerId);
    }

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
              onPointerDown={(event) => setDirectionalInput({ y: -1 }, true, event)}
              onPointerUp={(event) => setDirectionalInput({ y: -1 }, false, event)}
              onPointerCancel={(event) => setDirectionalInput({ y: -1 }, false, event)}
              aria-label="Move up"
            >
              ↑
            </button>

            <button
              type="button"
              className="ee-drone-pad__btn ee-drone-pad__btn--left"
              onPointerDown={(event) => setDirectionalInput({ x: -1 }, true, event)}
              onPointerUp={(event) => setDirectionalInput({ x: -1 }, false, event)}
              onPointerCancel={(event) => setDirectionalInput({ x: -1 }, false, event)}
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
              onPointerDown={(event) => setDirectionalInput({ x: 1 }, true, event)}
              onPointerUp={(event) => setDirectionalInput({ x: 1 }, false, event)}
              onPointerCancel={(event) => setDirectionalInput({ x: 1 }, false, event)}
              aria-label="Move right"
            >
              →
            </button>

            <button
              type="button"
              className="ee-drone-pad__btn ee-drone-pad__btn--down"
              onPointerDown={(event) => setDirectionalInput({ y: 1 }, true, event)}
              onPointerUp={(event) => setDirectionalInput({ y: 1 }, false, event)}
              onPointerCancel={(event) => setDirectionalInput({ y: 1 }, false, event)}
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
               className={`ee-drone-overlay ${launched || status !== 'docked' ? '' : 'is-hidden'} ${
                 status === 'snapshot' ? 'is-flashing' : ''
               }`}
              aria-hidden="true"
            >
               <div
                 className={`ee-drone-overlay__drone is-${status}`}
                 style={{
                   '--x': `${position.x}px`,
                   '--y': `${position.y}px`,
                   transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                 } as React.CSSProperties}
               >
                <DroneSvg
                  thrusting={status === 'launching' || status === 'airborne' || status === 'returning'}
                  scanning={status === 'snapshot'}
                  tiltX={currentTilt.x}
                  tiltY={currentTilt.y}
                  speed={Math.hypot(velocity.x, velocity.y)}
                />
              </div>
            </div>

            {showGallery && (
              <div
                className="ee-drone-gallery-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Drone snapshots gallery"
                onClick={() => setShowGallery(false)}
              >
                <div className="ee-drone-gallery-modal__backdrop" />

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
