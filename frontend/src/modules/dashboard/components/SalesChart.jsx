import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useSalesChart } from '../hooks/useDashboard';
import { cn } from '../../../lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-lg">
            <p className="mb-2 text-xs font-semibold text-slate-400">{label}</p>
            <p className="text-sm font-black text-slate-900">
                {formatCurrency(payload[0]?.value ?? 0, 'PEN')}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
                {payload[1]?.value ?? 0} órdenes
            </p>
        </div>
    );
};

export const SalesChart = ({ filters = {} }) => {
    const [days, setDays] = useState(30);
    const { data = [], isLoading } = useSalesChart(days, filters);

    const formatted = data.map((d) => ({
        ...d,
        label:  d.date.slice(5),
        total:  Number(d.total),
        orders: Number(d.orders),
    }));

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Tendencia de ventas
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">
                        Ventas últimos {days} días
                    </h3>
                </div>
                {/* Period toggle */}
                <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    {[7, 30].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                                days === d
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600',
                            )}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="px-5 pb-4 pt-4">
                {isLoading ? (
                    <div className="h-52 animate-pulse rounded-xl bg-slate-100" />
                ) : (
                    <div className="h-52 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <AreaChart
                                data={formatted}
                                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f1f5f9"
                                />
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
                                    strokeWidth={2}
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

                {/* Legend */}
                <div className="mt-3 flex items-center gap-5 text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-4 rounded-full bg-blue-600" />
                        Ingresos (S/.)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-indigo-400" />
                        Órdenes
                    </span>
                </div>
            </div>
        </div>
    );
};
