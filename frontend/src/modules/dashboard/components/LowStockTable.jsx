import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { formatNumber } from '../../../shared/utils/formatters';
import { useLowStock } from '../hooks/useDashboard';

export const LowStockTable = ({ threshold = 5 }) => {
    const navigate = useNavigate();
    const { data: products = [], isLoading } = useLowStock(threshold || 5);

    if (isLoading) return null;
    if (products.length === 0) return null;

    return (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                        <AlertTriangle size={15} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                            Alerta de inventario
                        </p>
                        <h3 className="text-sm font-bold text-amber-900">
                            {products.length} producto{products.length !== 1 ? 's' : ''} requieren reposición
                        </h3>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
                    onClick={() => navigate('/inventario')}
                >
                    Ver inventario <ArrowRight size={13} />
                </Button>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
                {products.map((p) => (
                    <div
                        key={p.id}
                        className="group flex items-center justify-between px-5 py-3 transition-colors hover:bg-amber-50/30"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                onClick={() => navigate(`/kardex/producto/${p.id}`)}
                                className="flex min-w-0 items-center gap-1.5 text-left text-sm font-semibold text-slate-800 transition-colors hover:text-blue-600"
                            >
                                <span className="truncate">{p.name_product}</span>
                                <ExternalLink
                                    size={11}
                                    className="shrink-0 text-blue-400 opacity-0 transition-opacity group-hover:opacity-100"
                                />
                            </button>
                            {p.category_name && (
                                <span className="hidden text-[11px] font-medium text-slate-400 sm:block">
                                    {p.category_name}
                                </span>
                            )}
                        </div>
                        <Badge
                            variant={p.stock === 0 ? 'danger' : 'warning'}
                            dot
                        >
                            {p.stock === 0 ? 'Agotado' : `${formatNumber(p.stock)} uds.`}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
};
