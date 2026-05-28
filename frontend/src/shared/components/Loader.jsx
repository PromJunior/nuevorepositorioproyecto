import React from 'react';
import { cn } from '../../lib/utils';

export const Loader = ({ label = 'Cargando...', className }) => (
    <div className={cn('flex min-h-40 flex-col items-center justify-center gap-3 text-slate-400', className)}>
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <span className="text-sm font-semibold">{label}</span>
    </div>
);

export const SkeletonBlock = ({ className }) => (
    <div className={cn('animate-pulse rounded-xl bg-slate-200/70', className)} />
);
