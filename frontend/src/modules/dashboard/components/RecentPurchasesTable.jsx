import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PurchaseStatusBadge } from '../../purchases/components/PurchaseStatusBadge';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useRecentPurchases } from '../hooks/useDashboard';

const SkeletonRows = ({ count = 4 }) => (
    <div className="space-y-2 p-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ))}
    </div>
);

export const RecentPurchasesTable = () => {
    const { data: purchases = [], isLoading } = useRecentPurchases(8);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Compras recientes
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">Últimas órdenes de compra</h3>
                </div>
                <Link
                    to="/compras"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                    Ver todas <ArrowRight size={13} />
                </Link>
            </div>

            {isLoading ? (
                <SkeletonRows count={4} />
            ) : purchases.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-sm font-medium text-slate-400">Sin compras registradas</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-3">#</th>
                                <th className="px-3 py-3">Proveedor</th>
                                <th className="hidden px-3 py-3 sm:table-cell">Usuario</th>
                                <th className="hidden px-3 py-3 md:table-cell">Fecha</th>
                                <th className="px-3 py-3 text-center">Estado</th>
                                <th className="px-5 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {purchases.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-slate-50/60">
                                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-400">
                                        #{p.id}
                                    </td>
                                    <td className="max-w-[140px] truncate px-3 py-3.5 text-sm font-semibold text-slate-800">
                                        {p.supplier_name}
                                    </td>
                                    <td className="hidden px-3 py-3.5 text-xs text-slate-500 sm:table-cell">
                                        {p.user_name}
                                    </td>
                                    <td className="hidden whitespace-nowrap px-3 py-3.5 text-xs text-slate-400 md:table-cell">
                                        {formatDateTime(p.purchase_date)}
                                    </td>
                                    <td className="px-3 py-3.5 text-center">
                                        <PurchaseStatusBadge status={p.status_name} />
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-sm font-black text-slate-900">
                                        {formatCurrency(p.total_amount, 'PEN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
