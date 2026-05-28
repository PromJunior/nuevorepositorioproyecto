import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';

// Esquema de validación estricto con Zod
const productSchema = z.object({
    name_product: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    price: z.coerce.number().positive({ message: 'El precio debe ser mayor a 0.' }),
    stock: z.coerce.number().int().nonnegative({ message: 'El stock no puede ser negativo.' }),
    category_id: z.coerce.number().int().positive({ message: 'Selecciona una categoría válida.' }),
    description: z.string().optional(),
    stockProduct: z.boolean().default(true),
});

export const ProductModal = ({ isOpen, onClose, onSubmit, categories, productToEdit = null }) => {
    const isEditMode = !!productToEdit;

    // React Hook Form integrado con el validador Zod
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name_product: '',
            price: 0,
            stock: 0,
            category_id: '',
            description: '',
            stockProduct: true,
        }
    });

    // Resetear formulario con los datos a editar cuando el modal se abre
    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                reset({
                    name_product: productToEdit.name_product || '',
                    price: parseFloat(productToEdit.price) || 0,
                    stock: parseInt(productToEdit.stock) || 0,
                    category_id: productToEdit.category_id || '',
                    description: productToEdit.description || '',
                    stockProduct: productToEdit.stockProduct !== false,
                });
            } else {
                reset({
                    name_product: '',
                    price: '',
                    stock: 0,
                    category_id: '',
                    description: '',
                    stockProduct: true,
                });
            }
        }
    }, [isOpen, productToEdit, reset]);

    const handleFormSubmit = async (data) => {
        await onSubmit(data);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
                    
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

                    {/* Contenedor Animado del Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden z-10 flex flex-col gap-5 max-h-[90vh] font-sans"
                    >
                        {/* Header con botón de cerrar */}
                        <header className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                {isEditMode ? 'Ficha de Producto' : 'Crear Nuevo Producto'}
                            </h2>
                            <button 
                                onClick={onClose} 
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all outline-none"
                            >
                                <X size={18} />
                            </button>
                        </header>

                        {/* Formulario Reactivo */}
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 overflow-y-auto pr-1">
                            
                            {/* Input: Nombre */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Producto</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Computadora de Escritorio"
                                    {...register('name_product')}
                                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-600/10 outline-none transition-all duration-200 ${
                                        errors.name_product ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                    }`}
                                />
                                {errors.name_product && (
                                    <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold mt-1">
                                        <AlertCircle size={13} /> {errors.name_product.message}
                                    </span>
                                )}
                            </div>

                            {/* Fila: Precio y Stock */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Precio ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register('price')}
                                        className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-600/10 outline-none transition-all duration-200 ${
                                            errors.price ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                        }`}
                                    />
                                    {errors.price && (
                                        <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold mt-1">
                                            <AlertCircle size={13} /> {errors.price.message}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock</label>
                                    <input
                                        type="number"
                                        {...register('stock')}
                                        disabled={isEditMode}
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold placeholder-slate-400 outline-none transition-all duration-200 ${
                                            isEditMode 
                                                ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed' 
                                                : `bg-slate-50 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-600/10 ${
                                                    errors.stock ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                                }`
                                        }`}
                                    />
                                    {errors.stock && (
                                        <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold mt-1">
                                            <AlertCircle size={13} /> {errors.stock.message}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Input: Categoría */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                                <select
                                    {...register('category_id')}
                                    className={`w-full px-3 py-2.5 rounded-xl border bg-slate-50 text-sm font-semibold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-600/10 outline-none transition-all duration-200 ${
                                        errors.category_id ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'
                                    }`}
                                >
                                    <option value="">Seleccione una categoría</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name_category}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold mt-1">
                                        <AlertCircle size={13} /> {errors.category_id.message}
                                    </span>
                                )}
                            </div>

                            {/* Input: Descripción */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detalles / Descripción</label>
                                <textarea
                                    rows="2"
                                    placeholder="Descripción adicional del artículo..."
                                    {...register('description')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-600/10 outline-none transition-all duration-200 resize-none"
                                />
                            </div>

                            {/* Toggle: Disponibilidad comercial */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl select-none">
                                <div className="space-y-0.5">
                                    <span className="font-bold text-xs text-slate-700 block">Habilitar Disponibilidad</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Permitir la comercialización inmediata</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        {...register('stockProduct')}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Botonera de Envío */}
                            <footer className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl active:scale-[0.98] outline-none transition-all text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/10 active:scale-[0.98] outline-none transition-all text-xs flex items-center gap-2"
                                >
                                    <Save size={14} />
                                    {isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Registrar Producto')}
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
