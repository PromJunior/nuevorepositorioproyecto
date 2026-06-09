import React from 'react';
import { Users } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';
import { useTopClients } from '../hooks/useDashboard';

const avatarColors = [
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-violet-100 text-violet-600',
    'bg-amber-100 text-amber-600',
    'bg-rose-100 text-rose-600',
    'bg-cyan-100 text-cyan-600',
    'bg-orange-100 text-orange-600',
    'bg-indigo-100 text-indigo-600',
];

export const TopClientsTable = ({ filters = {} }) => {
    const { data: clients = [], isLoading } = useTopClients(8, filters);

    const maxSpent = clients.length > 0
        ? Math.max(...clients.map((c) => Number(c.total_spent) || 0))
        : 0;

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
                <Users size={15} className="text-blue-600" />
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Mejores clientes
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">Por volumen de compra</h3>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : clients.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-sm font-medium text-slate-400">Sin datos de clientes</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {clients.map((c, idx) => {
                        const barWidth = maxSpent > 0
                            ? Math.round((Number(c.total_spent) / maxSpent) * 100)
                            : 0;
                        const initial = (c.client_name || 'C').slice(0, 1).toUpperCase();
                        const colorClass = avatarColors[idx % avatarColors.length];

                        return (
                            <div
                                key={idx}
                                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50/60"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${colorClass}`}>
                                        {initial}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {c.client_name}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="h-1 flex-1 rounded-full bg-slate-100">
                                                <div
                                                    className="h-1 rounded-full bg-blue-400 transition-all duration-500"
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                            </div>
                                            <span className="shrink-0 text-[11px] font-medium text-slate-400">
                                                {formatNumber(c.total_orders)} {c.total_orders !== 1 ? 'órdenes' : 'orden'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="ml-4 shrink-0 font-mono text-sm font-black text-slate-900">
                                    {formatCurrency(c.total_spent, 'PEN')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
