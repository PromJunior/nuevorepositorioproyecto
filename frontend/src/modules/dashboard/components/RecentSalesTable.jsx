import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useRecentSales } from '../hooks/useDashboard';
import { ROUTES } from '../../../constants/routes';

export const RecentSalesTable = ({ filters = {} }) => {
    const { data: sales = [], isLoading } = useRecentSales(10, filters);

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Actividad reciente
                    </p>
                    <h3 className="text-sm font-black text-slate-900">Últimas ventas</h3>
                </div>
                <Link
                    to={ROUTES.orders}
                    className="text-xs font-black text-blue-600 hover:text-blue-700"
                >
                    Ver todas →
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : sales.length === 0 ? (
                <p className="py-10 text-center text-sm italic text-slate-400">Sin ventas</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <th className="p-3 pl-5">#</th>
                                <th className="p-3">Cliente</th>
                                <th className="p-3 hidden sm:table-cell">Vendedor</th>
                                <th className="p-3 hidden md:table-cell">Fecha</th>
                                <th className="p-3 hidden md:table-cell">Método</th>
                                <th className="p-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {sales.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3 pl-5 font-mono text-xs font-bold text-slate-400">
                                        #{s.id}
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800 max-w-[150px] truncate">
                                        {s.client_name}
                                    </td>
                                    <td className="p-3 text-xs text-slate-500 hidden sm:table-cell">
                                        {s.seller_name}
                                    </td>
                                    <td className="p-3 text-xs text-slate-400 hidden md:table-cell whitespace-nowrap">
                                        {formatDateTime(s.order_date)}
                                    </td>
                                    <td className="p-3 hidden md:table-cell">
                                        {s.payment_method ? (
                                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                                {s.payment_method}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 pr-5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                                        {formatCurrency(s.total_amount, 'PEN')}
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
