import React from 'react';
import { Card } from '../../../shared/components/ui/card';

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(`${value}T00:00:00`).toLocaleDateString('es-PE');
};

const formatNumber = (value) => new Intl.NumberFormat('es-PE').format(Number(value || 0));
const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value || 0));

export const KardexDailySummaryTable = ({ rows = [] }) => (
    <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-black text-slate-800">Resumen diario del Kardex</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                    <tr>
                        <th className="px-4 py-3 text-left">Fecha</th>
                        <th className="px-4 py-3 text-right">Entradas de Stock</th>
                        <th className="px-4 py-3 text-right">Salidas de Stock</th>
                        <th className="px-4 py-3 text-right">Ajustes</th>
                        <th className="px-4 py-3 text-right">Saldo Neto</th>
                        <th className="px-4 py-3 text-right">Cantidad de Ventas</th>
                        <th className="px-4 py-3 text-right">Monto Total Vendido</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((row) => (
                        <tr key={row.date} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-bold text-slate-700">{formatDate(row.date)}</td>
                            <td className="px-4 py-3 text-right text-emerald-700">
                                {formatNumber(row.stock_entries)}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-700">
                                {formatNumber(row.stock_outputs)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                                {formatNumber(row.stock_adjustments)}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">
                                {formatNumber(row.net_stock_movement)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                                {formatNumber(row.sales_count)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                                {formatCurrency(row.sales_amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);
