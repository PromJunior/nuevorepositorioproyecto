import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { productSchema } from '../schemas/productSchema';

const MotionDiv = motion.div;

export const ProductModal = ({ isOpen, onClose, onSubmit, categories = [], productToEdit = null, isSaving = false }) => {
    const isEditMode = !!productToEdit;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name_product: '',
            price: '',
            stock: 0,
            category_id: '',
            description: '',
            stockProduct: true,
        },
    });

    useEffect(() => {
        if (!isOpen) return;

        if (productToEdit) {
            reset({
                name_product: productToEdit.name_product || '',
                price: Number(productToEdit.price) || 0,
                stock: Number(productToEdit.stock) || 0,
                category_id: productToEdit.category_id || '',
                description: productToEdit.description || '',
                stockProduct: productToEdit.stockProduct !== false,
            });
            return;
        }

        reset({
            name_product: '',
            price: '',
            stock: 0,
            category_id: '',
            description: '',
            stockProduct: true,
        });
    }, [isOpen, productToEdit, reset]);

    const handleFormSubmit = async (data) => {
        await onSubmit({
            ...data,
            stock: isEditMode ? Number(productToEdit.stock || 0) : data.stock,
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
                    <button type="button" aria-label="Cerrar modal" className="absolute inset-0 cursor-default" onClick={onClose} />

                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 font-sans shadow-2xl"
                    >
                        <header className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-black tracking-tight text-slate-800">
                                {isEditMode ? 'Ficha de producto' : 'Crear nuevo producto'}
                            </h2>
                            <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                                <X size={18} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 overflow-y-auto pr-1">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Nombre del producto</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Computadora de escritorio"
                                    {...register('name_product')}
                                    className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-600/10 ${
                                        errors.name_product ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                    }`}
                                />
                                {errors.name_product && (
                                    <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                                        <AlertCircle size={13} /> {errors.name_product.message}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Precio ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register('price')}
                                        className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-600/10 ${
                                            errors.price ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                        }`}
                                    />
                                    {errors.price && (
                                        <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                                            <AlertCircle size={13} /> {errors.price.message}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock</label>
                                    <input
                                        type="number"
                                        readOnly={isEditMode}
                                        {...register('stock')}
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-bold outline-none transition ${
                                            isEditMode
                                                ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
                                                : `bg-slate-50 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-600/10 ${
                                                    errors.stock ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                                }`
                                        }`}
                                    />
                                    {errors.stock && (
                                        <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                                            <AlertCircle size={13} /> {errors.stock.message}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Categoria</label>
                                <select
                                    {...register('category_id')}
                                    className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-600/10 ${
                                        errors.category_id ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                    }`}
                                >
                                    <option value="">Seleccione una categoria</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name_category}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                                        <AlertCircle size={13} /> {errors.category_id.message}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Detalles / descripcion</label>
                                <textarea
                                    rows="2"
                                    placeholder="Descripcion adicional del articulo..."
                                    {...register('description')}
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50 p-3.5">
                                <div className="space-y-0.5">
                                    <span className="block text-xs font-bold text-slate-700">Habilitar disponibilidad</span>
                                    <span className="text-[10px] font-medium text-slate-400">Permitir la comercializacion inmediata</span>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input type="checkbox" {...register('stockProduct')} className="peer sr-only" />
                                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                </label>
                            </div>

                            <footer className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isSaving}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Save size={14} />
                                    {isSubmitting || isSaving ? 'Guardando...' : (isEditMode ? 'Guardar cambios' : 'Registrar producto')}
                                </button>
                            </footer>
                        </form>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
    );
};
