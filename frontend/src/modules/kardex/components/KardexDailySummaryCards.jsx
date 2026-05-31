import React, { useMemo } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Coins, ShoppingCart } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';

const formatNumber = (value) => new Intl.NumberFormat('es-PE').format(Number(value || 0));
const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value || 0));

const CARD_META = [
    {
        key: 'stock_entries',
        label: 'Entradas Totales',
        icon: ArrowDownToLine,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        format: formatNumber,
    },
    {
        key: 'stock_outputs',
        label: 'Salidas Totales',
        icon: ArrowUpFromLine,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        format: formatNumber,
    },
    {
        key: 'sales_count',
        label: 'Ventas Totales',
        icon: ShoppingCart,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        format: formatNumber,
    },
    {
        key: 'sales_amount',
        label: 'Monto Vendido',
        icon: Coins,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        format: formatCurrency,
    },
];

export const KardexDailySummaryCards = ({ rows = [] }) => {
    const totals = useMemo(
        () =>
            rows.reduce(
                (acc, row) => ({
                    stock_entries: acc.stock_entries + Number(row.stock_entries || 0),
                    stock_outputs: acc.stock_outputs + Number(row.stock_outputs || 0),
                    sales_count: acc.sales_count + Number(row.sales_count || 0),
                    sales_amount: acc.sales_amount + Number(row.sales_amount || 0),
                }),
                { stock_entries: 0, stock_outputs: 0, sales_count: 0, sales_amount: 0 }
            ),
        [rows]
    );

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CARD_META.map(({ key, label, icon, color, bg, format }) => {
                const IconComponent = icon;
                return (
                    <Card key={key} className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
                                <p className="mt-2 text-2xl font-black text-slate-900">{format(totals[key])}</p>
                            </div>
                            <div className={`rounded-xl ${bg} p-3 ${color}`}>
                                <IconComponent size={22} />
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};
