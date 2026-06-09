import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';
import { usePaymentMethodStats } from '../hooks/useDashboard';

const PALETTE = ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-lg">
            <p className="text-sm font-bold text-slate-800">{d.method}</p>
            <p className="mt-1 text-sm font-black text-blue-600">{formatCurrency(d.total, 'PEN')}</p>
            <p className="text-xs font-medium text-slate-400">{d.count} transacciones</p>
        </div>
    );
};

export const PaymentMethodsChart = ({ filters = {} }) => {
    const { data = [], isLoading } = usePaymentMethodStats(filters);
    const chartData = data.map((d) => ({ ...d, total: Number(d.total) }));
    const totalRevenue = chartData.reduce((sum, d) => sum + d.total, 0);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
                <CreditCard size={15} className="text-blue-600" />
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Métodos de pago
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">Distribución de ingresos</h3>
                </div>
            </div>

            <div className="px-5 pb-4 pt-4">
                {isLoading ? (
                    <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
                ) : chartData.length === 0 ? (
                    <div className="flex h-48 items-center justify-center">
                        <p className="text-sm font-medium italic text-slate-400">Sin datos aún</p>
                    </div>
                ) : (
                    <>
                        <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={48}
                                        outerRadius={72}
                                        dataKey="total"
                                        nameKey="method"
                                        paddingAngle={3}
                                        strokeWidth={0}
                                    >
                                        {chartData.map((_, i) => (
                                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend list */}
                        <div className="mt-3 space-y-2">
                            {chartData.map((d, i) => {
                                const pct = totalRevenue > 0
                                    ? Math.round((d.total / totalRevenue) * 100)
                                    : 0;
                                return (
                                    <div key={d.method} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{ background: PALETTE[i % PALETTE.length] }}
                                            />
                                            <span className="font-semibold text-slate-600">{d.method}</span>
                                        </div>
                                        <span className="font-bold text-slate-400">{pct}%</span>
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
