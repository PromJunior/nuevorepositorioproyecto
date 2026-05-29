import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/ui/card';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';

/**
 * Tabla de listado de compras.
 * Props:
 *  - purchases: PurchaseResponse[]
 */
export const PurchaseTable = ({ purchases = [] }) => {
    const navigate = useNavigate();

    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="p-3 pl-5">#</th>
                            <th className="p-3">Proveedor</th>
                            <th className="p-3">N° Factura</th>
                            <th className="p-3">Fecha</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 text-center">Estado</th>
                            <th className="p-3 pr-5" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {purchases.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-sm italic text-slate-400">
                                    No hay compras que mostrar.
                                </td>
                            </tr>
                        ) : (
                            purchases.map((p) => (
                                <tr
                                    key={p.id}
                                    className="cursor-pointer transition-colors hover:bg-slate-50/70"
                                    onClick={() => navigate(`/compras/${p.id}`)}
                                >
                                    <td className="p-3 pl-5 font-mono text-xs font-bold text-slate-400">
                                        #{p.id}
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800">
                                        {p.supplier?.company_name || `Proveedor #${p.supplier_id}`}
                                        <span className="block text-[11px] font-normal text-slate-400">
                                            {p.supplier?.ruc}
                                        </span>
                                    </td>
                                    <td className="p-3 font-mono text-xs text-slate-500">
                                        {p.invoice_number || '—'}
                                    </td>
                                    <td className="p-3 text-xs text-slate-500">
                                        {formatDateTime(p.purchase_date)}
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                                        {formatCurrency(p.total_amount, 'PEN')}
                                    </td>
                                    <td className="p-3 text-center">
                                        <PurchaseStatusBadge status={p.status?.name_status} />
                                    </td>
                                    <td className="p-3 pr-5 text-right text-[11px] font-bold text-blue-500 hover:underline">
                                        Ver →
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
