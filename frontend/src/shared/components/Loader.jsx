import React from 'react';
import { cn } from '../../lib/utils';

/* ── Spinner centrado ───────────────────────────────────────────────────────── */
export const Loader = ({ label = 'Cargando...', className }) => (
    <div className={cn('flex min-h-40 flex-col items-center justify-center gap-3 text-slate-400', className)}>
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        <span className="text-sm font-medium text-slate-400">{label}</span>
    </div>
);

/* ── Bloque genérico ────────────────────────────────────────────────────────── */
export const SkeletonBlock = ({ className }) => (
    <div className={cn('animate-pulse rounded-xl bg-slate-200/70', className)} />
);

/* ── Línea de texto ─────────────────────────────────────────────────────────── */
export const SkeletonText = ({ lines = 1, className }) => (
    <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className="h-3.5 animate-pulse rounded-full bg-slate-200/80"
                style={{ width: i === lines - 1 && lines > 1 ? '65%' : '100%' }}
            />
        ))}
    </div>
);

/* ── Fila de tabla ──────────────────────────────────────────────────────────── */
export const SkeletonRow = ({ cols = 5, className }) => (
    <tr className={cn('border-b border-slate-100', className)}>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="p-4">
                <div
                    className="h-3.5 animate-pulse rounded-full bg-slate-200/80"
                    style={{ width: `${60 + ((i * 17) % 35)}%` }}
                />
            </td>
        ))}
    </tr>
);

/* ── Tabla completa con skeletons ───────────────────────────────────────────── */
export const SkeletonTable = ({ rows = 6, cols = 5, className }) => (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
        {/* Fake header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200/80" />
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                    {Array.from({ length: cols }).map((_, i) => (
                        <th key={i} className="p-4">
                            <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200/60" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonRow key={i} cols={cols} />
                ))}
            </tbody>
        </table>
    </div>
);

/* ── Card stat skeleton ─────────────────────────────────────────────────────── */
export const SkeletonStatCard = ({ className }) => (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5', className)}>
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2.5">
                <div className="h-2.5 w-24 animate-pulse rounded-full bg-slate-200/80" />
                <div className="h-7 w-32 animate-pulse rounded-lg bg-slate-200/80" />
                <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-200/60" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
        </div>
    </div>
);

/* ── Lista de items ─────────────────────────────────────────────────────────── */
export const SkeletonList = ({ rows = 5, className }) => (
    <div className={cn('space-y-3', className)}>
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200/80" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-200/80" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-slate-200/60" />
                </div>
                <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200/60" />
            </div>
        ))}
    </div>
);

/* ── Form field skeleton ────────────────────────────────────────────────────── */
export const SkeletonField = ({ className }) => (
    <div className={cn('space-y-1.5', className)}>
        <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200/80" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200/60" />
    </div>
);
