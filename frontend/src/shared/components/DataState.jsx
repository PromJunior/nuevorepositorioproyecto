import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Loader, SkeletonTable } from './Loader';
import { Button } from './ui/button';
import { cn } from '../../lib/utils';

/* ─── Error inline (para usar dentro de DataState o standalone) ────────────── */
const InlineError = ({ title, description, onRetry, className }) => (
    <div className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center',
        className,
    )}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100">
            <AlertTriangle size={20} className="text-red-500" />
        </div>
        <div>
            <h3 className="text-sm font-bold text-red-800">{title}</h3>
            {description && (
                <p className="mt-1 max-w-sm text-xs font-medium text-red-500">{description}</p>
            )}
        </div>
        {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}
                className="border-red-300 text-red-700 hover:bg-red-50">
                <RefreshCw size={13} /> Reintentar
            </Button>
        )}
    </div>
);

/**
 * DataState — gestor central de estados loading / error / empty.
 *
 * Props:
 *  isLoading     boolean
 *  isError       boolean
 *  isEmpty       boolean
 *  skeleton      ReactNode — si se pasa, se muestra en lugar del spinner
 *  onRetry       fn        — muestra botón "Reintentar" en estado error
 *  loadingLabel  string
 *  errorTitle    string
 *  errorDescription string
 *  emptyTitle    string
 *  emptyDescription string
 *  emptyIcon     LucideIcon
 *  emptyAction   ReactNode
 */
export const DataState = ({
    isLoading = false,
    isError   = false,
    isEmpty   = false,
    skeleton  = null,
    onRetry   = null,
    loadingLabel       = 'Cargando datos...',
    errorTitle         = 'No se pudo cargar la información',
    errorDescription   = 'Verifica tu conexión e intenta nuevamente.',
    emptyTitle         = 'Sin datos',
    emptyDescription   = 'No hay información para mostrar.',
    emptyIcon,
    emptyAction,
    children,
}) => {
    if (isLoading) {
        return skeleton
            ? <>{skeleton}</>
            : <Loader label={loadingLabel} className="min-h-64" />;
    }

    if (isError) {
        return (
            <InlineError
                title={errorTitle}
                description={errorDescription}
                onRetry={onRetry}
            />
        );
    }

    if (isEmpty) {
        return (
            <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                icon={emptyIcon}
                action={emptyAction}
            />
        );
    }

    return children;
};

/* ── Convenience export: skeleton de tabla pre-configurado ──────────────────── */
export const TableDataState = ({ isLoading, isError, isEmpty, onRetry, rows = 6, cols = 5, children, ...rest }) => (
    <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={onRetry}
        skeleton={<SkeletonTable rows={rows} cols={cols} />}
        {...rest}
    >
        {children}
    </DataState>
);
