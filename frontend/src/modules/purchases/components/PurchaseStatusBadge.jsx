import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
    BORRADOR: {
        label: 'Borrador',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        dot: 'bg-amber-500',
        icon: Clock,
    },
    RECIBIDA: {
        label: 'Recibida',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    CANCELADA: {
        label: 'Cancelada',
        className: 'border-slate-200 bg-slate-50 text-slate-500',
        dot: 'bg-slate-400',
        icon: XCircle,
    },
};

const DEFAULT = {
    label: 'Desconocido',
    className: 'border-slate-200 bg-slate-50 text-slate-500',
    dot: 'bg-slate-400',
    icon: Clock,
};

export const PurchaseStatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status?.toUpperCase()] ?? DEFAULT;
    const IconComp = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            <IconComp size={11} />
            {config.label}
        </span>
    );
};
