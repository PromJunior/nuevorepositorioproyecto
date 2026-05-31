import React from 'react';
import { Edit2 } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { formatDateTime } from '../../../shared/utils/formatters';

/**
 * Tabla de proveedores.
 * Props:
 *  - suppliers: SupplierResponse[]
 *  - onEdit(supplier)
 *  - onViewDetail?(supplier)
 */
export const SupplierTable = ({ suppliers = [], onEdit, onViewDetail }) => (
    <Card className="overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="p-3 pl-5">RUC</th>
                        <th className="p-3">Razón social</th>
                        <th className="p-3">Teléfono</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Registrado</th>
                        <th className="p-3 pr-5" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {suppliers.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-12 text-center text-sm italic text-slate-400">
                                No hay proveedores que mostrar.
                            </td>
                        </tr>
                    ) : (
                        suppliers.map((s) => (
                            <tr key={s.id} className="transition-colors hover:bg-slate-50/60">
                                <td className="p-3 pl-5 font-mono text-xs font-bold text-slate-500">
                                    {s.ruc}
                                </td>
                                <td className="p-3 font-semibold text-slate-800">{s.company_name}</td>
                                <td className="p-3 text-xs text-slate-500">{s.phone || '—'}</td>
                                <td className="p-3 text-xs text-slate-500">{s.email || '—'}</td>
                                <td className="p-3 text-xs text-slate-400">
                                    {formatDateTime(s.created_at)}
                                </td>
                                <td className="p-3 pr-5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {onViewDetail && (
                                            <Button
                                                variant="ghost"
                                                className="px-2 py-1.5 text-xs text-slate-400"
                                                onClick={() => onViewDetail(s)}
                                            >
                                                Ver
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            className="px-2 py-1.5 text-xs"
                                            onClick={() => onEdit(s)}
                                        >
                                            <Edit2 size={13} /> Editar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </Card>
);
