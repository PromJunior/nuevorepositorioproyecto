import React from 'react';
import { cn } from '../../../lib/utils';

/* Default card */
export const Card = ({ className, ...props }) => (
    <div
        className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
        {...props}
    />
);

/* Padding preset */
export const CardContent = ({ className, ...props }) => (
    <div className={cn('p-5', className)} {...props} />
);

/* Card header row */
export const CardHeader = ({ className, ...props }) => (
    <div className={cn('flex items-center justify-between border-b border-slate-100 px-5 py-4', className)} {...props} />
);

/* Card footer row */
export const CardFooter = ({ className, ...props }) => (
    <div className={cn('flex items-center gap-3 border-t border-slate-100 px-5 py-4', className)} {...props} />
);

/* Stat card — for KPI metrics */
export const StatCard = ({ label, value, sub, icon: Icon, trend, className, ...props }) => (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)} {...props}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">{value}</p>
                {sub && <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>}
                {trend !== undefined && (
                    <p className={cn(
                        'mt-1.5 text-xs font-bold',
                        trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-slate-400',
                    )}>
                        {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend)}%
                    </p>
                )}
            </div>
            {Icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={20} />
                </div>
            )}
        </div>
    </div>
);

/* Section card — for grouping content blocks */
export const SectionCard = ({ title, description, actions, children, className, ...props }) => (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...props}>
        {(title || actions) && (
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    {title && <h2 className="text-sm font-bold text-slate-900">{title}</h2>}
                    {description && <p className="mt-0.5 text-xs font-medium text-slate-500">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
        )}
        <div className="p-5">{children}</div>
    </div>
);
