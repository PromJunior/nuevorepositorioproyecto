import React from 'react';
import {
    AlertTriangle, Building2, Crown, DollarSign, Package,
    Receipt, ShoppingBag, TrendingUp, Users, UserX, Wallet,
} from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';

const KpiCard = ({ icon, label, value, sub, tone = 'slate' }) => {
    const IconComp = icon;
    const tones = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        slate: 'bg-slate-100 text-slate-500',
    };

    return (
        <Card className="flex items-center justify-between p-5">
            <div className="min-w-0 space-y-1">
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {label}
                </p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{value}</p>
                {sub && <p className="text-xs font-semibold text-slate-400">{sub}</p>}
            </div>
            <div className={`shrink-0 rounded-xl p-3 ${tones[tone] || tones.slate}`}>
                <IconComp size={22} />
            </div>
        </Card>
    );
};

export const DashboardKpiCards = ({ summary, visibleKpis = [] }) => {
    if (!summary) return null;

    const currency = summary.fiscal_settings?.currency || summary.company?.primary_currency || 'PEN';
    const hasCashAlert = summary.has_open_session;
    const show = (id) => visibleKpis.length === 0 || visibleKpis.includes(id);

    const cards = [
        show('sales_today') && {
            icon: Receipt,
            label: 'Ventas hoy',
            value: formatCurrency(summary.sales_today, currency),
            sub: `${summary.orders_today} ordenes`,
            tone: 'emerald',
        },
        show('sales_this_month') && {
            icon: TrendingUp,
            label: 'Ventas este mes',
            value: formatCurrency(summary.sales_this_month, currency),
            sub: `${summary.orders_this_month} ordenes`,
            tone: 'blue',
        },
        show('purchases_this_month') && {
            icon: ShoppingBag,
            label: 'Compras este mes',
            value: formatCurrency(summary.purchases_this_month, currency),
            sub: `${summary.purchases_count_this_month} compras recibidas`,
            tone: 'indigo',
        },
        show('cash_status') && {
            icon: Wallet,
            label: 'Efectivo esperado en caja',
            value: hasCashAlert && summary.open_session_expected != null
                ? formatCurrency(summary.open_session_expected, currency)
                : 'Sin caja abierta',
            sub: hasCashAlert ? 'Sesion activa' : 'Abre caja para vender',
            tone: hasCashAlert ? 'emerald' : 'slate',
        },
        show('inventory_value') && {
            icon: DollarSign,
            label: 'Valor inventario',
            value: formatCurrency(summary.total_inventory_value, currency),
            sub: 'Valorizacion actual',
            tone: 'blue',
        },
        show('low_stock') && {
            icon: AlertTriangle,
            label: 'Bajo stock',
            value: formatNumber(summary.low_stock_count),
            sub: `Productos <= ${summary.low_stock_threshold || 5} unidades`,
            tone: summary.low_stock_count > 0 ? 'amber' : 'slate',
        },
        show('clients') && {
            icon: Users,
            label: 'Clientes registrados',
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
            sub: `${formatNumber(summary.total_products)} SKUs en catalogo`,
            tone: 'slate',
        },
    ].filter(Boolean);

    if (cards.length === 0) return null;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <KpiCard key={card.label} {...card} />
            ))}
        </div>
    );
};

export { KpiCard, Package };
