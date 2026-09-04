import React from 'react';

export const KnowledgeParticles: React.FC = () => {
  return (
    <div
      className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
      role="presentation"
      data-testid="knowledge-particles"
    >
      {/* Particle 1: Golden Knowledge Sparkle */}
      <div
        className="absolute top-[18%] left-[12%] animate-particle-float-1"
        style={{ animationDuration: '14s' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z" fill="#F59E0B" fillOpacity="0.6" />
        </svg>
      </div>

      {/* Particle 2: Academic Blue Node */}
      <div
        className="absolute top-[32%] right-[16%] animate-particle-float-2"
        style={{ animationDuration: '18s', animationDelay: '2s' }}
      >
        <div className="w-2 h-2 rounded-full bg-blue-500/40 dark:bg-blue-400/40" />
      </div>

      {/* Particle 3: Lotus Crimson Spark */}
      <div
        className="absolute bottom-[38%] left-[22%] animate-particle-float-1"
        style={{ animationDuration: '16s', animationDelay: '4s' }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50 dark:bg-rose-400/50" />
      </div>

      {/* Particle 4: Subtle Coordinate Diamond */}
      <div
        className="absolute top-[65%] right-[24%] animate-particle-float-2"
        style={{ animationDuration: '20s', animationDelay: '1s' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="5" y="0.5" width="6" height="6" transform="rotate(45 5 0.5)" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.4" />
        </svg>
      </div>

      {/* Particle 5: Soft Ivory Ambience Node */}
      <div
        className="absolute top-[24%] left-[45%] animate-particle-float-1"
        style={{ animationDuration: '15s', animationDelay: '3s' }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/30 dark:bg-amber-300/30" />
      </div>

      {/* Particle 6: Tiny Page Corner Fragment */}
      <div
        className="absolute bottom-[28%] right-[12%] animate-particle-float-2"
        style={{ animationDuration: '17s', animationDelay: '5s' }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <polygon points="0,0 8,0 0,8" fill="#2563EB" fillOpacity="0.25" />
        </svg>
      </div>
    </div>
  );
};
