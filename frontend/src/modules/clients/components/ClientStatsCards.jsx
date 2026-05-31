import React from 'react';
import { CalendarClock, Crown, Receipt, TrendingUp, UserX, Users } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';

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
                <StatCard icon={Crown} label="Clientes VIP" value={formatNumber(summary.vip)} />
                <StatCard icon={TrendingUp} label="Clientes frecuentes" value={formatNumber(summary.frequent)} />
                <StatCard icon={CalendarClock} label="Clientes nuevos" value={formatNumber(summary.newClients)} />
                <StatCard icon={UserX} label="Clientes inactivos" value={formatNumber(summary.inactive)} />
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={TrendingUp} label="Segmento" value={stats?.segment || 'Nuevo'} />
            <StatCard icon={CalendarClock} label="Recency" value={stats?.recency_days == null ? '-' : `${stats.recency_days} dias`} />
            <StatCard icon={Receipt} label="Frecuencia" value={formatNumber(stats?.frequency ?? stats?.orders_count)} />
            <StatCard icon={Users} label="Monetary" value={formatCurrency(stats?.monetary ?? stats?.total_amount, 'PEN')} />
        </div>
    );
};
