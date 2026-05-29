import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency } from '../../../shared/utils/formatters';
import { usePaymentMethodStats } from '../hooks/useDashboard';

const COLORS = ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs font-bold">
            <p className="text-slate-800">{d.method}</p>
            <p className="text-blue-600 mt-1">{formatCurrency(d.total, 'PEN')}</p>
            <p className="text-slate-400">{d.count} transacciones</p>
        </div>
    );
};

export const PaymentMethodsChart = () => {
    const { data = [], isLoading } = usePaymentMethodStats();

    const chartData = data.map((d) => ({
        ...d,
        total: Number(d.total),
    }));

    return (
        <Card className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Métodos de pago
            </p>
            <h3 className="mt-0.5 mb-4 text-sm font-black text-slate-900">
                Distribución de ingresos
            </h3>

            {isLoading ? (
                <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
            ) : chartData.length === 0 ? (
                <div className="flex h-44 items-center justify-center text-sm text-slate-400 italic">
                    Sin datos aún
                </div>
            ) : (
                <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={75}
                                dataKey="total"
                                nameKey="method"
                                paddingAngle={3}
                            >
                                {chartData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(val) => (
                                    <span className="text-[11px] font-bold text-slate-600">{val}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
};
