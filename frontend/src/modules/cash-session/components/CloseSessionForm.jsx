import React, { useState } from 'react';
import { CheckCircle2, Loader2, Scale, ShieldAlert } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { formatCurrency } from '../../../shared/utils/formatters';

/**
 * Formulario de cierre de caja.
 * Props:
 *  - expectedAmount: número del sistema
 *  - onClose(closingAmount): callback
 *  - isLoading: boolean
 */
export const CloseSessionForm = ({ expectedAmount = 0, onClose, isLoading }) => {
    const [counted, setCounted] = useState('');
    const [observations, setObservations] = useState('');

    const parsedCounted = parseFloat(counted) || 0;
    const difference = parsedCounted - expectedAmount;
    const hasCounted = counted !== '';

    const getDiffStyle = () => {
        if (!hasCounted)
            return { text: 'Ingresa el monto contado para ver la diferencia', color: 'text-slate-400', bg: 'bg-slate-50', icon: <Scale size={14} /> };
        if (difference === 0)
            return { text: 'Caja cuadrada perfecta', color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-200', icon: <CheckCircle2 size={14} /> };
        if (difference < 0)
            return { text: `Faltante de ${formatCurrency(Math.abs(difference), 'PEN')}`, color: 'text-rose-600', bg: 'bg-rose-50 border border-rose-200', icon: <ShieldAlert size={14} /> };
        return { text: `Sobrante de ${formatCurrency(difference, 'PEN')}`, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-200', icon: <Scale size={14} /> };
    };

    const diff = getDiffStyle();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!hasCounted) return;
        onClose(parsedCounted, observations);
    };

    return (
        <Card className="p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                <Scale size={15} className="text-blue-500" />
                Cierre de caja
            </h2>
            <p className="mb-4 text-xs font-medium text-slate-500">
                Ingresa el efectivo contado físicamente para calcular la diferencia.
            </p>

            {/* Monto esperado por el sistema */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">Efectivo esperado (sistema)</span>
                <span className="font-mono text-base font-black text-slate-900">
                    {formatCurrency(expectedAmount, 'PEN')}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Monto contado */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Efectivo contado (S/.)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">S/</span>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-9 font-mono"
                            value={counted}
                            onChange={(e) => setCounted(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Feedback diferencia */}
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${diff.bg} ${diff.color}`}>
                    {diff.icon}
                    <span>{diff.text}</span>
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Observaciones (opcional)
                    </label>
                    <textarea
                        rows={2}
                        placeholder="Justifica cualquier diferencia, billetes rotos, etc."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                    />
                </div>

                <Button
                    type="submit"
                    variant="default"
                    disabled={isLoading || !hasCounted}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    Cerrar caja
                </Button>
            </form>
        </Card>
    );
};
