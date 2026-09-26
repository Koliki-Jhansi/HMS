import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-900/35 backdrop-blur-xl rounded-2xl border border-dashed border-white/20 text-white">
      <div className="p-4 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-white">{title}</h4>
      <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md transition-all hover:scale-105"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
