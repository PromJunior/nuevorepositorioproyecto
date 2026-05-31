import React, { useState } from 'react';
import { Banknote, Loader2 } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';

/**
 * Formulario de apertura de caja.
 * Recibe `onOpen(amount)` y `isLoading`.
 */
export const OpenSessionForm = ({ onOpen, isLoading, minimumAmount = 0, suggestedAmount = 0 }) => {
    const [amount, setAmount] = useState(suggestedAmount ? String(suggestedAmount) : '');

    const handleSubmit = (e) => {
        e.preventDefault();
        const value = parseFloat(amount);
        if (isNaN(value) || value < minimumAmount) return;
        onOpen(value);
    };

    return (
        <Card className="p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                <Banknote size={15} className="text-blue-500" />
                Apertura de caja
            </h2>
            <p className="mb-4 text-xs font-medium text-slate-500">
                Ingresa el monto inicial con el que abres la caja para esta jornada.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Monto inicial (S/.) minimo {minimumAmount.toFixed(2)}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">S/</span>
                        <Input
                            type="number"
                            step="0.01"
                            min={minimumAmount}
                            placeholder="0.00"
                            className="pl-9 font-mono"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <Button
                    type="submit"
                    disabled={isLoading || amount === ''}
                    className="shrink-0"
                >
                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Banknote size={15} />}
                    Abrir caja
                </Button>
            </form>
        </Card>
    );
};
