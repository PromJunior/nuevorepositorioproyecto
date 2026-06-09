import React from 'react';
import { cn } from '../../lib/utils';

export const PageHeader = ({ title, description, actions, eyebrow, className }) => (
    <header className={cn(
        'flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between',
        className,
    )}>
        <div className="min-w-0">
            {eyebrow && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">
                    {eyebrow}
                </span>
            )}
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            {description && (
                <p className="mt-1 text-sm font-medium text-slate-500 leading-relaxed">{description}</p>
            )}
        </div>
        {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
    </header>
);
