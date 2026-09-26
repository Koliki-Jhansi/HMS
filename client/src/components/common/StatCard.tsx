import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'brand' | 'teal' | 'emerald' | 'amber' | 'rose' | 'purple';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'brand',
  trend,
}) => {
  const colorMap = {
    brand: {
      bg: 'bg-sky-500/20 text-sky-400 border border-sky-400/30',
      border: 'border-sky-500/30',
      gradient: 'from-sky-500/15 to-transparent',
      textAccent: 'text-sky-300',
    },
    teal: {
      bg: 'bg-teal-500/20 text-teal-400 border border-teal-400/30',
      border: 'border-teal-500/30',
      gradient: 'from-teal-500/15 to-transparent',
      textAccent: 'text-teal-300',
    },
    emerald: {
      bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30',
      border: 'border-emerald-500/30',
      gradient: 'from-emerald-500/15 to-transparent',
      textAccent: 'text-emerald-300',
    },
    amber: {
      bg: 'bg-amber-500/20 text-amber-400 border border-amber-400/30',
      border: 'border-amber-500/30',
      gradient: 'from-amber-500/15 to-transparent',
      textAccent: 'text-amber-300',
    },
    rose: {
      bg: 'bg-rose-500/20 text-rose-400 border border-rose-400/30',
      border: 'border-rose-500/30',
      gradient: 'from-rose-500/15 to-transparent',
      textAccent: 'text-rose-300',
    },
    purple: {
      bg: 'bg-purple-500/20 text-purple-400 border border-purple-400/30',
      border: 'border-purple-500/30',
      gradient: 'from-purple-500/15 to-transparent',
      textAccent: 'text-purple-300',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-slate-900/45 backdrop-blur-xl p-5 shadow-lg transition-all duration-200 hover:border-white/30 text-white ${scheme.border}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${scheme.gradient} rounded-bl-full pointer-events-none`} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${scheme.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{value}</div>
        {subtitle && <p className="mt-1 text-xs text-slate-300 font-medium">{subtitle}</p>}
        {trend && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
            <span className={trend.isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
