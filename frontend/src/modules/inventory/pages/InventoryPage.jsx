import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trash2, Plus, PenLine, Search, Layers, DollarSign, 
    AlertTriangle, Package, SlidersHorizontal, RefreshCw, 
    CheckCircle, XCircle, ArrowUpDown 
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useInventory } from '../hooks/useInventory';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { ProductModal } from '../components/ProductModal';

const MySwal = withReactContent(Swal);

// ================= ORQUESTACIÓN DE ANIMACIONES PREMIUM =================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.35, ease: [0.215, 0.610, 0.355, 1.000] }
    }
};

const InventoryPage = () => {
    // 1. Estados de API de React Query
    const {
        products,
        categories,
        isLoading,
        createProduct,
        updateProduct,
        deleteProduct
    } = useInventory();

    // 2. Estado Global de Rol
    const userRole = useAuthStore((state) => state.role);

    // 3. Estados de Filtros y Ordenamiento locales
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

    // 4. Estados de Control de Modales Reactivos
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Categorías únicas basadas en los productos traídos de base de datos
    const uniqueCategories = ["Todas", ...new Set(products.map(p => p.category?.name_category || "General"))];

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("Todas");
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filtrar y ordenar productos en cliente
    const filteredProducts = products
        .filter(p => {
            const matchesSearch = p.name_product.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "Todas" || (p.category?.name_category || "General") === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'category_name') {
                valA = a.category?.name_category || "General";
                valB = b.category?.name_category || "General";
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    // --- CÁLCULOS ANALÍTICOS ---
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock < 5).length; 
    const totalInventoryValue = products.reduce((acc, p) => acc + (parseFloat(p.price) * p.stock), 0);
    const activeCategories = categories.length;

    // --- MANEJADORES DE MUTACIÓN ---
    
    // Crear o Editar producto mediante el Modal Reactivo
    const handleOpenCreateModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedProduct) {
                // Modo Edición
                await updateProduct({ id: selectedProduct.id, data: formData });
                MySwal.fire({ 
                    title: 'Actualizado', 
                    text: 'Catálogo sincronizado correctamente.', 
                    icon: 'success', 
                    toast: true,
                    position: 'top-end',
                    timer: 3500,
                    showConfirmButton: false
                });
            } else {
                // Modo Creación
                await createProduct(formData);
                MySwal.fire({ 
                    title: 'Creado', 
                    text: 'Artículo inyectado en el inventario.', 
                    icon: 'success', 
                    toast: true,
                    position: 'top-end',
                    timer: 3500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            MySwal.fire({ title: 'Error', text: 'No se pudo consolidar la operación comercial.', icon: 'error', customClass: { popup: '!rounded-2xl' } });
        }
    };

    // Borrado lógico del producto
    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: '¿Remover producto?',
            text: "Esta acción dará de baja el producto de forma permanente en el inventario activo.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, remover',
            cancelButtonText: 'Cancelar',
            customClass: { popup: '!rounded-2xl' }
        });

        if (result.isConfirmed) {
            try {
                await deleteProduct(id);
                MySwal.fire({ 
                    title: 'Removido', 
                    text: 'El artículo ha sido eliminado del registro.', 
                    icon: 'success', 
                    toast: true,
                    position: 'top-end',
                    timer: 3500,
                    showConfirmButton: false
                });
            } catch (error) {
                const errorMessage = error.response?.data?.detail || 'El producto posee relaciones comerciales activas y no puede ser removido.';
                MySwal.fire({ title: 'Restricción de Integridad', text: errorMessage, icon: 'error', customClass: { popup: '!rounded-2xl' } });
            }
        }
    };

    // Incremento rápido de stock en bodega
    const handleQuickStock = async (item) => {
        const { value: entradaStock } = await MySwal.fire({
            title: `Abastecer Stock`,
            input: 'number',
            inputLabel: `Ingresa las nuevas unidades para: ${item.name_product}`,
            inputPlaceholder: 'Cantidad a sumar...',
            customClass: {
                popup: '!rounded-2xl !p-6',
                title: '!text-lg !font-black !text-slate-800',
                input: '!rounded-xl !border-slate-200 !text-sm !font-semibold',
                confirmButton: 'bg-blue-600 hover:bg-blue-700 !text-white !font-bold !py-2 !px-4 !rounded-xl !text-sm',
                cancelButton: 'bg-slate-100 hover:bg-slate-200 !text-slate-700 !font-bold !py-2 !px-4 !rounded-xl !text-sm'
            },
            buttonsStyling: false,
            showCancelButton: true,
            confirmButtonText: 'Sumar al Inventario',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value || parseInt(value) <= 0) {
                    return 'Debes ingresar un incremento numérico mayor a cero.';
                }
            }
        });

        if (entradaStock) {
            try {
                const nuevoStockTotal = parseInt(item.stock) + parseInt(entradaStock);
                const dataActualizada = {
                    name_product: item.name_product,
                    price: parseFloat(item.price),
                    stock: nuevoStockTotal,
                    description: item.description || '',
                    stockProduct: nuevoStockTotal > 0,
                    category_id: item.category_id
                };

                await updateProduct({ id: item.id, data: dataActualizada });
                MySwal.fire({ title: 'Inventario Sincronizado', text: `Se agregaron +${entradaStock} unidades a bodega.`, icon: 'success', toast: true, position: 'top-end', timer: 3500, showConfirmButton: false });
            } catch (error) {
                MySwal.fire({ title: 'Error', text: 'No se pudo consolidar la suma.', icon: 'error', customClass: { popup: '!rounded-2xl' } });
            }
        }
    };

    return (
        <div className="p-6 bg-slate-50/40 min-h-screen space-y-6 font-sans antialiased text-slate-600">
            
            {/* ENCABEZADO ACCIONABLE */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5 select-none">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Consola de Inventario</h1>
                    <p className="text-xs text-slate-400 font-medium">Supervisa existencias, audita alertas críticas y parametriza tu catálogo global.</p>
                </div>

                {userRole === 'admin' && (
                    <motion.button 
                        whileHover={{ scale: 1.01, y: -0.5 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleOpenCreateModal} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shadow-blue-600/10 transition-all text-sm outline-none"
                    >
                        <Plus size={16} /> Agregar Producto
                    </motion.button>
                )}
            </header>

            {/* SECCIÓN KPI ADMIN DASHBOARD PREMIUM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                
                {/* METRICA 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-400 transition-all duration-200 cursor-pointer">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ítems Catalogados</span>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                            {isLoading ? '...' : totalProducts}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">SKUs vigentes en base</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-150">
                        <Package size={20} />
                    </div>
                </div>

                {/* METRICA 2 */}
                <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between group transition-all duration-200 cursor-pointer ${lowStockProducts > 0 ? 'bg-amber-50/40 border-amber-200/60 hover:border-amber-400' : 'bg-white border-slate-200/80 hover:border-slate-400'}`}>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nivel de Alerta</span>
                        <span className={`text-2xl font-black tracking-tight ${lowStockProducts > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                            {isLoading ? '...' : lowStockProducts}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">Bajo stock (&lt; 5 unidades)</span>
                    </div>
                    <div className={`p-3 rounded-xl transition-colors duration-150 ${lowStockProducts > 0 ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-900 group-hover:text-white'}`}>
                        <AlertTriangle size={20} className={lowStockProducts > 0 ? 'animate-pulse' : ''} />
                    </div>
                </div>

                {/* METRICA 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-400 transition-all duration-200 cursor-pointer">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Patrimonio Neto</span>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                            $ {isLoading ? '0.00' : totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-emerald-500 font-semibold block">Valorizado al costo activo</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-150">
                        <DollarSign size={20} />
                    </div>
                </div>

                {/* METRICA 4 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-400 transition-all duration-200 cursor-pointer">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Clasificación</span>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                            {isLoading ? '...' : activeCategories}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">Familias de productos</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-150">
                        <Layers size={20} />
                    </div>
                </div>
            </div>

            {/* PANEL DE FILTROS PREMIUM */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm tracking-tight">
                        <SlidersHorizontal size={15} className="text-slate-400" />
                        <span>Filtros Estructurales</span>
                    </div>
                    <button 
                        onClick={handleClearFilters}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors duration-150"
                    >
                        <RefreshCw size={12} /> Limpiar Filtros
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none">Búsqueda Predictiva</label>
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-150" size={16} />
                            <input
                                type="text"
                                placeholder="Escribe el nombre de un artículo o marca..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none"> Segmentación por Familia</label>
                        <select
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all duration-200"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* TABLA DE PRODUCTOS REDISEÑADA ESTILO PREMIUM */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                                <th onClick={() => requestSort('id')} className="p-4 pl-6 cursor-pointer hover:text-slate-800 transition-colors inline-flex items-center gap-1.5">ID <ArrowUpDown size={12}/></th>
                                <th onClick={() => requestSort('name_product')} className="p-4 cursor-pointer hover:text-slate-800 transition-colors">Producto</th>
                                <th className="p-4">Descripción Adicional</th>
                                <th onClick={() => requestSort('category_name')} className="p-4 cursor-pointer hover:text-slate-800 transition-colors">Categoría</th>
                                <th onClick={() => requestSort('price')} className="p-4 cursor-pointer hover:text-slate-800 transition-colors text-right">Precio</th>
                                <th onClick={() => requestSort('stock')} className="p-4 cursor-pointer hover:text-slate-800 transition-colors text-center">Stock</th>
                                <th className="p-4 text-center">Estado Comercial</th>
                                {userRole === 'admin' && <th className="p-4 text-center pr-6">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-medium">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-20 text-slate-400 italic font-medium">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Sincronizando base de datos de inventario...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-16 text-slate-400 italic font-medium select-none">
                                        No hay artículos registrados que cumplan con la segmentación actual.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => {
                                    const lowStockTrigger = p.stock < 5;
                                    return (
                                        <motion.tr 
                                            key={p.id}
                                            variants={itemVariants}
                                            whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.7)" }}
                                            className="transition-colors group"
                                        >
                                            <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                                                #{String(p.id).padStart(4, '0')}
                                            </td>
                                            <td className="p-4 font-semibold text-slate-800 tracking-tight">{p.name_product}</td>
                                            <td className="p-4 text-xs font-normal text-slate-400 max-w-xs truncate">{p.description || '—'}</td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/40 text-xs font-medium">
                                                    {p.category?.name_category || "General"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-900">$ {parseFloat(p.price).toFixed(2)}</td>

                                            {/* Stock Modular / Acceso Rápido */}
                                            <td className="p-4 text-center select-none">
                                                <span 
                                                    onClick={userRole === 'admin' ? () => handleQuickStock(p) : null}
                                                    className={`
                                                        px-2.5 py-1 rounded-lg font-bold text-xs transition-all duration-150
                                                        ${userRole === 'admin' 
                                                            ? 'cursor-pointer hover:bg-blue-50 text-blue-600 underline decoration-dotted' 
                                                            : 'text-slate-700'
                                                        }
                                                        ${lowStockTrigger && 'text-amber-600 bg-amber-50 border border-amber-200/50 hover:bg-amber-100/70'}
                                                    `}
                                                    title={userRole === 'admin' ? "Haga click para reabastecer stock de inmediato" : ""}
                                                >
                                                    {p.stock} u.
                                                </span>
                                            </td>

                                            {/* Badges de Disponibilidad */}
                                            <td className="p-4 text-center select-none">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                    p.stockProduct 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                                                        : 'bg-rose-50 text-rose-700 border-rose-200/60'
                                                }`}>
                                                    {p.stockProduct ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                                                    {p.stockProduct ? 'Disponible' : 'Agotado'}
                                                </span>
                                            </td>

                                            {/* Botonera de Gestión */}
                                            {userRole === 'admin' && (
                                                <td className="p-4 pr-6 select-none">
                                                    <div className="flex justify-center items-center gap-1">
                                                        <button onClick={() => handleOpenEditModal(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95" title="Editar Ficha Técnica">
                                                            <PenLine size={15} />
                                                        </button>
                                                        <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95" title="Eliminar del Sistema">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modal de Creación / Edición de Producto Reactivo */}
            <ProductModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                categories={categories}
                productToEdit={selectedProduct}
            />
        </div>
    );
};

export default InventoryPage;
