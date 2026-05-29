import React from 'react';
import { CalendarClock, Receipt, TrendingUp, Users } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency, formatDateTime, formatNumber } from '../../../shared/utils/formatters';

const StatCard = ({ icon, label, value, sub }) => {
    const IconComponent = icon;

    return (
        <Card className="flex items-center justify-between p-4">
            <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
                {sub && <p className="mt-1 text-xs font-semibold text-slate-400">{sub}</p>}
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <IconComponent size={20} />
            </div>
        </Card>
    );
};

export const ClientStatsCards = ({ stats, summary }) => {
    if (summary) {
        return (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Users} label="Clientes registrados" value={formatNumber(summary.total)} />
                <StatCard icon={Users} label="Clientes activos" value={formatNumber(summary.active)} />
                <StatCard icon={TrendingUp} label="Clientes frecuentes" value={formatNumber(summary.frequent)} sub="3 o mas ordenes" />
                <StatCard icon={CalendarClock} label="Clientes nuevos mes" value={formatNumber(summary.newThisMonth)} />
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={TrendingUp} label="Total compras" value={formatCurrency(stats?.total_purchases, 'PEN')} />
            <StatCard icon={Receipt} label="Monto acumulado" value={formatCurrency(stats?.total_amount, 'PEN')} />
            <StatCard icon={CalendarClock} label="Ultima compra" value={formatDateTime(stats?.last_purchase)} />
            <StatCard icon={Receipt} label="Cantidad ordenes" value={formatNumber(stats?.orders_count)} />
        </div>
    );
};
