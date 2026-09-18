import React from 'react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md', className = '' }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      // Bed & Ward statuses
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'OCCUPIED':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
      case 'RESERVED':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
      case 'CLEANING':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-600/20';
      case 'MAINTENANCE':
        return 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-600/20';

      // Appointment statuses
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
      case 'ACCEPTED':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20';
      case 'IN_PROGRESS':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/20';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-600/20';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';

      // Admission & User statuses
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'DISCHARGED':
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/20';
      case 'TRANSFERRED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-600/20';
      case 'INACTIVE':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';

      // Roles
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/20';
      case 'DOCTOR':
        return 'bg-brand-50 text-brand-700 border-brand-200 ring-brand-600/20';
      case 'PATIENT':
        return 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-600/20';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/20';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1 font-semibold',
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs tracking-wide uppercase ${getStyle()} ${sizeClasses[size]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          normalized === 'AVAILABLE' || normalized === 'COMPLETED' || normalized === 'ACTIVE'
            ? 'bg-emerald-500'
            : normalized === 'OCCUPIED' || normalized === 'REJECTED'
            ? 'bg-rose-500'
            : normalized === 'PENDING' || normalized === 'RESERVED'
            ? 'bg-amber-500'
            : normalized === 'IN_PROGRESS'
            ? 'bg-purple-500 animate-pulse'
            : 'bg-current opacity-60'
        }`}
      />
      {formatText(status)}
    </span>
  );
};
