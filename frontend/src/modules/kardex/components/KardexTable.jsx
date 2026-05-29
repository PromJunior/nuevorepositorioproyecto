import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Pagination } from '../../../shared/components/Pagination';
import { MovementTypeBadge } from './MovementTypeBadge';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';

const SOURCE_LABELS = {
    orders: 'Venta',
    purchases: 'Compra',
    manual: 'Manual',
};

/**
 * Tabla principal del Kardex General.
 *
 * Props:
 *  - items: InventoryTransactionResponse[]
 *  - total: number
 *  - page: number (1-indexed)
 *  - pageSize: number
 *  - onPageChange(newPage)
 *  - isFetching: boolean
 */
export const KardexTable = ({ items = [], total = 0, page, pageSize, onPageChange, isFetching }) => {
    const navigate = useNavigate();
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-3">
            {/* Conteo + estado fetching */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                    {total === 0
                        ? 'Sin movimientos'
                        : `${total} movimiento${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
                    {isFetching && (
                        <span className="ml-2 animate-pulse text-blue-400">actualizando…</span>
                    )}
                </span>
                <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <th className="p-3 pl-5">Fecha</th>
                                <th className="p-3">Producto</th>
                                <th className="p-3">Tipo</th>
                                <th className="p-3">Concepto</th>
                                <th className="p-3 text-right">Cantidad</th>
                                <th className="p-3 text-right">Saldo</th>
                                <th className="p-3 text-right">Costo unit.</th>
                                <th className="p-3 text-right">Valor saldo</th>
                                <th className="p-3">Usuario</th>
                                <th className="p-3">Origen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-14 text-center text-sm italic text-slate-400">
                                        No hay movimientos con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                items.map((tx) => (
                                    <tr key={tx.id} className="group transition-colors hover:bg-slate-50/60">
                                        <td className="p-3 pl-5 text-xs text-slate-500">
                                            {formatDateTime(tx.created_at)}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() =>
                                                    navigate(`/kardex/producto/${tx.product_id}`)
                                                }
                                                className="flex items-center gap-1.5 text-left font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                                            >
                                                {tx.product_name}
                                                <ExternalLink
                                                    size={11}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400"
                                                />
                                            </button>
                                            {tx.category_name && (
                                                <span className="block text-[11px] text-slate-400">
                                                    {tx.category_name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <MovementTypeBadge type={tx.transaction_type} />
                                        </td>
                                        <td className="p-3 text-xs text-slate-500 max-w-[160px] truncate">
                                            {tx.concept}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold">
                                            <span
                                                className={
                                                    tx.transaction_type === 'ENTRADA'
                                                        ? 'text-emerald-600'
                                                        : tx.transaction_type === 'SALIDA'
                                                        ? 'text-rose-600'
                                                        : 'text-indigo-600'
                                                }
                                            >
                                                {tx.transaction_type === 'SALIDA' ? '-' : '+'}
                                                {tx.quantity}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-mono text-slate-800 font-bold">
                                            {tx.balance_stock}
                                        </td>
                                        <td className="p-3 text-right font-mono text-slate-500">
                                            {formatCurrency(tx.unit_cost, 'PEN')}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                                            {formatCurrency(tx.balance_value, 'PEN')}
                                        </td>
                                        <td className="p-3 text-xs text-slate-500">
                                            {tx.username}
                                        </td>
                                        <td className="p-3">
                                            {tx.source_type ? (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                                    {SOURCE_LABELS[tx.source_type] ?? tx.source_type}
                                                    {tx.source_id && (
                                                        <span className="text-slate-400">
                                                            #{tx.source_id}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Paginación inferior */}
            {totalPages > 1 && (
                <div className="flex justify-end">
                    <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
                </div>
            )}
        </div>
    );
};
