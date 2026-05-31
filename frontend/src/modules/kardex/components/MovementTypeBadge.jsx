import React from 'react';
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from 'lucide-react';

const TYPE_CONFIG = {
    ENTRADA: {
        label: 'Entrada',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        dot: 'bg-emerald-500',
        icon: ArrowUpRight,
    },
    SALIDA: {
        label: 'Salida',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
        dot: 'bg-rose-500',
        icon: ArrowDownLeft,
    },
};

const DEFAULT_CONFIG = {
    label: 'Ajuste',
    className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    dot: 'bg-indigo-500',
    icon: SlidersHorizontal,
};

/**
 * Pill de tipo de movimiento: ENTRADA (verde) | SALIDA (rojo) | AJUSTE (índigo)
 */
export const MovementTypeBadge = ({ type }) => {
    const config = TYPE_CONFIG[type?.toUpperCase()] ?? DEFAULT_CONFIG;
    const IconComp = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            <IconComp size={11} />
            {config.label}
        </span>
    );
};
