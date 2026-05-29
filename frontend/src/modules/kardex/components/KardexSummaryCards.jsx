import React from 'react';
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    DollarSign,
    Package,
} from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';

const StatCard = ({ icon, label, value, sub, colorClass = 'text-slate-900', bgClass = 'bg-slate-50 text-slate-400' }) => {
    const IconComp = icon;
    return (
        <Card className="flex items-center justify-between p-5">
            <div className="space-y-1 min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                    {label}
                </span>
                <span className={`block text-xl font-black tracking-tight ${colorClass}`}>
                    {value}
                </span>
                {sub && (
                    <span className="block text-[11px] font-medium text-slate-400">{sub}</span>
                )}
            </div>
            <div className={`shrink-0 rounded-xl p-3 ${bgClass}`}>
                <IconComp size={20} />
            </div>
        </Card>
    );
};

/**
 * 6 KPI cards del inventario global.
 * `summary` → respuesta de GET /inventory/summary
 */
export const KardexSummaryCards = ({ summary }) => {
    if (!summary) return null;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard
                icon={DollarSign}
                label="Valor total inventario"
                value={formatCurrency(summary.total_valuation, 'PEN')}
                sub="Stock × último costo"
                colorClass="text-blue-700"
                bgClass="bg-blue-50 text-blue-500"
            />
            <StatCard
                icon={BarChart3}
                label="Total movimientos"
                value={formatNumber(summary.total_transactions)}
                sub="Desde el inicio"
            />
            <StatCard
                icon={ArrowUpRight}
                label="Entradas"
                value={formatNumber(summary.entries_count)}
                colorClass="text-emerald-700"
                bgClass="bg-emerald-50 text-emerald-500"
            />
            <StatCard
                icon={ArrowDownLeft}
                label="Salidas"
                value={formatNumber(summary.exits_count)}
                colorClass="text-rose-700"
                bgClass="bg-rose-50 text-rose-500"
            />
            <StatCard
                icon={Package}
                label="Productos activos"
                value={formatNumber(summary.total_products)}
            />
            <StatCard
                icon={AlertTriangle}
                label="Bajo stock"
                value={formatNumber(summary.low_stock_count)}
                sub="Stock ≤ 5 unidades"
                colorClass={summary.low_stock_count > 0 ? 'text-amber-600' : 'text-slate-900'}
                bgClass={summary.low_stock_count > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}
            />
        </div>
    );
};
