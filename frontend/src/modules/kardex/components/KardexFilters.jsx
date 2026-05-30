import React from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { PaymentMethodFilter } from '../../../shared/components/PaymentMethodFilter';
import { UserFilter } from '../../../shared/components/UserFilter';
import { useAuthStore } from '../../../shared/store/useAuthStore';

const MOVEMENT_TYPES = [
    { value: '', label: 'Todos los tipos' },
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SALIDA', label: 'Salida' },
    { value: 'AJUSTE', label: 'Ajuste' },
];

const SOURCE_TYPES = [
    { value: '', label: 'Todos los orígenes' },
    { value: 'orders', label: 'Ventas' },
    { value: 'purchases', label: 'Compras' },
    { value: 'manual', label: 'Manual' },
];

const selectClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10';

/**
 * Panel de filtros del Kardex General.
 *
 * Props:
 *  - filters: { product_id, category_id, transaction_type, source_type, date_from, date_to, user_id, payment_method_id }
 *  - products: array de { id, name_product }
 *  - categories: array de { id, name_category }
 *  - onFilterChange(key, value)
 *  - onReset()
 */
export const KardexFilters = ({ filters, products = [], categories = [], onFilterChange, onReset }) => {
    const role = useAuthStore((state) => state.role);
    const isAdmin = role === 'admin';

    return (
        <Card className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-bold text-slate-700">Filtros</span>
                <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
                >
                    <RefreshCw size={11} /> Limpiar
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* Producto */}
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Producto
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                        <select
                            className={`${selectClass} pl-8`}
                            value={filters.product_id}
                            onChange={(e) => onFilterChange('product_id', e.target.value)}
                        >
                            <option value="">Todos los productos</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name_product}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Categoria */}
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Categoria
                    </label>
                    <select
                        className={selectClass}
                        value={filters.category_id}
                        onChange={(e) => onFilterChange('category_id', e.target.value)}
                    >
                        <option value="">Todas las categorias</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name_category}
                            </option>
                        ))}
                    </select>
                </div>

            {/* Tipo movimiento */}
            <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tipo movimiento
                </label>
                <select
                    className={selectClass}
                    value={filters.transaction_type}
                    onChange={(e) => onFilterChange('transaction_type', e.target.value)}
                >
                    {MOVEMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Origen */}
            <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Origen
                </label>
                <select
                    className={selectClass}
                    value={filters.source_type}
                    onChange={(e) => onFilterChange('source_type', e.target.value)}
                >
                    {SOURCE_TYPES.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Fecha desde */}
            <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Desde
                </label>
                <Input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => onFilterChange('date_from', e.target.value)}
                />
            </div>

            {/* Fecha hasta */}
            <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hasta
                </label>
                <Input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => onFilterChange('date_to', e.target.value)}
                />
            </div>

            {isAdmin && (
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Usuario / Vendedor
                    </label>
                    <UserFilter
                        value={filters.user_id}
                        onChange={(value) => onFilterChange('user_id', value)}
                    />
                </div>
            )}

            <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Metodo de pago
                </label>
                <PaymentMethodFilter
                    value={filters.payment_method_id}
                    onChange={(value) => onFilterChange('payment_method_id', value)}
                />
            </div>
        </div>
    </Card>
    );
};
