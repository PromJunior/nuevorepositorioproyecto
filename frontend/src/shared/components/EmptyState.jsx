import React from 'react';
import {
    FileSearch, Inbox, Package, ShoppingCart,
    ShoppingBag, Users, FileText, Search,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/* ─── Base ─────────────────────────────────────────────────────────────────── */
export const EmptyState = ({
    title       = 'Sin datos',
    description = 'No hay información para mostrar.',
    icon        = Inbox,
    action,
    compact     = false,
    className,
}) => {
    const Icon = icon;
    return (
        <div className={cn(
            'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-center',
            compact ? 'px-4 py-8' : 'px-6 py-14',
            className,
        )}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Icon size={22} className="text-slate-400" />
            </div>
            <h3 className={cn('mt-4 font-bold text-slate-800', compact ? 'text-sm' : 'text-base')}>
                {title}
            </h3>
            <p className={cn('mt-1 font-medium text-slate-400', compact ? 'text-xs max-w-xs' : 'text-sm max-w-sm')}>
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
};

/* ─── Presets ───────────────────────────────────────────────────────────────── */

export const EmptyVentas = ({ action, compact, className }) => (
    <EmptyState
        icon={ShoppingCart}
        title="Sin ventas registradas"
        description="Las ventas del período aparecerán aquí. Registra la primera desde el punto de venta."
        action={action}
        compact={compact}
        className={className}
    />
);

export const EmptyCompras = ({ action, compact, className }) => (
    <EmptyState
        icon={ShoppingBag}
        title="Sin órdenes de compra"
        description="No hay compras en el período seleccionado. Crea una nueva orden para empezar."
        action={action}
        compact={compact}
        className={className}
    />
);

export const EmptyProductos = ({ action, compact, className }) => (
    <EmptyState
        icon={Package}
        title="Sin productos en el catálogo"
        description="Agrega productos al inventario para comenzar a gestionar existencias."
        action={action}
        compact={compact}
        className={className}
    />
);

export const EmptyClientes = ({ action, compact, className }) => (
    <EmptyState
        icon={Users}
        title="Sin clientes registrados"
        description="Los clientes registrados aparecerán aquí para su gestión y seguimiento."
        action={action}
        compact={compact}
        className={className}
    />
);

export const EmptyReportes = ({ action, compact, className }) => (
    <EmptyState
        icon={FileText}
        title="Sin datos para el período"
        description="Ajusta los filtros de fecha o selecciona un rango diferente para ver resultados."
        action={action}
        compact={compact}
        className={className}
    />
);

export const EmptyBusqueda = ({ query = '', action, compact, className }) => (
    <EmptyState
        icon={Search}
        title="Sin resultados"
        description={
            query
                ? `No se encontraron resultados para "${query}". Prueba con otros términos.`
                : 'No hay resultados para los filtros seleccionados.'
        }
        action={action}
        compact={compact}
        className={className}
    />
);

export const EmptyRegistros = ({ action, compact, className }) => (
    <EmptyState
        icon={FileSearch}
        title="Sin registros"
        description="Aún no hay registros disponibles en esta sección."
        action={action}
        compact={compact}
        className={className}
    />
);
