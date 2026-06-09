import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/badge';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useRecentSales } from '../hooks/useDashboard';
import { ROUTES } from '../../../constants/routes';

const SkeletonRows = ({ count = 5 }) => (
    <div className="space-y-2 p-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ))}
    </div>
);

export const RecentSalesTable = ({ filters = {} }) => {
    const { data: sales = [], isLoading } = useRecentSales(10, filters);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Actividad reciente
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">Últimas ventas</h3>
                </div>
                <Link
                    to={ROUTES.orders}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                    Ver todas <ArrowRight size={13} />
                </Link>
            </div>

            {isLoading ? (
                <SkeletonRows count={5} />
            ) : sales.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-sm font-medium text-slate-400">Sin ventas registradas</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-3">#</th>
                                <th className="px-3 py-3">Cliente</th>
                                <th className="hidden px-3 py-3 sm:table-cell">Vendedor</th>
                                <th className="hidden px-3 py-3 md:table-cell">Fecha</th>
                                <th className="hidden px-3 py-3 md:table-cell">Método</th>
                                <th className="px-5 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sales.map((s) => (
                                <tr key={s.id} className="transition-colors hover:bg-slate-50/60">
                                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-400">
                                        #{s.id}
                                    </td>
                                    <td className="max-w-[140px] truncate px-3 py-3.5 text-sm font-semibold text-slate-800">
                                        {s.client_name}
                                    </td>
                                    <td className="hidden px-3 py-3.5 text-xs text-slate-500 sm:table-cell">
                                        {s.seller_name}
                                    </td>
                                    <td className="hidden whitespace-nowrap px-3 py-3.5 text-xs text-slate-400 md:table-cell">
                                        {formatDateTime(s.order_date)}
                                    </td>
                                    <td className="hidden px-3 py-3.5 md:table-cell">
                                        {s.payment_method ? (
                                            <Badge variant="neutral">{s.payment_method}</Badge>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-sm font-black text-slate-900">
                                        {formatCurrency(s.total_amount, 'PEN')}
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
