import React from 'react';

const COLORS = {
    VIP: 'bg-amber-50 text-amber-700',
    Frecuente: 'bg-emerald-50 text-emerald-700',
    Ocasional: 'bg-blue-50 text-blue-700',
    Inactivo: 'bg-slate-100 text-slate-500',
    Nuevo: 'bg-indigo-50 text-indigo-700',
};

export const ClientSegmentBadge = ({ segment = 'Nuevo' }) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${COLORS[segment] || COLORS.Nuevo}`}>
        {segment}
    </span>
);
