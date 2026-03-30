'use client';

import type { JointState } from '../../hooks/useRobotArm';

interface RobotArmSvgProps {
  joints: JointState;
  isActive?: boolean;
  ledState?: 'off' | 'on' | 'blink';
}

export default function RobotArmSvg({ joints, isActive = false, ledState = 'on' }: RobotArmSvgProps) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const j1Rad = toRad(joints.j1);
  const j2Rad = toRad(joints.j2 + 45);
  const j3Rad = toRad(joints.j3 + 45);
  
  const baseY = 140;
  const seg1Len = 50;
  const seg2Len = 40;
  const seg3Len = 30;
  
  const elbow1X = 80 + seg1Len * Math.sin(j1Rad);
  const elbow1Y = baseY - seg1Len * Math.cos(j1Rad);
  
  const elbow2X = elbow1X + seg2Len * Math.sin(j1Rad + j2Rad);
  const elbow2Y = elbow1Y - seg2Len * Math.cos(j1Rad + j2Rad);
  
  const tipX = elbow2X + seg3Len * Math.sin(j1Rad + j2Rad + j3Rad);
  const tipY = elbow2Y - seg3Len * Math.cos(j1Rad + j2Rad + j3Rad);

  const ledColor = isActive ? '#3fb950' : '#4a524d';
  const armColor = '#5a6560';
  const jointColor = '#3fb9a7';
  const baseColor = '#3a4540';

  return (
    <svg viewBox="0 0 160 160" className="robot-arm-svg">
      <defs>
        <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={armColor} />
          <stop offset="50%" stopColor="#6a7570" />
          <stop offset="100%" stopColor={armColor} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect x="60" y={baseY - 10} width="40" height="20" rx="3" fill={baseColor} />
      <rect x="70" y={baseY + 5} width="20" height="15" rx="2" fill="#2a3530" />
      
      <circle 
        cx="80" 
        cy={baseY} 
        r="8" 
        fill={jointColor}
        filter={isActive ? "url(#glow)" : undefined}
      />
      <text x="80" y={baseY + 20} textAnchor="middle" fontSize="6" fill="#7a8580">J1</text>

      <line 
        x1="80" y1={baseY} 
        x2={elbow1X} y2={elbow1Y} 
        stroke="url(#armGrad)" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      <circle 
        cx={elbow1X} 
        cy={elbow1Y} 
        r="6" 
        fill={jointColor}
        filter={isActive ? "url(#glow)" : undefined}
      />
      <text x={elbow1X + 10} y={elbow1Y - 5} fontSize="6" fill="#7a8580">J2</text>

      <line 
        x1={elbow1X} y1={elbow1Y} 
        x2={elbow2X} y2={elbow2Y} 
        stroke="url(#armGrad)" 
        strokeWidth="5" 
        strokeLinecap="round" 
      />
      <circle 
        cx={elbow2X} 
        cy={elbow2Y} 
        r="5" 
        fill={jointColor}
        filter={isActive ? "url(#glow)" : undefined}
      />
      <text x={elbow2X + 8} y={elbow2Y - 3} fontSize="6" fill="#7a8580">J3</text>

      <line 
        x1={elbow2X} y1={elbow2Y} 
        x2={tipX} y2={tipY} 
        stroke="url(#armGrad)" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />

      <circle 
        cx={tipX} 
        cy={tipY} 
        r="4" 
        fill={isActive ? '#3fb950' : '#4a524d'}
        filter={isActive ? "url(#glow)" : undefined}
        className={ledState === 'blink' ? 'led-blink' : ''}
      />

      <circle cx="130" cy="25" r="4" fill={ledColor} className={ledState === 'blink' ? 'led-blink' : ''} />
      <circle cx="140" cy="25" r="4" fill={isActive ? '#3fb950' : '#4a524d'} />
      <circle cx="135" cy="35" r="3" fill="#2a3530" />

      <rect x="10" y="10" width="50" height="8" rx="2" fill="#2a3530" />
      <rect x="12" y="12" width="30" height="4" rx="1" fill={jointColor} opacity="0.5" />
      
      <rect x="10" y="145" width="60" height="10" rx="2" fill="#2a3530" />
      <line x1="15" y1="150" x2="65" y2="150" stroke="#1a2520" strokeWidth="1" strokeDasharray="2,2" />
    </svg>
  );
}
