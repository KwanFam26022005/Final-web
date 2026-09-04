import React from 'react';

export interface KnowledgeMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const KnowledgeMark: React.FC<KnowledgeMarkProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 select-none ${sizeMap[size]} ${className}`}
      role="img"
      aria-label="Final-web Knowledge Mark"
      data-testid="knowledge-mark"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Rounded Base Tile */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          className="fill-blue-900 dark:fill-blue-700 stroke-blue-950 dark:stroke-blue-600"
          strokeWidth="1.5"
        />

        {/* Abstract Open Book / Cat-Ear Geometry */}
        {/* Left Wing / Ear */}
        <path
          d="M6 21C6 14 11 9 16 11V23C11 21 7 21 6 21Z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Right Wing / Ear */}
        <path
          d="M26 21C26 14 21 9 16 11V23C21 21 25 21 26 21Z"
          fill="white"
          fillOpacity="0.85"
        />

        {/* Central Spine / Light Beacon */}
        <line
          x1="16"
          y1="8"
          x2="16"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="text-blue-950 dark:text-blue-900"
        />

        {/* Radiating Light Sparkle / CS Node Apex */}
        <path
          d="M16 5.5L17.2 7.5L19.5 8L17.5 9.2L16 11.5L14.5 9.2L12.5 8L14.8 7.5L16 5.5Z"
          fill="#F59E0B"
        />

        {/* Lotus Warm Accent Dot */}
        <circle cx="24.5" cy="7.5" r="2" className="fill-rose-500" />
      </svg>
    </div>
  );
};
