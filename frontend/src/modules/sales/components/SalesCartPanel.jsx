import React from 'react';
import { Minus, Plus, Receipt, Trash2 } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { formatCurrency } from '../../../shared/utils/formatters';

export const SalesCartPanel = ({
    items,
    total,
    paymentMethods,
    selectedPaymentMethod,
    onPaymentMethodChange,
    selectedClient,
    onQuantityChange,
    onRemove,
    onConfirmSale,
    isSaving,
}) => (
    <Card className="sticky top-20 p-5">
        <div className="mb-5 flex items-center justify-between">
            <div>
                <h2 className="text-lg font-black text-slate-900">Resumen de venta</h2>
                <p className="text-xs font-semibold text-slate-400">{selectedClient?.full_name || 'Venta Mostrador'}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Receipt size={20} />
            </div>
        </div>

        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
                    El carrito esta vacio.
                </div>
            ) : items.map((item) => (
                <div key={item.product_id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">{item.name_product}</p>
                            <p className="text-xs font-semibold text-slate-400">{formatCurrency(item.price)} x unidad</p>
                        </div>
                        <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => onRemove(item.product_id)}>
                            <Trash2 size={15} />
                        </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <Button variant="secondary" className="h-8 px-2" onClick={() => onQuantityChange(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                <Minus size={14} />
                            </Button>
                            <input
                                className="h-8 w-14 rounded-lg border border-slate-200 text-center text-sm font-black outline-none"
                                type="number"
                                min="1"
                                max={item.stock || 9999}
                                value={item.quantity}
                                onChange={(event) => onQuantityChange(item.product_id, event.target.value)}
                            />
                            <Button variant="secondary" className="h-8 px-2" onClick={() => onQuantityChange(item.product_id, item.quantity + 1)} disabled={item.stock && item.quantity >= item.stock}>
                                <Plus size={14} />
                            </Button>
                        </div>
                        <p className="font-black text-slate-900">{formatCurrency(Number(item.price) * Number(item.quantity))}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Metodo de pago</label>
            <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                value={selectedPaymentMethod || ''}
                onChange={(event) => onPaymentMethodChange(Number(event.target.value))}
            >
                {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>{method.name_payment_method}</option>
                ))}
            </select>

            <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">Total</span>
                <span className="text-2xl font-black text-blue-700">{formatCurrency(total)}</span>
            </div>

            <Button className="mt-5 w-full" disabled={items.length === 0 || isSaving || !selectedPaymentMethod} onClick={onConfirmSale}>
                <Receipt size={17} />
                {isSaving ? 'Procesando...' : 'Confirmar venta'}
            </Button>
        </div>
    </Card>
);
