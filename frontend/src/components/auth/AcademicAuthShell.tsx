import React from 'react';
import { Link } from 'react-router-dom';
import { WiseCat, type WiseCatState } from '../mascot/WiseCat';

export interface AcademicAuthShellProps {
  title: string;
  subtitle: string;
  mascotState?: WiseCatState;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AcademicAuthShell: React.FC<AcademicAuthShellProps> = ({
  title,
  subtitle,
  mascotState = 'welcome',
  children,
  footer,
}) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-academic-light text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900">
      {/* -------------------------------------------------------------------- */}
      {/* Desktop Left Brand & Atmosphere Column                               */}
      {/* -------------------------------------------------------------------- */}
      <aside className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-10 xl:p-14 border-r border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px]">
        {/* Ambient Radial Illumination */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-3xl pointer-events-none animate-ambient-glow"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-rose-400/10 dark:bg-rose-600/10 blur-3xl pointer-events-none animate-ambient-glow"
          style={{ animationDelay: '4s' }}
          aria-hidden="true"
        />

        {/* Top Brand Identity */}
        <div className="flex items-center gap-3.5 z-10 animate-entrance">
          <div className="w-10 h-10 rounded-xl bg-blue-900 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm relative">
            N
            {/* Subtle TDTU-inspired lotus-pink accent dot */}
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900"
              title="Academic Light Accent"
            />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block">
              Final-web
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Academic Light &bull; Living Knowledge
            </span>
          </div>
        </div>

        {/* Center Mascot & Knowledge Philosophy */}
        <div className="my-auto py-10 z-10 max-w-md animate-entrance stagger-1">
          <div className="mb-6 flex items-center gap-4">
            <div className="animate-mascot-float">
              <WiseCat state={mascotState} size="lg" />
            </div>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 mb-1.5">
                Student Productivity Shell
              </span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Quiet Mind. Sharp Notes.
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            A high-performance workspace crafted for structured reflection, peer study, and grounded research without cognitive clutter.
          </p>

          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-2.5">
              <span className="text-blue-600 dark:text-blue-400 font-bold">&#10022;</span>
              <span><strong>Living Knowledge:</strong> Fast notes, disciplined organization, and distraction-free writing.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-blue-600 dark:text-blue-400 font-bold">&#10022;</span>
              <span><strong>Peer Study:</strong> First-party session security with granular collaboration boundaries.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-rose-600 dark:text-rose-400 font-bold">&#10022;</span>
              <span><strong>Academic Integrity:</strong> Built for personal ownership, rigorous accessibility, and privacy.</span>
            </li>
          </ul>
        </div>

        {/* Bottom Homage & Independence Statement */}
        <div className="z-10 text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 pt-4">
          <p>
            TDTU student-inspired academic theme &bull; Independent project workspace &bull; Not affiliated with official university portals.
          </p>
        </div>
      </aside>

      {/* -------------------------------------------------------------------- */}
      {/* Right Form Column (Full width on Mobile / Split on Desktop)          */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 relative">
        {/* Mobile Header (Hidden on lg+) */}
        <div className="lg:hidden w-full max-w-md mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-sm relative">
              N
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white text-sm">
              Final-web
            </span>
          </Link>
          <WiseCat state={mascotState} size="sm" />
        </div>

        {/* Form Container Card with Staged Entrance Animation */}
        <div className="w-full max-w-md animate-entrance stagger-2">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          {/* Form Surface */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            {children}
          </div>

          {/* Optional Footer Link / Switcher */}
          {footer && (
            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
