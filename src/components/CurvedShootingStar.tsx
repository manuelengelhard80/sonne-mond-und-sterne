import React, { useId } from 'react';

export interface CurvedShootingStarProps {
  angle?: number; // rotation in degrees (must be positive 30-150 so tail points up into the sky)
  tailLength?: number; // length of curved tail in px
  curvature?: number; // gentle curve offset
  starRadius?: number; // size of star
  isHovered?: boolean;
  className?: string;
  glowIntensity?: 'normal' | 'bright';
}

/**
 * Renders an authentic, truly breathtaking shooting star:
 * - Head: Crisp, authentic 5-point star where ALL 5 points (Zacken) are clearly delineated with dark backing outline.
 * - Tail: Broad, organic diffusing light plume (like optical starlight / ionized meteor vapor), never a rigid linear line.
 *   Expands softly into deep space and always trails upwards into the celestial sky.
 */
export const CurvedShootingStar: React.FC<CurvedShootingStarProps> = ({
  angle = 45,
  tailLength = 36,
  curvature = 10,
  starRadius = 8.5,
  isHovered = false,
  className = '',
  glowIntensity = 'normal',
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const L = tailLength;
  const C = curvature;
  const R = starRadius;
  const r = R * 0.40; // Deep inner waist so each point (Zacke) is sharply defined

  // Tail geometry: expands naturally like real light (conic plume from 3.2px at star to 18px at back)
  const wStart = 3.2;
  const wMid = 9.5;
  const wEnd = 17.0;

  // Bounding box for SVG viewBox with generous margin for soft light diffusion
  const minX = -L - 25;
  const minY = Math.min(-R - 20, C - wEnd - 12);
  const maxY = Math.max(R + 20, C + wEnd + 12);
  const width = L + R + 45;
  const height = maxY - minY;

  // 5-point star coordinates with point 0 pointing forward (+X)
  const starPoints = [
    [R, 0],
    [r * Math.cos((36 * Math.PI) / 180), r * Math.sin((36 * Math.PI) / 180)],
    [R * Math.cos((72 * Math.PI) / 180), R * Math.sin((72 * Math.PI) / 180)],
    [r * Math.cos((108 * Math.PI) / 180), r * Math.sin((108 * Math.PI) / 180)],
    [R * Math.cos((144 * Math.PI) / 180), R * Math.sin((144 * Math.PI) / 180)],
    [-r, 0],
    [R * Math.cos((216 * Math.PI) / 180), R * Math.sin((216 * Math.PI) / 180)],
    [r * Math.cos((252 * Math.PI) / 180), r * Math.sin((252 * Math.PI) / 180)],
    [R * Math.cos((288 * Math.PI) / 180), R * Math.sin((288 * Math.PI) / 180)],
    [r * Math.cos((324 * Math.PI) / 180), r * Math.sin((324 * Math.PI) / 180)],
  ]
    .map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`)
    .join(' ');

  // Concentric inner brilliant star core (scale 0.55)
  const innerR = R * 0.55;
  const innerSmallR = r * 0.55;
  const innerStarPoints = [
    [innerR, 0],
    [innerSmallR * Math.cos((36 * Math.PI) / 180), innerSmallR * Math.sin((36 * Math.PI) / 180)],
    [innerR * Math.cos((72 * Math.PI) / 180), innerR * Math.sin((72 * Math.PI) / 180)],
    [innerSmallR * Math.cos((108 * Math.PI) / 180), innerSmallR * Math.sin((108 * Math.PI) / 180)],
    [innerR * Math.cos((144 * Math.PI) / 180), innerR * Math.sin((144 * Math.PI) / 180)],
    [-innerSmallR, 0],
    [innerR * Math.cos((216 * Math.PI) / 180), innerR * Math.sin((216 * Math.PI) / 180)],
    [innerSmallR * Math.cos((252 * Math.PI) / 180), innerSmallR * Math.sin((252 * Math.PI) / 180)],
    [innerR * Math.cos((288 * Math.PI) / 180), innerR * Math.sin((288 * Math.PI) / 180)],
    [innerSmallR * Math.cos((324 * Math.PI) / 180), innerSmallR * Math.sin((324 * Math.PI) / 180)],
  ]
    .map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`)
    .join(' ');

  // 1. Broad outer light plume (diffuse starlight envelope, wider, expanding like vapor & optical light)
  const tailBroadPlumePath = `
    M -1.5,${-wStart}
    C ${-L * 0.35},${C * 0.3 - wMid * 0.5} ${-L * 0.72},${C * 0.72 - wEnd * 0.5} ${-L},${C - wEnd * 0.5}
    Q ${-L - 5},${C} ${-L},${C + wEnd * 0.5}
    C ${-L * 0.72},${C * 0.72 + wEnd * 0.5} ${-L * 0.35},${C * 0.3 + wMid * 0.5} -1.5,${wStart}
    Z
  `;

  // 2. Focused luminous core plume (radiant golden body)
  const tailInnerPlumePath = `
    M -1.5,${-wStart * 0.6}
    C ${-L * 0.35},${C * 0.3 - wMid * 0.28} ${-L * 0.7},${C * 0.7 - wEnd * 0.26} ${-L * 0.88},${C * 0.88 - wEnd * 0.26}
    Q ${-L * 0.94},${C * 0.9} ${-L * 0.88},${C * 0.88 + wEnd * 0.26}
    C ${-L * 0.7},${C * 0.7 + wEnd * 0.26} ${-L * 0.35},${C * 0.3 + wMid * 0.28} -1.5,${wStart * 0.6}
    Z
  `;

  // 3. Hot central axis spine
  const tailSpinePath = `M -1.5,0 C ${-L * 0.32},${C * 0.35} ${-L * 0.65},${C * 0.75} ${-L * 0.82},${C * 0.88}`;

  return (
    <div
      className={`absolute top-0 left-0 pointer-events-none select-none transition-transform duration-300 ${className}`}
      style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 0',
      }}
    >
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        style={{
          position: 'absolute',
          left: `${minX}px`,
          top: `${minY}px`,
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'visible',
          filter: isHovered
            ? 'drop-shadow(0 0 10px rgba(250, 226, 152, 0.95)) drop-shadow(0 0 20px rgba(223, 186, 97, 0.6))'
            : glowIntensity === 'bright'
            ? 'drop-shadow(0 0 8px rgba(250, 226, 152, 0.9))'
            : 'drop-shadow(0 0 5px rgba(250, 226, 152, 0.7))',
        }}
      >
        <defs>
          {/* Gaussian blur filter for realistic optical starlight diffusion */}
          <filter id={`tail-diffuse-${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
          <filter id={`tail-soft-${uniqueId}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>

          {/* Broad outer light gradient (optical dispersion from white through gold to transparent) */}
          <linearGradient
            id={`tail-outer-grad-${uniqueId}`}
            gradientUnits="userSpaceOnUse"
            x1="-1.5"
            y1="0"
            x2={-L - 4}
            y2={C}
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="20%" stopColor="#fff8db" stopOpacity="0.65" />
            <stop offset="48%" stopColor="#fae298" stopOpacity="0.38" />
            <stop offset="78%" stopColor="#dfba61" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#dfba61" stopOpacity="0" />
          </linearGradient>

          {/* Inner luminous core gradient */}
          <linearGradient
            id={`tail-inner-grad-${uniqueId}`}
            gradientUnits="userSpaceOnUse"
            x1="-1.5"
            y1="0"
            x2={-L * 0.9}
            y2={C * 0.9}
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#fff5c5" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#fae298" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#dfba61" stopOpacity="0" />
          </linearGradient>

          {/* White-hot spine streak */}
          <linearGradient
            id={`tail-spine-grad-${uniqueId}`}
            gradientUnits="userSpaceOnUse"
            x1="-1.5"
            y1="0"
            x2={-L * 0.82}
            y2={C * 0.88}
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#fae298" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#dfba61" stopOpacity="0" />
          </linearGradient>

          {/* Golden star body fill */}
          <linearGradient id={`star-body-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fff8db" />
            <stop offset="70%" stopColor="#fae298" />
            <stop offset="100%" stopColor="#dfba61" />
          </linearGradient>
        </defs>

        {/* 1. SCHWEIF IM HINTERGRUND (Broad, organic diffusing light plume - behaves like real starlight) */}
        <g className="tail-background" opacity={isHovered ? 1 : 0.92}>
          
          {/* Atmospheric outer starlight halo (soft Gaussian blur, non-linear wide expansion) */}
          <path
            d={tailBroadPlumePath}
            fill={`url(#tail-outer-grad-${uniqueId})`}
            filter={`url(#tail-diffuse-${uniqueId})`}
            opacity="0.8"
          />

          {/* Secondary softer body plume */}
          <path
            d={tailBroadPlumePath}
            fill={`url(#tail-outer-grad-${uniqueId})`}
            filter={`url(#tail-soft-${uniqueId})`}
            opacity="0.9"
          />

          {/* Focused radiant inner plume core */}
          <path
            d={tailInnerPlumePath}
            fill={`url(#tail-inner-grad-${uniqueId})`}
          />

          {/* Hot white central spine streak */}
          <path
            d={tailSpinePath}
            fill="none"
            stroke={`url(#tail-spine-grad-${uniqueId})`}
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Delicate stardust sparks scattered organically along the expanding plume */}
          <circle cx={-L * 0.28} cy={C * 0.25 - 2.2} r="1.1" fill="#fffbe8" opacity="0.8" />
          <circle cx={-L * 0.52} cy={C * 0.52 + 3.2} r="1.3" fill="#fae298" opacity="0.65" />
          <circle cx={-L * 0.75} cy={C * 0.75 - 3.8} r="1.0" fill="#dfba61" opacity="0.45" />
          <circle cx={-L * 0.40} cy={C * 0.38 - 1.0} r="0.8" fill="#ffffff" opacity="0.85" />
          <circle cx={-L * 0.65} cy={C * 0.66 + 1.8} r="0.9" fill="#fae298" opacity="0.5" />
        </g>

        {/* 2. ECHTER FEINER STERN IM VORDERGRUND (All 5 points crisp and sharply defined) */}
        <g className="star-foreground">
          {/* Subtle celestial halo behind the star head */}
          <circle
            cx="0"
            cy="0"
            r={R * 1.35}
            fill="#fae298"
            opacity={isHovered ? '0.5' : '0.28'}
            style={{ filter: 'blur(2.2px)' }}
          />

          {/* 
            Dark contrast backing outline:
            Guarantees that ALL 5 points (alle Zacken) are crisp, distinct, and 
            never blend into the tail or background sky!
          */}
          <polygon
            points={starPoints}
            fill="none"
            stroke="#030813"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Primary Golden Star Body with all 5 points gleaming */}
          <polygon
            points={starPoints}
            fill={`url(#star-body-${uniqueId})`}
            stroke="#fffbe8"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />

          {/* Concentric Brilliant Inner Core */}
          <polygon
            points={innerStarPoints}
            fill="#ffffff"
            opacity="0.95"
            strokeLinejoin="round"
          />

          {/* Sparkling White Center Jewel */}
          <circle
            cx="0"
            cy="0"
            r={R * 0.22}
            fill="#ffffff"
            style={{ filter: 'drop-shadow(0 0 2px #ffffff)' }}
          />

          {/* Delicate 4-point micro crosshair twinkle */}
          <line
            x1={-R * 0.65}
            y1="0"
            x2={R * 0.65}
            y2="0"
            stroke="#ffffff"
            strokeWidth="0.6"
            opacity="0.9"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1={-R * 0.65}
            x2="0"
            y2={R * 0.65}
            stroke="#ffffff"
            strokeWidth="0.6"
            opacity="0.9"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
