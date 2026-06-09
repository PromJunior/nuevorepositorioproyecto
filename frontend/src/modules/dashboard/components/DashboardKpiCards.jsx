import React from 'react';
import {
    AlertTriangle, Building2, Crown, DollarSign,
    Receipt, ShoppingBag, TrendingUp, Users, UserX, Wallet,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/ui/card';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';

/* tone → iconClassName */
const iconClass = {
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    rose:    'bg-rose-50 text-rose-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    red:     'bg-red-50 text-red-500',
    slate:   'bg-slate-100 text-slate-400',
};

export const DashboardKpiCards = ({ summary, visibleKpis = [] }) => {
    if (!summary) return null;

    const currency    = summary.fiscal_settings?.currency || summary.company?.primary_currency || 'PEN';
    const hasSession  = summary.has_open_session;
    const show = (id) => visibleKpis.length === 0 || visibleKpis.includes(id);

    const cards = [
        show('sales_today') && {
            icon: Receipt,
            label: 'Ventas hoy',
            value: formatCurrency(summary.sales_today, currency),
            sub: `${formatNumber(summary.orders_today)} órdenes`,
            tone: 'emerald',
        },
        show('sales_this_month') && {
            icon: TrendingUp,
            label: 'Ventas este mes',
            value: formatCurrency(summary.sales_this_month, currency),
            sub: `${formatNumber(summary.orders_this_month)} órdenes`,
            tone: 'blue',
        },
        show('purchases_this_month') && {
            icon: ShoppingBag,
            label: 'Compras este mes',
            value: formatCurrency(summary.purchases_this_month, currency),
            sub: `${formatNumber(summary.purchases_count_this_month)} compras`,
            tone: 'indigo',
        },
        show('cash_status') && {
            icon: Wallet,
            label: 'Efectivo en caja',
            value: hasSession && summary.open_session_expected != null
                ? formatCurrency(summary.open_session_expected, currency)
                : 'Sin caja abierta',
            sub: hasSession ? 'Sesión activa' : 'Abre caja para vender',
            tone: hasSession ? 'emerald' : 'slate',
        },
        show('inventory_value') && {
            icon: DollarSign,
            label: 'Valor inventario',
            value: formatCurrency(summary.total_inventory_value, currency),
            sub: 'Valorización actual',
            tone: 'blue',
        },
        show('low_stock') && {
            icon: AlertTriangle,
            label: 'Bajo stock',
            value: formatNumber(summary.low_stock_count),
            sub: `≤ ${summary.low_stock_threshold || 5} unidades`,
            tone: summary.low_stock_count > 0 ? 'amber' : 'slate',
        },
        show('clients') && {
            icon: Users,
            label: 'Clientes',
            value: formatNumber(summary.total_clients),
            sub: `${formatNumber(summary.clients_new_this_month)} nuevos este mes`,
            tone: 'slate',
        },
        show('clients_vip') && {
            icon: Crown,
            label: 'Clientes VIP',
            value: formatNumber(summary.clients_vip ?? 0),
            sub: `${formatNumber(summary.clients_frequent ?? 0)} frecuentes`,
            tone: 'amber',
        },
        show('clients_inactive') && {
            icon: UserX,
            label: 'Clientes inactivos',
            value: formatNumber(summary.clients_inactive ?? 0),
            sub: 'Sin compra reciente',
            tone: 'slate',
        },
        show('suppliers') && {
            icon: Building2,
            label: 'Proveedores',
            value: formatNumber(summary.total_suppliers),
            sub: `${formatNumber(summary.total_products)} SKUs`,
            tone: 'slate',
        },
    ].filter(Boolean);

    if (cards.length === 0) return null;

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {cards.map((card) => (
                <StatCard
                    key={card.label}
                    icon={card.icon}
                    label={card.label}
                    value={card.value}
                    sub={card.sub}
                    iconClassName={iconClass[card.tone] || iconClass.slate}
                />
            ))}
        </div>
    );
};
