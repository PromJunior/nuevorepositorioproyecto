import React from 'react';
import { cn } from '../../../lib/utils';

const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger:  'bg-red-50 text-red-700 border-red-200',
    info:    'bg-cyan-50 text-cyan-700 border-cyan-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const Badge = ({ variant = 'neutral', className, dot = false, children, ...props }) => (
    <span
        className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            variants[variant] ?? variants.neutral,
            className,
        )}
        {...props}
    >
        {dot && (
            <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                variant === 'success' && 'bg-emerald-500',
                variant === 'warning' && 'bg-amber-500',
                variant === 'danger'  && 'bg-red-500',
                variant === 'info'    && 'bg-cyan-500',
                variant === 'primary' && 'bg-blue-500',
                variant === 'neutral' && 'bg-slate-400',
            )} />
        )}
        {children}
    </span>
);
