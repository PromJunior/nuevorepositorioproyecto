import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';
import { useTopProducts } from '../hooks/useDashboard';

const RankBadge = ({ rank }) => {
    if (rank === 1) return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-black text-amber-600">1</span>;
    if (rank === 2) return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-500">2</span>;
    if (rank === 3) return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-black text-orange-500">3</span>;
    return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">{rank}</span>;
};

export const TopProductsTable = ({ filters = {} }) => {
    const navigate = useNavigate();
    const { data: products = [], isLoading } = useTopProducts(10, filters);

    /* revenue bar width */
    const maxRevenue = products.length > 0
        ? Math.max(...products.map((p) => Number(p.total_revenue) || 0))
        : 0;

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
                <TrendingUp size={15} className="text-blue-600" />
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Más vendidos
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">Top 10 productos</h3>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-sm font-medium text-slate-400">Sin ventas registradas</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {products.map((p, idx) => {
                        const barWidth = maxRevenue > 0
                            ? Math.round((Number(p.total_revenue) / maxRevenue) * 100)
                            : 0;

                        return (
                            <div
                                key={p.product_id}
                                className="group flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/60"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <RankBadge rank={idx + 1} />
                                    <div className="min-w-0 flex-1">
                                        <button
                                            onClick={() => navigate(`/kardex/producto/${p.product_id}`)}
                                            className="flex items-center gap-1 text-left text-sm font-semibold text-slate-800 transition-colors hover:text-blue-600"
                                        >
                                            <span className="truncate max-w-[160px]">{p.product_name}</span>
                                            <ExternalLink
                                                size={10}
                                                className="shrink-0 text-blue-400 opacity-0 transition-opacity group-hover:opacity-100"
                                            />
                                        </button>
                                        {/* Revenue bar */}
                                        <div className="mt-1 h-1 w-full rounded-full bg-slate-100">
                                            <div
                                                className="h-1 rounded-full bg-blue-500 transition-all duration-500"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-4 text-right">
                                    <span className="hidden font-mono text-xs font-semibold text-slate-400 sm:block">
                                        {formatNumber(p.total_quantity)} uds.
                                    </span>
                                    <span className="w-24 font-mono text-sm font-black text-slate-900">
                                        {formatCurrency(p.total_revenue, 'PEN')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
