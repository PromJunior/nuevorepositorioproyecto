import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowUpDown,
    CheckCircle,
    DollarSign,
    Layers,
    Package,
    PenLine,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Trash2,
    XCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useInventory } from '../hooks/useInventory';
import { ProductModal } from '../components/ProductModal';
import { StockModal } from '../components/StockModal';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { ExportButtons } from '../../../shared/components/ExportButtons';
import { TableSkeletonRows, TableEmpty } from '../../../shared/components/Table';

const MySwal = withReactContent(Swal);
const MotionButton = motion.button;
const MotionDiv = motion.div;
const MotionTr = motion.tr;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.215, 0.61, 0.355, 1] },
    },
};

const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const getCategoryName = (product) => product.category?.name_category || 'General';

const PRODUCT_COLUMNS = [
    { key: 'id', label: 'ID' },
    { key: 'name_product', label: 'Producto' },
    { key: 'description', label: 'Descripcion' },
    { key: 'category', label: 'Categoria', value: getCategoryName },
    { key: 'price', label: 'Precio', value: (product) => Number(product.price || 0) },
    { key: 'stock', label: 'Stock', value: (product) => Number(product.stock || 0) },
    { key: 'stockProduct', label: 'Estado', value: (product) => product.stockProduct ? 'Disponible' : 'Agotado' },
];

