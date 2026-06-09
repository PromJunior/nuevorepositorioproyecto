import React from 'react';
import {
    AlertTriangle, CheckCircle2,
    Info, XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const VARIANTS = {
    success: {
        icon:       CheckCircle2,
        container:  'border-emerald-200 bg-emerald-50',
        icon_class: 'text-emerald-500',
        title_class:'text-emerald-900',
        msg_class:  'text-emerald-700',
    },
    error: {
        icon:       XCircle,
        container:  'border-red-200 bg-red-50',
        icon_class: 'text-red-500',
        title_class:'text-red-900',
        msg_class:  'text-red-600',
    },
    warning: {
        icon:       AlertTriangle,
        container:  'border-amber-200 bg-amber-50',
        icon_class: 'text-amber-500',
        title_class:'text-amber-900',
        msg_class:  'text-amber-700',
    },
    info: {
        icon:       Info,
        container:  'border-blue-200 bg-blue-50',
        icon_class: 'text-blue-500',
        title_class:'text-blue-900',
        msg_class:  'text-blue-700',
    },
};

/**
 * Toast estático — para mostrar en UI sin sistema de notificaciones.
 * Para toasts dinámicos usa `notify` de shared/utils/notify.js.
 */
export const Toast = ({ type = 'success', title, message, className }) => {
    const v = VARIANTS[type] || VARIANTS.success;
    const Icon = v.icon;

    return (
        <div className={cn(
            'flex items-start gap-3 rounded-xl border p-4 shadow-sm',
            v.container,
            className,
        )}>
            <Icon size={18} className={cn('mt-0.5 shrink-0', v.icon_class)} />
            <div className="min-w-0">
                {title && (
                    <h4 className={cn('text-sm font-bold leading-snug', v.title_class)}>
                        {title}
                    </h4>
                )}
                {message && (
                    <p className={cn('mt-0.5 text-xs font-medium leading-relaxed', v.msg_class)}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

/* ─── Inline alert (no es toast, es un bloque fijo en el layout) ────────────── */
export const InlineAlert = ({ type = 'info', title, children, className }) => {
    const v = VARIANTS[type] || VARIANTS.info;
    const Icon = v.icon;

    return (
        <div className={cn(
            'flex items-start gap-3 rounded-xl border px-4 py-3.5',
            v.container,
            className,
        )}>
            <Icon size={16} className={cn('mt-0.5 shrink-0', v.icon_class)} />
            <div className="min-w-0 text-sm">
                {title && (
                    <span className={cn('font-bold', v.title_class)}>{title} </span>
                )}
                <span className={cn('font-medium', v.msg_class)}>{children}</span>
            </div>
        </div>
    );
};
