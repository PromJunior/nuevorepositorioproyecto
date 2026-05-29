import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Pill de estado del usuario: Activo (verde) | Inactivo (slate).
 */
export const UserStatusBadge = ({ isActive }) => {
    if (isActive) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <CheckCircle2 size={11} />
                Activo
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <XCircle size={11} />
            Inactivo
        </span>
    );
};
