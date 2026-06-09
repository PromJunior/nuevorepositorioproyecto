import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * FilterPanel — contenedor colapsable para filtros de búsqueda.
 *
 * @param {number}   activeCount   Número de filtros activos (muestra badge).
 * @param {Function} onClear       Callback para limpiar todos los filtros.
 * @param {boolean}  defaultOpen   Empieza abierto (default: false).
 * @param {string}   label         Texto del header (default: 'Filtros').
 * @param {ReactNode} children     Controles de filtro (Input, Select, etc.).
 * @param {string}   className     Clase extra para el contenedor.
 */
export const FilterPanel = ({
    activeCount = 0,
    onClear,
    defaultOpen = false,
    label = 'Filtros',
    children,
    className,
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
                className,
            )}
        >
            {/* ── Header ───────────────────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                aria-expanded={open}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50/60"
            >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <SlidersHorizontal size={14} className="text-slate-400" />
                    {label}
                    {activeCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                            {activeCount}
                        </span>
                    )}
                </span>

                <span className="flex items-center gap-2">
                    {activeCount > 0 && onClear && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    onClear();
                                }
                            }}
                            className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Limpiar filtros"
                        >
                            <X size={11} />
                            Limpiar
                        </span>
                    )}
                    <ChevronDown
                        size={15}
                        className={cn(
                            'text-slate-400 transition-transform duration-200',
                            open && 'rotate-180',
                        )}
                    />
                </span>
            </button>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            {open && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                    {children}
                </div>
            )}
        </div>
    );
};
