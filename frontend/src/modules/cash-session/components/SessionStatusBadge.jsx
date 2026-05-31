import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Pill de estado: OPEN → verde, CLOSED → slate
 */
export const SessionStatusBadge = ({ status }) => {
    const isOpen = status === 'OPEN';
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                isOpen
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`}
            />
            {isOpen ? 'Abierta' : 'Cerrada'}
            {isOpen ? (
                <CheckCircle2 size={11} className="text-emerald-500" />
            ) : (
                <XCircle size={11} className="text-slate-400" />
            )}
        </span>
    );
};
