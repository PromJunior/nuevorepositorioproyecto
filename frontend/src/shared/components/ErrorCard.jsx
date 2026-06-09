import React from 'react';
import { AlertTriangle, RefreshCw, ServerCrash, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../../lib/utils';

/* ─── Inline error card (compact, dentro de secciones) ─────────────────────── */
export const ErrorCard = ({
    title       = 'Ocurrió un error',
    description = 'No se pudo completar la operación. Intenta nuevamente.',
    onRetry,
    className,
}) => (
    <div className={cn(
        'flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-5',
        className,
    )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle size={18} className="text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-red-800">{title}</h4>
            {description && (
                <p className="mt-0.5 text-xs font-medium text-red-500 leading-relaxed">{description}</p>
            )}
        </div>
        {onRetry && (
            <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="shrink-0 border-red-300 text-red-700 hover:bg-red-100"
            >
                <RefreshCw size={13} />
                Reintentar
            </Button>
        )}
    </div>
);

/* ─── Página de error completa (rellena la sección) ────────────────────────── */
export const ErrorPage = ({
    title       = 'No se pudo cargar la información',
    description = 'Verifica tu conexión e intenta nuevamente.',
    code,
    onRetry,
    className,
}) => (
    <div className={cn(
        'flex min-h-64 flex-col items-center justify-center gap-5 rounded-xl border border-red-200 bg-red-50 px-8 py-14 text-center',
        className,
    )}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
            <ServerCrash size={26} className="text-red-500" />
        </div>
        <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-400">
                {code ? `Error ${code}` : 'Error'}
            </p>
            <h3 className="mt-1 text-base font-bold text-red-800">{title}</h3>
            <p className="mt-1.5 max-w-sm text-sm font-medium text-red-500 leading-relaxed">
                {description}
            </p>
        </div>
        {onRetry && (
            <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-red-300 text-red-700 hover:bg-red-100"
            >
                <RefreshCw size={13} />
                Reintentar
            </Button>
        )}
    </div>
);

/* ─── Sin conexión ──────────────────────────────────────────────────────────── */
export const OfflineCard = ({ onRetry, className }) => (
    <div className={cn(
        'flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4',
        className,
    )}>
        <div className="flex items-center gap-3">
            <WifiOff size={18} className="shrink-0 text-amber-600" />
            <div>
                <p className="text-sm font-bold text-amber-800">Sin conexión a internet</p>
                <p className="text-xs font-medium text-amber-600">Comprueba tu red e intenta nuevamente.</p>
            </div>
        </div>
        {onRetry && (
            <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
                <RefreshCw size={13} />
                Reintentar
            </Button>
        )}
    </div>
);
