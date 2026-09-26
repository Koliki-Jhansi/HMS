import React from 'react';
import { useReducedMotion } from 'framer-motion';

export type SceneType = 'lobby' | 'corridor' | 'ward' | 'room' | 'records' | 'lab' | 'pharmacy';

interface HospitalHeader3DProps {
  type?: SceneType;
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const HospitalHeader3D: React.FC<HospitalHeader3DProps> = ({
  type = 'lobby',
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/40 shadow-xl backdrop-blur-xl mb-8 text-white ${className}`}
    >
      <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-2.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              {badge}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              {subtitle}
            </p>
          )}
          {children}
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalHeader3D;
