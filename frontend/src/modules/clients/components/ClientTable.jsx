import React from 'react';
import { Eye, Pencil, UserX } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../../shared/components/Table';
import { formatDateTime } from '../../../shared/utils/formatters';

const StatusBadge = ({ active }) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {active ? 'Activo' : 'Inactivo'}
    </span>
);

export const ClientTable = ({ clients, onView, onEdit, onDeactivate, canManage = false }) => (
    <Table>
        <TableHead>
            <tr>
                <TableCell as="th">DNI</TableCell>
                <TableCell as="th">Nombre</TableCell>
                <TableCell as="th">Email</TableCell>
                <TableCell as="th">Telefono</TableCell>
                <TableCell as="th">Estado</TableCell>
                <TableCell as="th">Registro</TableCell>
                <TableCell as="th" className="text-right">Acciones</TableCell>
            </tr>
        </TableHead>
        <TableBody>
            {clients.map((client) => (
                <TableRow key={client.id}>
                    <TableCell className="font-mono font-bold text-slate-700">{client.dni}</TableCell>
                    <TableCell>
                        <p className="font-black text-slate-900">{client.full_name}</p>
                        <p className="text-xs text-slate-400">{client.address || 'Sin direccion'}</p>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell><StatusBadge active={client.is_active} /></TableCell>
                    <TableCell>{formatDateTime(client.create_at)}</TableCell>
                    <TableCell>
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" className="px-3" onClick={() => onView(client)} title="Ver detalle">
                                <Eye size={15} />
                            </Button>
                            {canManage && (
                                <>
                                    <Button variant="secondary" className="px-3" onClick={() => onEdit(client)} title="Editar cliente">
                                        <Pencil size={15} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="px-3 text-red-600 hover:bg-red-50"
                                        disabled={!client.is_active}
                                        onClick={() => onDeactivate(client)}
                                        title="Desactivar cliente"
                                    >
                                        <UserX size={15} />
                                    </Button>
                                </>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);
