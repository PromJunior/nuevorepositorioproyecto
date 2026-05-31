import React from 'react';
import { Package, Receipt, TrendingUp } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';

const StatChip = ({ icon, label, value }) => {
    const IconComp = icon;
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <IconComp size={16} />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-sm font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
};

/**
 * Tarjeta de resumen de la compra (total, ítems, estado).
 *
 * Props:
 *  - items:  [{ product_id, quantity, unit_cost, sub_amount }]
 *  - status: string | null
 */
export const PurchaseSummary = ({ items = [], status = null }) => {
    const total = items.reduce((s, it) => s + Number(it.sub_amount || 0), 0);
    const totalUnits = items.reduce((s, it) => s + Number(it.quantity || 0), 0);

    return (
        <Card className="p-5">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Resumen de la compra
            </p>
            <div className="flex flex-wrap gap-6">
                <StatChip
                    icon={Package}
                    label="Productos"
                    value={`${formatNumber(items.length)} línea${items.length !== 1 ? 's' : ''}`}
                />
                <StatChip
                    icon={Receipt}
                    label="Unidades"
                    value={formatNumber(totalUnits)}
                />
                <StatChip
                    icon={TrendingUp}
                    label="Total compra"
                    value={formatCurrency(total, 'PEN')}
                />
            </div>

            {status && (
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-400">
                    Estado:&nbsp;
                    <span className={
                        status === 'RECIBIDA' ? 'text-emerald-600' :
                        status === 'CANCELADA' ? 'text-slate-500' :
                        'text-amber-600'
                    }>
                        {status === 'BORRADOR' ? 'Borrador — sin afectar stock' :
                         status === 'RECIBIDA' ? 'Recibida — stock actualizado' :
                         'Cancelada'}
                    </span>
                </div>
            )}
        </Card>
    );
};
