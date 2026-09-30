/**
 * Animated Educational Background
 * 
 * Subtle floating formulas, molecules, geometry, and coordinates
 * Rendered at low opacity (3-6%) to enhance educational aesthetics
 * without degrading readability, respecting prefers-reduced-motion.
 */

import React, { memo } from 'react';

export const BackgroundAnimation: React.FC = memo(() => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0 opacity-40 dark:opacity-30"
    >
      {/* Subtle Ambient Radial Gradients */}
      <div className="absolute -top-40 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-violet-500/10 dark:bg-violet-600/15 rounded-full blur-3xl" />

      {/* Floating Mathematical & Scientific Formula Tokens using clean UTF-8 math symbols */}
      <div className="absolute top-16 right-[10%] text-slate-400/40 dark:text-slate-500/30 text-2xl font-mono animate-float-slow">
        ∫₀^∞ e^(-x²) dx = √π / 2
      </div>

      <div className="absolute top-1/4 left-[8%] text-slate-400/40 dark:text-slate-500/30 text-xl font-mono animate-float-delayed">
        E = mc² · Δp · Δx ≥ ℏ/2
      </div>

      <div className="absolute top-1/2 right-[5%] text-slate-400/40 dark:text-slate-500/30 text-lg font-mono animate-float-reverse">
        F = m · a = dp/dt
      </div>

      <div className="absolute bottom-1/4 left-[12%] text-slate-400/40 dark:text-slate-500/30 text-xl font-mono animate-float-slow">
        ∑ 1/n² = π² / 6 (n=1..∞)
      </div>

      <div className="absolute bottom-12 right-[20%] text-slate-400/40 dark:text-slate-500/30 text-lg font-mono animate-float-delayed">
        lim (x→0) sin(x)/x = 1
      </div>

      {/* Floating Scientific Geometry Vectors */}
      <svg
        className="absolute top-44 left-1/3 w-32 h-32 text-indigo-400/20 dark:text-indigo-400/15 animate-spin-extremely-slow"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {/* Benzene Ring / Chemical Structure */}
        <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" />
        <circle cx="50" cy="50" r="22" strokeDasharray="4 4" />
      </svg>

      <svg
        className="absolute bottom-32 left-[4%] w-36 h-36 text-cyan-400/20 dark:text-cyan-400/15 animate-float-reverse"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        {/* Coordinate System & Parabola */}
        <line x1="20" y1="100" x2="100" y2="100" />
        <line x1="20" y1="100" x2="20" y2="20" />
        <path d="M 20 100 Q 60 20 100 90" strokeDasharray="3 3" />
      </svg>
    </div>
  );
});

BackgroundAnimation.displayName = 'BackgroundAnimation';
