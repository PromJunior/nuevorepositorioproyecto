import React from 'react';
import { Banknote, Receipt, Scale, TrendingUp } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatCurrency } from '../../../shared/utils/formatters';

const KpiCard = ({ icon, label, value, sub, color = 'text-slate-800' }) => {
    const IconComponent = icon;
    return (
        <Card className="flex items-center justify-between p-5">
            <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
                <span className={`block text-xl font-black tracking-tight ${color}`}>{value}</span>
                {sub && <span className="block text-[11px] font-medium text-slate-400">{sub}</span>}
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-slate-400">
                <IconComponent size={20} />
            </div>
        </Card>
    );
};

/**
 * 4 tarjetas KPI con el resumen de la sesión activa.
 * `summary` → objeto de /cash-session/active/summary
 */
export const SessionSummaryCards = ({ summary }) => {
    if (!summary) return null;

    const expected = Number(summary.expected_amount ?? summary.opening_amount ?? 0);
    const totalSales = Number(summary.total_sales ?? 0);
    const opening = Number(summary.opening_amount ?? 0);
    const diff = Number(summary.difference ?? 0);
    const breakdown = summary.payment_breakdown || [];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
                icon={Receipt}
                label="Ventas del día"
                value={formatCurrency(totalSales, 'PEN')}
                sub={`${summary.total_orders ?? 0} transacciones`}
                color="text-slate-900"
            />
            <KpiCard
                icon={Banknote}
                label="Fondo inicial"
                value={formatCurrency(opening, 'PEN')}
                sub="Monto de apertura"
            />
            <KpiCard
                icon={TrendingUp}
                label="Efectivo esperado"
                value={formatCurrency(expected, 'PEN')}
                sub="Apertura + ventas"
                color="text-blue-700"
            />
            <KpiCard
                icon={Scale}
                label="Diferencia"
                value={diff === 0 ? 'Cuadrado' : formatCurrency(diff, 'PEN')}
                sub={diff === 0 ? 'Sin descuadre' : diff > 0 ? 'Sobrante' : 'Faltante'}
                color={diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-indigo-600' : 'text-rose-600'}
            />
            {breakdown.length > 0 && (
                <Card className="p-5 sm:col-span-2 xl:col-span-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Desglose por metodo de pago
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {breakdown.map((item) => (
                            <div key={item.payment_method_id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-black text-slate-700">{item.payment_method}</span>
                                    <span className="font-mono text-sm font-black text-slate-900">
                                        {formatCurrency(item.total_sales, 'PEN')}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                                    {item.total_orders} transacciones
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
