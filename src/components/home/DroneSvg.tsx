'use client';

interface DroneSvgProps {
  variant?: 'alpha' | 'beta';
  className?: string;
  size?: number;
}

export default function DroneSvg({ variant = 'alpha', className = '', size = 80 }: DroneSvgProps) {
  const bodyColor = '#3fb5a7';
  const accentColor = '#2a8a80';
  const ledColor = '#22c55e';
  const armColor = '#5c6570';

  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Arms */}
      <g stroke={armColor} strokeWidth="2">
        <line x1="30" y1="35" x2="10" y2="20" />
        <line x1="70" y1="35" x2="90" y2="20" />
        <line x1="30" y1="35" x2="10" y2="50" />
        <line x1="70" y1="35" x2="90" y2="50" />
      </g>

      {/* Motor housings */}
      <g fill={accentColor}>
        <circle cx="10" cy="20" r="8" />
        <circle cx="90" cy="20" r="8" />
        <circle cx="10" cy="50" r="8" />
        <circle cx="90" cy="50" r="8" />
      </g>

      {/* Propeller blur circles */}
      <g fill="none" stroke={bodyColor} strokeWidth="1" opacity="0.5">
        <ellipse cx="10" cy="20" rx="10" ry="3" className="prop-spin prop-1" />
        <ellipse cx="90" cy="20" rx="10" ry="3" className="prop-spin prop-2" />
        <ellipse cx="10" cy="50" rx="10" ry="3" className="prop-spin prop-3" />
        <ellipse cx="90" cy="50" rx="10" ry="3" className="prop-spin prop-4" />
      </g>

      {/* Body */}
      <rect
        x="25"
        y="25"
        width="50"
        height="25"
        rx="6"
        fill={bodyColor}
        stroke={accentColor}
        strokeWidth="1.5"
      />

      {/* Body details */}
      <rect x="30" y="30" width="15" height="8" rx="2" fill="#0a0e12" opacity="0.6" />
      <rect x="55" y="30" width="15" height="8" rx="2" fill="#0a0e12" opacity="0.6" />

      {/* LED indicators */}
      <circle cx="40" cy="42" r="2" fill={ledColor} className="led-blink" />
      <circle cx="50" cy="42" r="2" fill={variant === 'alpha' ? ledColor : '#d97706'} className="led-blink-2" />
      <circle cx="60" cy="42" r="2" fill="#ef4444" opacity="0.6" />

      {/* Sensor dome */}
      <ellipse cx="50" cy="28" rx="6" ry="3" fill="#0a0e12" opacity="0.8" />
      <ellipse cx="50" cy="28" rx="4" ry="2" fill={accentColor} opacity="0.4" />

      {/* Antenna */}
      <line x1="50" y1="22" x2="50" y2="16" stroke={armColor} strokeWidth="1" />
      <circle cx="50" cy="15" r="1.5" fill={ledColor} className="led-blink" />
    </svg>
  );
}
