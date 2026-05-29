import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { formatNumber } from '../../../shared/utils/formatters';
import { useLowStock } from '../hooks/useDashboard';

export const LowStockTable = () => {
    const navigate = useNavigate();
    const { data: products = [], isLoading } = useLowStock(5);

    if (isLoading) return null;
    if (products.length === 0) return null;

    return (
        <Card className="overflow-hidden border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                            Alerta de inventario
                        </p>
                        <h3 className="text-sm font-black text-amber-800">
                            {products.length} producto{products.length !== 1 ? 's' : ''} por reponer
                        </h3>
                    </div>
                </div>
                <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => navigate('/inventario')}
                >
                    Ver inventario
                </Button>
            </div>

            <div className="divide-y divide-slate-100">
                {products.map((p) => (
                    <div
                        key={p.id}
                        className="group flex items-center justify-between px-4 py-3 hover:bg-amber-50/40 transition-colors"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => navigate(`/kardex/producto/${p.id}`)}
                                className="flex items-center gap-1 text-left text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate"
                            >
                                <span className="truncate">{p.name_product}</span>
                                <ExternalLink
                                    size={10}
                                    className="shrink-0 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity"
                                />
                            </button>
                            {p.category_name && (
                                <span className="hidden sm:block text-[11px] text-slate-400">
                                    {p.category_name}
                                </span>
                            )}
                        </div>
                        <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                                p.stock === 0
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            {p.stock === 0 ? 'Agotado' : `${formatNumber(p.stock)} uds.`}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
};
