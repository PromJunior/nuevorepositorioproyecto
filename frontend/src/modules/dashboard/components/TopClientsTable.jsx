import React from 'react';
import { User } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';
import { useTopClients } from '../hooks/useDashboard';

export const TopClientsTable = () => {
    const { data: clients = [], isLoading } = useTopClients(8);

    return (
        <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Mejores clientes
                </p>
                <h3 className="text-sm font-black text-slate-900">Por volumen de compra</h3>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : clients.length === 0 ? (
                <p className="py-10 text-center text-sm italic text-slate-400">Sin datos</p>
            ) : (
                <div className="divide-y divide-slate-100">
                    {clients.map((c, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                    <User size={13} />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        {c.client_name}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {formatNumber(c.total_orders)} orden{c.total_orders !== 1 ? 'es' : ''}
                                    </p>
                                </div>
                            </div>
                            <span className="shrink-0 font-mono text-sm font-black text-slate-900">
                                {formatCurrency(c.total_spent, 'PEN')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
