import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useSalesChart } from '../hooks/useDashboard';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs font-bold">
            <p className="text-slate-400 mb-1">{label}</p>
            <p className="text-slate-900">{formatCurrency(payload[0]?.value ?? 0, 'PEN')}</p>
            <p className="text-slate-400 mt-0.5">{payload[1]?.value ?? 0} órdenes</p>
        </div>
    );
};

/**
 * Gráfico de área: ventas diarias.
 * Permite cambiar entre 7 y 30 días.
 */
export const SalesChart = ({ paymentMethodId = '' }) => {
    const [days, setDays] = useState(30);
    const { data = [], isLoading } = useSalesChart(days, { payment_method_id: paymentMethodId });

    // Formatear eje X: mostrar solo MM-DD
    const formatted = data.map((d) => ({
        ...d,
        label: d.date.slice(5),          // "MM-DD"
        total: Number(d.total),
        orders: Number(d.orders),
    }));

    return (
        <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Tendencia de ventas
                    </p>
                    <h3 className="mt-0.5 text-sm font-black text-slate-900">
                        Ventas últimos {days} días
                    </h3>
                </div>
                <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {[7, 30].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                days === d
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            ) : (
                <div className="h-48 min-h-48 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                interval={days === 7 ? 0 : 6}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#2563eb"
                                strokeWidth={2.5}
                                fill="url(#gradSales)"
                            />
                            <Area
                                type="monotone"
                                dataKey="orders"
                                stroke="#6366f1"
                                strokeWidth={1.5}
                                fill="none"
                                strokeDasharray="4 2"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="mt-3 flex gap-4 text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full bg-blue-600 inline-block" /> Ingresos (S/.)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 bg-indigo-400 inline-block border-t-2 border-dashed border-indigo-400" /> Órdenes
                </span>
            </div>
        </Card>
    );
};
