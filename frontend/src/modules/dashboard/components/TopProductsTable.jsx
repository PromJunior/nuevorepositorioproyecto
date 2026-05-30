import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';
import { useTopProducts } from '../hooks/useDashboard';

export const TopProductsTable = ({ filters = {} }) => {
    const navigate = useNavigate();
    const { data: products = [], isLoading } = useTopProducts(10, filters);

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Más vendidos
                    </p>
                    <h3 className="text-sm font-black text-slate-900">Top 10 productos</h3>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <p className="py-10 text-center text-sm italic text-slate-400">Sin ventas registradas</p>
            ) : (
                <div className="divide-y divide-slate-100">
                    {products.map((p, idx) => (
                        <div
                            key={p.product_id}
                            className="group flex items-center justify-between px-4 py-3 hover:bg-slate-50/60 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-500">
                                    {idx + 1}
                                </span>
                                <button
                                    onClick={() => navigate(`/kardex/producto/${p.product_id}`)}
                                    className="flex items-center gap-1 text-left text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate"
                                >
                                    <span className="truncate">{p.product_name}</span>
                                    <ExternalLink
                                        size={10}
                                        className="shrink-0 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity"
                                    />
                                </button>
                            </div>
                            <div className="flex shrink-0 items-center gap-4 text-right text-xs">
                                <span className="font-mono font-bold text-slate-500">
                                    {formatNumber(p.total_quantity)} uds.
                                </span>
                                <span className="font-mono font-black text-slate-900 w-24">
                                    {formatCurrency(p.total_revenue, 'PEN')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
