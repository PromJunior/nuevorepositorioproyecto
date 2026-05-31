import React from 'react';
import { DataState } from '../../../shared/components/DataState';
import { Pagination } from '../../../shared/components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../../shared/components/Table';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';

export const ClientPurchaseHistory = ({ history, isLoading, isError, page, pageSize, onPageChange }) => {
    const items = history?.items || [];
    const totalPages = Math.ceil((history?.total || 0) / pageSize);

    return (
        <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && items.length === 0}
            loadingLabel="Cargando historial..."
            emptyTitle="Sin compras registradas"
            emptyDescription="Este cliente aun no tiene ventas asociadas."
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400">{history?.total || 0} ventas registradas</p>
                    <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
                </div>
                <Table>
                    <TableHead>
                        <tr>
                            <TableCell as="th">Fecha</TableCell>
                            <TableCell as="th">N Orden</TableCell>
                            <TableCell as="th">Total</TableCell>
                            <TableCell as="th">Metodo pago</TableCell>
                            <TableCell as="th">Vendedor</TableCell>
                            <TableCell as="th">Estado</TableCell>
                        </tr>
                    </TableHead>
                    <TableBody>
                        {items.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{formatDateTime(order.order_date)}</TableCell>
                                <TableCell className="font-mono font-black">#{order.id}</TableCell>
                                <TableCell className="font-black text-slate-900">{formatCurrency(order.total_amount, 'PEN')}</TableCell>
                                <TableCell>{order.payment_method || '-'}</TableCell>
                                <TableCell>{order.seller_name || '-'}</TableCell>
                                <TableCell>{order.status_name || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </DataState>
    );
};
