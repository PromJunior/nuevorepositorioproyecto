import React from 'react';
import { Users } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { useClientSegmentation } from '../hooks/useDashboard';
import { formatNumber } from '../../../shared/utils/formatters';

const COLORS = {
    VIP: 'bg-amber-500',
    Frecuente: 'bg-emerald-500',
    Ocasional: 'bg-blue-500',
    Inactivo: 'bg-slate-400',
    Nuevo: 'bg-indigo-500',
};

export const ClientSegmentationChart = ({ filters = {} }) => {
    const { data = [], isLoading } = useClientSegmentation(filters);
    const total = data.reduce((sum, row) => sum + Number(row.count || 0), 0);

    return (
        <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                <h2 className="text-sm font-black text-slate-900">Segmentacion clientes</h2>
            </div>
            {isLoading ? (
                <p className="text-sm font-semibold text-slate-400">Cargando...</p>
            ) : (
                <div className="space-y-3">
                    {data.map((row) => {
                        const pct = total ? (Number(row.count || 0) / total) * 100 : 0;
                        return (
                            <div key={row.segment}>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-600">{row.segment}</span>
                                    <span className="text-slate-400">{formatNumber(row.count)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100">
                                    <div
                                        className={`h-2 rounded-full ${COLORS[row.segment] || 'bg-blue-500'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};