const InventoryPage = () => {
    const {
        products,
        categories,
        isLoading,
        isError,
        error,
        createProduct,
        updateProduct,
        deleteProduct,
        isCreating,
        isUpdating,
        isDeleting,
    } = useInventory();

    const userRole = useAuthStore((state) => state.role);
    const isAdmin = userRole === 'admin';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockProduct, setStockProduct] = useState(null);

    const uniqueCategories = useMemo(() => {
        return ['Todas', ...new Set(products.map((product) => getCategoryName(product)))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return [...products]
            .filter((product) => {
                const productName = product.name_product || '';
                const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = selectedCategory === 'Todas' || getCategoryName(product) === selectedCategory;
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                const getSortValue = (product) => {
                    if (sortConfig.key === 'category_name') return getCategoryName(product);
                    return product[sortConfig.key];
                };

                const valA = getSortValue(a);
                const valB = getSortValue(b);

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
    }, [products, searchTerm, selectedCategory, sortConfig]);

    const totalProducts = products.length;
    const lowStockProducts = products.filter((product) => Number(product.stock) < 5).length;
    const totalInventoryValue = products.reduce((acc, product) => acc + (Number(product.price) * Number(product.stock)), 0);
    const activeCategories = categories.length;

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('Todas');
    };

    const requestSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleOpenCreateModal = () => {
        setSelectedProduct(null);
        setIsProductModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setSelectedProduct(product);
        setIsProductModalOpen(true);
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedProduct) {
                await updateProduct({ id: selectedProduct.id, data: formData });
                MySwal.fire({
                    title: 'Actualizado',
                    text: 'Catalogo sincronizado correctamente.',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    timer: 3500,
                    showConfirmButton: false,
                });
                return;
            }

            await createProduct(formData);
            MySwal.fire({
                title: 'Creado',
                text: 'Articulo registrado en el inventario.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                timer: 3500,
                showConfirmButton: false,
            });
        } catch (mutationError) {
            MySwal.fire({ title: 'Error', text: 'No se pudo consolidar la operacion.', icon: 'error', customClass: { popup: '!rounded-2xl' } });
            throw mutationError;
        }
    };

    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: 'Remover producto?',
            text: 'Esta accion dara de baja el producto en el inventario activo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Si, remover',
            cancelButtonText: 'Cancelar',
            customClass: { popup: '!rounded-2xl' },
        });

        if (!result.isConfirmed) return;

        try {
            await deleteProduct(id);
            MySwal.fire({
                title: 'Removido',
                text: 'El articulo ha sido eliminado del registro.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                timer: 3500,
                showConfirmButton: false,
            });
        } catch (deleteError) {
            const errorMessage = deleteError.response?.data?.detail || 'El producto posee relaciones comerciales activas y no puede ser removido.';
            MySwal.fire({ title: 'Restriccion de integridad', text: errorMessage, icon: 'error', customClass: { popup: '!rounded-2xl' } });
        }
    };

    const handleQuickStockSubmit = async (amount) => {
        if (!stockProduct) return;

        try {
            const nextStock = Number(stockProduct.stock) + Number(amount);

            await updateProduct({
                id: stockProduct.id,
                data: {
                    name_product: stockProduct.name_product,
                    price: Number(stockProduct.price),
                    stock: nextStock,
                    description: stockProduct.description || '',
                    stockProduct: nextStock > 0,
                    category_id: stockProduct.category_id,
                },
            });

            MySwal.fire({
                title: 'Inventario sincronizado',
                text: `Se agregaron +${amount} unidades a bodega.`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                timer: 3500,
                showConfirmButton: false,
            });
        } catch (stockError) {
            MySwal.fire({ title: 'Error', text: 'No se pudo consolidar la suma.', icon: 'error', customClass: { popup: '!rounded-2xl' } });
            throw stockError;
        }
    };

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6 font-sans text-slate-600 antialiased">
            <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200/60 pb-5 sm:flex-row sm:items-center">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Consola de inventario</h1>
                    <p className="text-xs font-medium text-slate-400">Supervisa existencias, alertas criticas y el catalogo global.</p>
                </div>

                {isAdmin && (
                    <MotionButton
                        whileHover={{ scale: 1.01, y: -0.5 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/10 transition hover:bg-blue-700"
                    >
                        <Plus size={16} /> Agregar producto
                    </MotionButton>
                )}
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Items catalogados</span>
                        <span className="text-2xl font-black tracking-tight text-slate-800">{isLoading ? '...' : totalProducts}</span>
                        <span className="block text-[11px] font-medium text-slate-400">SKUs vigentes en base</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-slate-500">
                        <Package size={20} />
                    </div>
                </div>

                <div className={`flex items-center justify-between rounded-2xl border p-5 shadow-sm ${lowStockProducts > 0 ? 'border-amber-200/60 bg-amber-50/40' : 'border-slate-200/80 bg-white'}`}>
                    <div className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Stock critico</span>
                        <span className={`text-2xl font-black tracking-tight ${lowStockProducts > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{isLoading ? '...' : lowStockProducts}</span>
                        <span className="block text-[11px] font-medium text-slate-400">Bajo stock (&lt; 5 unidades)</span>
                    </div>
                    <div className={`rounded-xl p-3 ${lowStockProducts > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                        <AlertTriangle size={20} className={lowStockProducts > 0 ? 'animate-pulse' : ''} />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Valorizacion</span>
                        <span className="text-2xl font-black tracking-tight text-slate-800">$ {isLoading ? '0.00' : formatCurrency(totalInventoryValue)}</span>
                        <span className="block text-[11px] font-semibold text-emerald-500">Valor actual de inventario</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-slate-500">
                        <DollarSign size={20} />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Clasificacion</span>
                        <span className="text-2xl font-black tracking-tight text-slate-800">{isLoading ? '...' : activeCategories}</span>
                        <span className="block text-[11px] font-medium text-slate-400">Familias de productos</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-slate-500">
                        <Layers size={20} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-800">
                        <SlidersHorizontal size={15} className="text-slate-400" />
                        <span>Filtros estructurales</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ExportButtons
                            data={filteredProducts}
                            columns={PRODUCT_COLUMNS}
                            filters={{ searchTerm, selectedCategory, sort: `${sortConfig.key}:${sortConfig.direction}` }}
                            filename="products_snapshot"
                            module="inventory"
                            title="Consola de inventario"
                            disabled={filteredProducts.length === 0}
                            totals={{ ID: 'TOTAL', Stock: filteredProducts.reduce((sum, product) => sum + Number(product.stock || 0), 0) }}
                        />
                        <button onClick={handleClearFilters} className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100">
                            <RefreshCw size={12} /> Limpiar filtros
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Busqueda</label>
                        <div className="group relative">
                            <Search className="absolute left-3.5 top-3.5 text-slate-400 transition group-focus-within:text-blue-600" size={16} />
                            <input
                                type="text"
                                placeholder="Escribe el nombre de un articulo o marca..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Familia</label>
                        <select
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                            value={selectedCategory}
                            onChange={(event) => setSelectedCategory(event.target.value)}
                        >
                            {uniqueCategories.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <MotionDiv variants={containerVariants} initial="hidden" animate="visible" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200/60 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <th onClick={() => requestSort('id')} className="inline-flex cursor-pointer items-center gap-1.5 p-4 pl-6 transition hover:text-slate-800">ID <ArrowUpDown size={12} /></th>
                                <th onClick={() => requestSort('name_product')} className="cursor-pointer p-4 transition hover:text-slate-800">Producto</th>
                                <th className="p-4">Descripcion</th>
                                <th onClick={() => requestSort('category_name')} className="cursor-pointer p-4 transition hover:text-slate-800">Categoria</th>
                                <th onClick={() => requestSort('price')} className="cursor-pointer p-4 text-right transition hover:text-slate-800">Precio</th>
                                <th onClick={() => requestSort('stock')} className="cursor-pointer p-4 text-center transition hover:text-slate-800">Stock</th>
                                <th className="p-4 text-center">Estado</th>
                                {isAdmin && <th className="p-4 pr-6 text-center">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {isLoading ? (
                                <TableSkeletonRows rows={8} cols={8} />
                            ) : isError ? (
                                <TableEmpty
                                    colSpan={8}
                                    message={error?.message || 'No se pudo cargar el inventario.'}
                                />
                            ) : filteredProducts.length === 0 ? (
                                <TableEmpty
                                    colSpan={8}
                                    message={
                                        searchTerm || selectedCategory !== 'Todas'
                                            ? 'No hay artículos que cumplan con los filtros actuales.'
                                            : 'El catálogo está vacío. Agrega el primer producto.'
                                    }
                                />
                            ) : (
                                filteredProducts.map((product) => {
                                    const lowStockTrigger = Number(product.stock) < 5;

                                    return (
                                        <MotionTr key={product.id} variants={itemVariants} whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.7)' }} className="transition-colors">
                                            <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-400">#{String(product.id).padStart(4, '0')}</td>
                                            <td className="p-4 font-semibold tracking-tight text-slate-800">{product.name_product}</td>
                                            <td className="max-w-xs truncate p-4 text-xs font-normal text-slate-400">{product.description || '-'}</td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center rounded-md border border-slate-200/40 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    {getCategoryName(product)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-900">$ {formatCurrency(product.price)}</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    type="button"
                                                    disabled={!isAdmin}
                                                    onClick={() => setStockProduct(product)}
                                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                                        isAdmin ? 'text-blue-600 underline decoration-dotted hover:bg-blue-50' : 'cursor-default text-slate-700'
                                                    } ${lowStockTrigger ? 'border border-amber-200/50 bg-amber-50 text-amber-600 hover:bg-amber-100/70' : ''}`}
                                                    title={isAdmin ? 'Reabastecer stock' : ''}
                                                >
                                                    {product.stock} u.
                                                </button>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                                    product.stockProduct ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700' : 'border-rose-200/60 bg-rose-50 text-rose-700'
                                                }`}>
                                                    {product.stockProduct ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {product.stockProduct ? 'Disponible' : 'Agotado'}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="p-4 pr-6">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button type="button" onClick={() => handleOpenEditModal(product)} className="rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600" title="Editar ficha">
                                                            <PenLine size={15} />
                                                        </button>
                                                        <button type="button" disabled={isDeleting} onClick={() => handleDelete(product.id)} className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Eliminar producto">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </MotionTr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </MotionDiv>

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSubmit={handleModalSubmit}
                categories={categories}
                productToEdit={selectedProduct}
                isSaving={isCreating || isUpdating}
            />

            <StockModal
                isOpen={!!stockProduct}
                onClose={() => setStockProduct(null)}
                onSubmit={handleQuickStockSubmit}
                product={stockProduct}
                isSaving={isUpdating}
            />
        </div>
    );
};

export default InventoryPage;
