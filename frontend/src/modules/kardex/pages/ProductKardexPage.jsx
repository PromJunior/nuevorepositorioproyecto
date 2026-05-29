import React from 'react';
import { useParams } from 'react-router-dom';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Pagination } from '../../../shared/components/Pagination';
import { useProductKardex } from '../hooks/useKardex';
import { ProductKardexHeader } from '../components/ProductKardexHeader';
import { MovementTypeBadge } from '../components/MovementTypeBadge';
import { formatCurrency, formatDateTime, formatNumber } from '../../../shared/utils/formatters';

const PAGE_SIZE = 100;

const SOURCE_LABELS = {
    orders: 'Venta',
    purchases: 'Compra',
    manual: 'Manual',
};

const ProductKardexPage = () => {
    const { productId } = useParams();
    const [page, setPage] = React.useState(1);

    const kardexQuery = useProductKardex(productId, {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
    });

    const data = kardexQuery.data;
    const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <DataState
                isLoading={kardexQuery.isLoading}
                isError={kardexQuery.isError}
                loadingLabel="Cargando Kardex del producto..."
                errorTitle="No se pudo cargar el Kardex"
                errorDescription="Verifica que el producto exista o intenta de nuevo."
            >
                {data && (
                    <>
                        {/* Header con info del producto */}
                        <ProductKardexHeader
                            product={data.product}
                            totalEntries={data.total_entries}
                            totalExits={data.total_exits}
                            totalAdjustments={data.total_adjustments}
                        />

                        {/* Tabla cronológica */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    Movimientos cronológicos — {formatNumber(data.total)} registros
                                </span>
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            </div>

                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                <th className="p-3 pl-5">Fecha</th>
                                                <th className="p-3">Tipo</th>
                                                <th className="p-3">Concepto</th>
                                                <th className="p-3 text-right">Entrada</th>
                                                <th className="p-3 text-right">Salida</th>
                                                <th className="p-3 text-right">Saldo</th>
                                                <th className="p-3 text-right">Costo unit.</th>
                                                <th className="p-3 text-right">Valor acumulado</th>
                                                <th className="p-3">Usuario</th>
                                                <th className="p-3">Documento origen</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                            {data.items.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={10}
                                                        className="py-14 text-center text-sm italic text-slate-400"
                                                    >
                                                        No hay movimientos registrados para este producto.
                                                    </td>
                                                </tr>
                                            ) : (
                                                data.items.map((tx, idx) => {
                                                    const isEntry = tx.transaction_type === 'ENTRADA';
                                                    const isExit = tx.transaction_type === 'SALIDA';
                                                    return (
                                                        <tr
                                                            key={tx.id}
                                                            className={`transition-colors hover:bg-slate-50/60 ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                                                        >
                                                            <td className="p-3 pl-5 text-xs text-slate-500">
                                                                {formatDateTime(tx.created_at)}
                                                            </td>
                                                            <td className="p-3">
                                                                <MovementTypeBadge
                                                                    type={tx.transaction_type}
                                                                />
                                                            </td>
                                                            <td className="p-3 max-w-[180px] truncate text-xs text-slate-600">
                                                                {tx.concept}
                                                            </td>
                                                            {/* Entrada */}
                                                            <td className="p-3 text-right font-mono font-bold">
                                                                {isEntry ? (
                                                                    <span className="text-emerald-600">
                                                                        +{formatNumber(tx.quantity)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">—</span>
                                                                )}
                                                            </td>
                                                            {/* Salida */}
                                                            <td className="p-3 text-right font-mono font-bold">
                                                                {isExit ? (
                                                                    <span className="text-rose-600">
                                                                        -{formatNumber(tx.quantity)}
                                                                    </span>
                                                                ) : !isEntry ? (
                                                                    <span className="text-indigo-600">
                                                                        {formatNumber(tx.quantity)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">—</span>
                                                                )}
                                                            </td>
                                                            {/* Saldo */}
                                                            <td className="p-3 text-right font-mono text-base font-black text-slate-900">
                                                                {formatNumber(tx.balance_stock)}
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
                                                                        {SOURCE_LABELS[tx.source_type] ??
                                                                            tx.source_type}
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
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {totalPages > 1 && (
                                <div className="flex justify-end">
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DataState>
        </div>
    );
};

export default ProductKardexPage;
