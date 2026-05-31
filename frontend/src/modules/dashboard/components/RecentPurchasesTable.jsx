import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../shared/components/ui/card';
import { PurchaseStatusBadge } from '../../purchases/components/PurchaseStatusBadge';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useRecentPurchases } from '../hooks/useDashboard';

export const RecentPurchasesTable = () => {
    const { data: purchases = [], isLoading } = useRecentPurchases(8);

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Últimas compras
                    </p>
                    <h3 className="text-sm font-black text-slate-900">Compras recientes</h3>
                </div>
                <Link
                    to="/compras"
                    className="text-xs font-black text-blue-600 hover:text-blue-700"
                >
                    Ver todas →
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : purchases.length === 0 ? (
                <p className="py-10 text-center text-sm italic text-slate-400">Sin compras</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <th className="p-3 pl-5">#</th>
                                <th className="p-3">Proveedor</th>
                                <th className="p-3 hidden sm:table-cell">Usuario</th>
                                <th className="p-3 hidden md:table-cell">Fecha</th>
                                <th className="p-3 text-center">Estado</th>
                                <th className="p-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {purchases.map((p) => (
                                <tr
                                    key={p.id}
                                    className="hover:bg-slate-50/60 transition-colors"
                                >
                                    <td className="p-3 pl-5 font-mono text-xs font-bold text-slate-400">
                                        #{p.id}
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800 max-w-[150px] truncate">
                                        {p.supplier_name}
                                    </td>
                                    <td className="p-3 text-xs text-slate-500 hidden sm:table-cell">
                                        {p.user_name}
                                    </td>
                                    <td className="p-3 text-xs text-slate-400 hidden md:table-cell whitespace-nowrap">
                                        {formatDateTime(p.purchase_date)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <PurchaseStatusBadge status={p.status_name} />
                                    </td>
                                    <td className="p-3 pr-5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                                        {formatCurrency(p.total_amount, 'PEN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};
