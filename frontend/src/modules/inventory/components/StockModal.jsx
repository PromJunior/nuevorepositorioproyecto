import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, PackagePlus, X } from 'lucide-react';
import { stockAdjustmentSchema } from '../schemas/productSchema';

const MotionDiv = motion.div;

export const StockModal = ({ isOpen, onClose, onSubmit, product, isSaving = false }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(stockAdjustmentSchema),
        defaultValues: { amount: '' },
    });

    useEffect(() => {
        if (isOpen) {
            reset({ amount: '' });
        }
    }, [isOpen, reset]);

    const handleFormSubmit = async (data) => {
        await onSubmit(data.amount);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && product && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <button type="button" aria-label="Cerrar modal" className="absolute inset-0 cursor-default" onClick={onClose} />

                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                    >
                        <header className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-slate-900">Abastecer stock</h2>
                                <p className="mt-1 text-xs font-medium text-slate-400">{product.name_product}</p>
                            </div>
                            <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                                <X size={18} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock actual</span>
                                <span className="mt-1 block text-xl font-black text-slate-800">{product.stock} u.</span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Unidades a sumar</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Cantidad"
                                    {...register('amount')}
                                    className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-600/10 ${
                                        errors.amount ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                    }`}
                                />
                                {errors.amount && (
                                    <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                                        <AlertCircle size={13} /> {errors.amount.message}
                                    </span>
                                )}
                            </div>

                            <footer className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isSaving}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <PackagePlus size={14} />
                                    {isSubmitting || isSaving ? 'Sumando...' : 'Sumar stock'}
                                </button>
                            </footer>
                        </form>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
    );
};
