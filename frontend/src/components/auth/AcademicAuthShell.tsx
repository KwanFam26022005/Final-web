import React from 'react';
import { Link } from 'react-router-dom';
import { WiseCat, type WiseCatState } from '../mascot/WiseCat';
import { KnowledgeMark } from '../brand/KnowledgeMark';
import { AcademicCampusScene } from '../illustrations/AcademicCampusScene';
import { KnowledgeParticles } from '../illustrations/KnowledgeParticles';

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-academic-light text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* -------------------------------------------------------------------- */}
      {/* Desktop Left Brand, Editorial Atmosphere & Illustration Canvas (56%) */}
      {/* -------------------------------------------------------------------- */}
      <aside className="hidden lg:flex lg:w-[56%] flex-col justify-between p-10 xl:p-14 border-r border-slate-200/70 dark:border-slate-800/70 relative overflow-hidden bg-white/30 dark:bg-slate-950/30">
        {/* Layered Ambient Illumination Glows */}
        <div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-blue-500/8 dark:bg-blue-500/12 blur-3xl pointer-events-none animate-ambient-glow"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-16 right-10 w-80 h-80 rounded-full bg-amber-400/5 dark:bg-amber-400/8 blur-3xl pointer-events-none animate-ambient-glow"
          style={{ animationDelay: '5s' }}
          aria-hidden="true"
        />

        {/* Floating Restrained Knowledge Particles */}
        <KnowledgeParticles />

        {/* Top Product Identity & Mark */}
        <div className="flex items-center gap-3.5 z-10 animate-entrance">
          <KnowledgeMark size="md" />
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block">
              Final-web
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Academic Light &bull; Living Knowledge
            </span>
          </div>
        </div>

        {/* Center Hero Visual Storytelling (Editorial + Wise Cat Hero) */}
        <div className="my-auto py-6 z-10 max-w-lg">
          {/* Editorial Hero Statement with Serif Typography */}
          <div className="animate-entrance stagger-1 mb-8">
            <h2 className="font-editorial text-3xl xl:text-4xl text-slate-900 dark:text-white font-normal tracking-tight leading-snug">
              Where ideas become <span className="italic font-medium text-blue-900 dark:text-blue-300">living knowledge</span>.
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              A focused student sanctuary for deep reflection, structured research, and lasting personal notes.
            </p>
          </div>

          {/* Wise Cat Hero Mascot (240px - 256px Desktop Scale) */}
          <div className="flex items-center justify-center my-6 animate-entrance stagger-2">
            <div className="animate-mascot-float">
              <WiseCat state={mascotState} size="hero" />
            </div>
          </div>

          {/* Subtle Concept Chips */}
          <div className="flex items-center justify-center gap-3 animate-entrance stagger-3 mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              Think clearly
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              Write freely
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              Build knowledge
            </span>
          </div>
        </div>

        {/* Lower Atmospheric Campus Line Art */}
        <div className="z-10 animate-entrance stagger-1 mt-auto">
          <AcademicCampusScene />
          {/* Subtle Student Attribution Statement */}
          <div className="text-[11px] text-slate-500 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 pt-3 text-center">
            Student-crafted personal workspace &bull; Academic Light Edition &bull; Independent project
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------------------- */}
      {/* Right Task & Form Surface Column (44% Desktop / 100% Mobile)         */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1 lg:w-[44%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 relative">
        {/* Mobile Header (Shown on < lg only) */}
        <div className="lg:hidden w-full max-w-md mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <KnowledgeMark size="sm" />
            <span className="font-semibold text-slate-900 dark:text-white text-sm">
              Final-web
            </span>
          </Link>
          <WiseCat state={mascotState} size="sm" />
        </div>

        {/* Form Container Card with Signature Staged Entrance */}
        <div className="w-full max-w-md animate-entrance stagger-4">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          {/* Form Surface V2 (Hairline border, subtle elevation, top signature highlight) */}
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-7 sm:p-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] relative before:absolute before:top-0 before:left-8 before:right-8 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-blue-500/40 before:to-transparent">
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
