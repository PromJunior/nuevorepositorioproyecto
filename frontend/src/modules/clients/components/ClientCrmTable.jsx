import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../../shared/components/Table';
import { formatCurrency, formatDateTime, formatNumber } from '../../../shared/utils/formatters';
import { ClientSegmentBadge } from './ClientSegmentBadge';

export const ClientCrmTable = ({ clients = [], onView }) => (
    <Table>
        <TableHead>
            <tr>
                <TableCell as="th">Cliente</TableCell>
                <TableCell as="th">Segmento</TableCell>
                <TableCell as="th">Recency</TableCell>
                <TableCell as="th">Frecuencia</TableCell>
                <TableCell as="th">Monetary</TableCell>
                <TableCell as="th">Ultima compra</TableCell>
                <TableCell as="th" className="text-right">Acciones</TableCell>
            </tr>
        </TableHead>
        <TableBody>
            {clients.map((client) => (
                <TableRow key={client.id}>
                    <TableCell>
                        <p className="font-black text-slate-900">{client.full_name}</p>
                        <p className="text-xs text-slate-400">{client.dni} · {client.email}</p>
                    </TableCell>
                    <TableCell><ClientSegmentBadge segment={client.segment} /></TableCell>
                    <TableCell>{client.recency_days == null ? '-' : `${client.recency_days} dias`}</TableCell>
                    <TableCell>{formatNumber(client.frequency)}</TableCell>
                    <TableCell className="font-black text-slate-900">{formatCurrency(client.monetary, 'PEN')}</TableCell>
                    <TableCell>{formatDateTime(client.last_purchase)}</TableCell>
                    <TableCell>
                        <div className="flex justify-end">
                            <Button variant="secondary" className="px-3" onClick={() => onView(client)} title="Ver detalle">
                                <Eye size={15} />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);
