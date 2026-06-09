import React from 'react';
import { PieChart } from 'lucide-react';
import { useClientSegmentation } from '../hooks/useDashboard';
import { formatNumber } from '../../../shared/utils/formatters';

const SEGMENT_CONFIG = {
    VIP:       { bg: 'bg-amber-100',   bar: 'bg-amber-500',   text: 'text-amber-700'  },
    Frecuente: { bg: 'bg-emerald-100', bar: 'bg-emerald-500', text: 'text-emerald-700' },
    Ocasional: { bg: 'bg-blue-100',    bar: 'bg-blue-500',    text: 'text-blue-700'   },
    Nuevo:     { bg: 'bg-indigo-100',  bar: 'bg-indigo-500',  text: 'text-indigo-700' },
    Inactivo:  { bg: 'bg-slate-100',   bar: 'bg-slate-400',   text: 'text-slate-500'  },
};
const DEFAULT_CONFIG = { bg: 'bg-slate-100', bar: 'bg-blue-400', text: 'text-blue-700' };

export const ClientSegmentationChart = ({ filters = {} }) => {
    const { data = [], isLoading } = useClientSegmentation(filters);
    const total = data.reduce((sum, row) => sum + Number(row.count || 0), 0);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
                <PieChart size={15} className="text-blue-600" />
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Base de clientes
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">Segmentación de clientes</h3>
                </div>
            </div>

            <div className="px-5 pb-5 pt-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="py-10 text-center">
                        <p className="text-sm font-medium italic text-slate-400">Sin datos de segmentación</p>
                    </div>
                ) : (
                    <>
                        {/* Total */}
                        <p className="mb-4 text-xs font-medium text-slate-400">
                            Total: <span className="font-black text-slate-700">{formatNumber(total)} clientes</span>
                        </p>

                        <div className="space-y-4">
                            {data.map((row) => {
                                const pct = total ? Math.round((Number(row.count || 0) / total) * 100) : 0;
                                const cfg = SEGMENT_CONFIG[row.segment] || DEFAULT_CONFIG;
                                return (
                                    <div key={row.segment}>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                                                    {row.segment}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-black text-slate-700">
                                                    {formatNumber(row.count)}
                                                </span>
                                                <span className="text-slate-400">{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bar}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
