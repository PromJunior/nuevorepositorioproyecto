import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Toast = ({ type = 'success', title, message, className }) => {
    const Icon = type === 'error' ? XCircle : CheckCircle;

    return (
        <div className={cn('flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg', type === 'error' ? 'border-red-200' : 'border-emerald-200', className)}>
            <Icon className={type === 'error' ? 'text-red-500' : 'text-emerald-500'} size={18} />
            <div>
                <h4 className="text-sm font-black text-slate-900">{title}</h4>
                {message && <p className="mt-0.5 text-xs font-medium text-slate-500">{message}</p>}
            </div>
        </div>
    );
};
