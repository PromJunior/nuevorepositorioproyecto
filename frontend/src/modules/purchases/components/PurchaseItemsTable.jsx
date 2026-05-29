import React from 'react';
import { Trash2 } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { formatCurrency } from '../../../shared/utils/formatters';

/**
 * Tabla editable de ítems de compra.
 * Props:
 *  - items: [{ product_id, product_name, quantity, unit_cost, sub_amount }]
 *  - onUpdate(index, field, value)
 *  - onRemove(index)
 *  - readOnly: boolean (para vista de detalle)
 */
export const PurchaseItemsTable = ({ items = [], onUpdate, onRemove, readOnly = false }) => {
    const total = items.reduce((s, it) => s + Number(it.sub_amount || 0), 0);

    if (items.length === 0) {
        return (
            <Card className="flex flex-col items-center gap-2 p-8 text-center text-slate-400">
                <p className="text-sm font-semibold">Sin productos agregados</p>
                <p className="text-xs">Busca y selecciona productos usando el buscador de arriba.</p>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="p-3 pl-5">Producto</th>
                            <th className="p-3 text-right w-28">Cantidad</th>
                            <th className="p-3 text-right w-32">Costo unit. (S/)</th>
                            <th className="p-3 text-right w-32">Subtotal</th>
                            {!readOnly && <th className="p-3 w-12" />}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                            <tr key={item.product_id} className="hover:bg-slate-50/50">
                                <td className="p-3 pl-5 font-medium text-slate-800">
                                    {item.product_name}
                                </td>
                                <td className="p-3 text-right">
                                    {readOnly ? (
                                        <span className="font-mono font-bold">{item.quantity}</span>
                                    ) : (
                                        <Input
                                            type="number"
                                            min={1}
                                            className="w-24 text-right font-mono"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                onUpdate(idx, 'quantity', Number(e.target.value))
                                            }
                                        />
                                    )}
                                </td>
                                <td className="p-3 text-right">
                                    {readOnly ? (
                                        <span className="font-mono">{formatCurrency(item.unit_cost, 'PEN')}</span>
                                    ) : (
                                        <Input
                                            type="number"
                                            min={0.01}
                                            step={0.01}
                                            className="w-28 text-right font-mono"
                                            value={item.unit_cost}
                                            onChange={(e) =>
                                                onUpdate(idx, 'unit_cost', Number(e.target.value))
                                            }
                                        />
                                    )}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                    {formatCurrency(item.sub_amount, 'PEN')}
                                </td>
                                {!readOnly && (
                                    <td className="p-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => onRemove(idx)}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td colSpan={readOnly ? 3 : 4} className="p-3 pl-5 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                                Total compra
                            </td>
                            <td className="p-3 pr-5 text-right font-mono text-base font-black text-slate-900">
                                {formatCurrency(total, 'PEN')}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </Card>
    );
};
