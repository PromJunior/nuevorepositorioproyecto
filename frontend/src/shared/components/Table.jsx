import React from 'react';
import { cn } from '../../lib/utils';
import { SkeletonRow } from './Loader';

/* ─── Contenedor ────────────────────────────────────────────────────────────── */
export const Table = ({ className, wrapperClassName, ...props }) => (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', wrapperClassName)}>
        <div className="overflow-x-auto">
            <table
                className={cn('w-full border-collapse text-left text-sm', className)}
                {...props}
            />
        </div>
    </div>
);

/* ─── Head ──────────────────────────────────────────────────────────────────── */
export const TableHead = ({ className, ...props }) => (
    <thead
        className={cn(
            'border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400',
            className,
        )}
        {...props}
    />
);

/* ─── Body ──────────────────────────────────────────────────────────────────── */
export const TableBody = ({ className, ...props }) => (
    <tbody
        className={cn('divide-y divide-slate-100 text-slate-700', className)}
        {...props}
    />
);

/* ─── Row ───────────────────────────────────────────────────────────────────── */
export const TableRow = ({ className, clickable = false, ...props }) => (
    <tr
        className={cn(
            'transition-colors duration-100',
            clickable
                ? 'cursor-pointer hover:bg-blue-50/40'
                : 'hover:bg-slate-50/70',
            className,
        )}
        {...props}
    />
);

/* ─── Cell (td / th) ────────────────────────────────────────────────────────── */
export const TableCell = ({ className, as: Component = 'td', ...props }) =>
    React.createElement(Component, {
        className: cn('p-4 align-middle', className),
        ...props,
    });

/* ─── Th helper con cursor clickable ────────────────────────────────────────── */
export const TableTh = ({ className, sortable = false, ...props }) => (
    <th
        className={cn(
            'p-4 align-middle text-[11px] font-bold uppercase tracking-wider text-slate-400',
            sortable && 'cursor-pointer select-none hover:text-slate-700',
            className,
        )}
        {...props}
    />
);

/* ─── Fila vacía (empty state dentro de la tabla) ───────────────────────────── */
export const TableEmpty = ({ colSpan = 6, message = 'Sin registros', className }) => (
    <tr>
        <td colSpan={colSpan} className={cn('py-14 text-center', className)}>
            <p className="text-sm font-medium italic text-slate-400">{message}</p>
        </td>
    </tr>
);

/* ─── Filas skeleton ────────────────────────────────────────────────────────── */
export const TableSkeletonRows = ({ rows = 5, cols = 6 }) => (
    <>
        {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
        ))}
    </>
);
