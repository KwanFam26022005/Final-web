import React from 'react';

export type WiseCatState = 'welcome' | 'reading' | 'loading' | 'success' | 'verification' | 'settings';

export interface WiseCatProps {
  state?: WiseCatState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
}

export const WiseCat: React.FC<WiseCatProps> = ({
  state = 'welcome',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-16 h-16',
    lg: 'w-28 h-28',
    xl: 'w-44 h-44',
    hero: 'w-56 h-56 sm:w-64 sm:h-64',
  };

  const stateLabels: Record<WiseCatState, string> = {
    welcome: 'Wise Cat academic companion greeting student warmly',
    reading: 'Wise Cat focused on academic reading and research',
    loading: 'Wise Cat thinking and processing knowledge',
    success: 'Wise Cat celebrating successful action',
    verification: 'Wise Cat holding verification credential',
    settings: 'Wise Cat organizing system preferences',
  };

  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 select-none ${sizeMap[size]} ${className}`}
      role="img"
      aria-label={stateLabels[state]}
      data-testid={`wise-cat-${state}`}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-200"
      >
        {/* Soft Ambient Light Aura behind Cat */}
        <circle
          cx="60"
          cy="60"
          r="54"
          className="fill-blue-50/80 dark:fill-blue-950/40"
        />

        {/* Outer Academic Knowledge Orbit / CS Node Motif */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          className="text-blue-200 dark:text-blue-800"
        />

        {/* Cat Ears (Grouped for subtle occasional ear perk) */}
        <g className="animate-cat-ear-perk origin-[60px_44px]">
          {/* Left Ear */}
          <path
            d="M32 44L22 18C28 17 38 23 44 32"
            className="fill-slate-800 dark:fill-slate-100 stroke-slate-900 dark:stroke-white"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Left Inner Ear (Lotus Accent) */}
          <path
            d="M30 38L25 24C29 23 34 26 38 31"
            className="fill-rose-400 dark:fill-rose-500"
          />

          {/* Right Ear */}
          <path
            d="M88 44L98 18C92 17 82 23 76 32"
            className="fill-slate-800 dark:fill-slate-100 stroke-slate-900 dark:stroke-white"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Right Inner Ear (Lotus Accent) */}
          <path
            d="M90 38L95 24C91 23 86 26 82 31"
            className="fill-rose-400 dark:fill-rose-500"
          />
        </g>

        {/* Cat Head Body Contour */}
        <path
          d="M26 62C26 44 41 34 60 34C79 34 94 44 94 62C94 80 80 92 60 92C40 92 26 80 26 62Z"
          className="fill-slate-800 dark:fill-slate-200 stroke-slate-900 dark:stroke-white"
          strokeWidth="2.5"
        />

        {/* Mortarboard Academic Cap */}
        <g className="transition-transform duration-200">
          <polygon
            points="60,20 86,28 60,36 34,28"
            className="fill-blue-900 dark:fill-blue-700 stroke-blue-950 dark:stroke-blue-400"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <polygon
            points="60,36 60,40 52,38 52,34"
            className="fill-blue-950 dark:fill-blue-800"
          />
          {/* Tassel with subtle occasional sway */}
          <g className="animate-cat-tassel origin-[60px_28px]">
            <path
              d="M60 28C70 28 80 34 82 40"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="82" cy="42" r="2.5" fill="#F59E0B" />
          </g>
        </g>

        {/* Academic Spectacles / Intelligent Glasses */}
        <g className="text-blue-900 dark:text-slate-900">
          {/* Left Lens */}
          <rect
            x="36"
            y="54"
            width="18"
            height="15"
            rx="4"
            className="fill-white/90 dark:fill-slate-100/90 stroke-blue-950 dark:stroke-slate-950"
            strokeWidth="2"
          />
          {/* Right Lens */}
          <rect
            x="66"
            y="54"
            width="18"
            height="15"
            rx="4"
            className="fill-white/90 dark:fill-slate-100/90 stroke-blue-950 dark:stroke-slate-950"
            strokeWidth="2"
          />
          {/* Bridge */}
          <path
            d="M54 61H66"
            className="stroke-blue-950 dark:stroke-slate-950"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Eyes (Per State with subtle natural blink animation) */}
        {state === 'reading' ? (
          // Reading eyes looking down at book
          <g className="stroke-slate-900 dark:stroke-slate-950 animate-cat-blink origin-[60px_62px]" strokeWidth="2" strokeLinecap="round">
            <path d="M41 62C43 64 47 64 49 62" />
            <path d="M71 62C73 64 77 64 79 62" />
          </g>
        ) : state === 'success' ? (
          // Cheerful happy curved eyes
          <g className="stroke-slate-900 dark:stroke-slate-950" strokeWidth="2.5" strokeLinecap="round">
            <path d="M40 61C43 58 47 58 50 61" />
            <path d="M70 61C73 58 77 58 80 61" />
          </g>
        ) : state === 'loading' ? (
          // Curious thinking eyes
          <g className="fill-slate-900 dark:fill-slate-950 animate-cat-blink origin-[60px_61px]">
            <circle cx="45" cy="61" r="3" />
            <circle cx="75" cy="61" r="3" />
          </g>
        ) : (
          // Standard alert, friendly student eyes with occasional natural blink
          <g className="fill-slate-900 dark:fill-slate-950 animate-cat-blink origin-[60px_61.5px]">
            <circle cx="45" cy="61.5" r="3" />
            <circle cx="75" cy="61.5" r="3" />
            {/* Catchlight */}
            <circle cx="46.5" cy="60" r="1" fill="white" />
            <circle cx="76.5" cy="60" r="1" fill="white" />
          </g>
        )}

        {/* Nose & Mouth */}
        <polygon
          points="60,68 57,65 63,65"
          className="fill-rose-400 dark:fill-rose-500"
        />
        <path
          d="M56 71C58 73 60 73 60 70C60 73 62 73 64 71"
          className="stroke-slate-900 dark:stroke-slate-950"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Minimal Geometric Whiskers */}
        <g className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" strokeLinecap="round">
          <line x1="22" y1="64" x2="33" y2="66" />
          <line x1="21" y1="70" x2="32" y2="70" />
          <line x1="87" y1="66" x2="98" y2="64" />
          <line x1="88" y1="70" x2="99" y2="70" />
        </g>

        {/* State-Specific Accessories / Props with subtle gentle breathing motion */}
        {state === 'reading' && (
          // Open Academic Book with gentle breathing tilt
          <g className="animate-cat-prop-tilt origin-[60px_98px]">
            <path
              d="M42 94L58 88V104L42 108V94Z"
              className="fill-blue-100 dark:fill-blue-900 stroke-blue-900 dark:stroke-blue-400"
              strokeWidth="1.5"
            />
            <path
              d="M78 94L62 88V104L78 108V94Z"
              className="fill-blue-50 dark:fill-blue-950 stroke-blue-900 dark:stroke-blue-400"
              strokeWidth="1.5"
            />
            <line x1="46" y1="96" x2="54" y2="93" stroke="#2563EB" strokeWidth="1" strokeLinecap="round" />
            <line x1="46" y1="100" x2="54" y2="97" stroke="#2563EB" strokeWidth="1" strokeLinecap="round" />
            <line x1="66" y1="93" x2="74" y2="96" stroke="#2563EB" strokeWidth="1" strokeLinecap="round" />
            <line x1="66" y1="97" x2="74" y2="100" stroke="#2563EB" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {state === 'loading' && (
          // Floating CS Knowledge Nodes / Orbiting particles
          <g className="animate-spin origin-[60px_98px]" style={{ animationDuration: '3s' }}>
            <circle cx="60" cy="98" r="6" className="fill-blue-600 dark:fill-blue-400" />
            <circle cx="48" cy="98" r="3" className="fill-blue-400 dark:fill-blue-300" />
            <circle cx="72" cy="98" r="3" className="fill-rose-400 dark:fill-rose-400" />
          </g>
        )}

        {state === 'success' && (
          // Academic Star / Sparkle
          <g className="animate-cat-sparkle origin-[60px_95px]">
            <path
              d="M60 88L62 93L67 95L62 97L60 102L58 97L53 95L58 93L60 88Z"
              fill="#F59E0B"
            />
            <circle cx="78" cy="46" r="2.5" fill="#E11D48" />
            <circle cx="40" cy="44" r="2" fill="#2563EB" />
          </g>
        )}

        {state === 'verification' && (
          // Academic Verification Badge / Envelope
          <g className="animate-cat-prop-tilt origin-[60px_96px]">
            <rect
              x="46"
              y="86"
              width="28"
              height="20"
              rx="3"
              className="fill-amber-100 dark:fill-amber-900/60 stroke-amber-600 dark:stroke-amber-400"
              strokeWidth="1.5"
            />
            <path
              d="M46 88L60 98L74 88"
              className="stroke-amber-600 dark:stroke-amber-400"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="60" cy="96" r="3" fill="#E11D48" />
          </g>
        )}

        {state === 'settings' && (
          // Engineering Compass / Drafting Gear Badge
          <g className="animate-cat-prop-tilt origin-[60px_96px]">
            <circle
              cx="60"
              cy="96"
              r="9"
              className="fill-slate-100 dark:fill-slate-800 stroke-slate-600 dark:stroke-slate-300"
              strokeWidth="1.5"
            />
            <circle cx="60" cy="96" r="3" fill="#2563EB" />
            <line x1="60" y1="84" x2="60" y2="87" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
            <line x1="60" y1="105" x2="60" y2="108" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
            <line x1="48" y1="96" x2="51" y2="96" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
            <line x1="69" y1="96" x2="72" y2="96" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {state === 'welcome' && (
          // Academic Notebook / Student ID Badge
          <g className="animate-cat-prop-tilt origin-[60px_97px]">
            <rect
              x="48"
              y="88"
              width="24"
              height="18"
              rx="2"
              className="fill-blue-600 dark:fill-blue-500 stroke-blue-700 dark:stroke-blue-400"
              strokeWidth="1.5"
            />
            <circle cx="54" cy="95" r="2" fill="white" />
            <line x1="58" y1="94" x2="68" y2="94" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="58" y1="98" x2="66" y2="98" stroke="white" strokeWidth="1" strokeLinecap="round" />
            {/* Small Lotus Corner Accent */}
            <circle cx="70" cy="90" r="1.5" fill="#F43F5E" />
          </g>
        )}
      </svg>
    </div>
  );
};
