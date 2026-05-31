import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';

/**
 * Selector de productos para agregar a una compra.
 * Props:
 *  - products: array de { id, name_product, price, category }
 *  - onAdd(product) – agrega el producto al formulario de compra
 *  - existingIds: Set de product_id ya en la lista (para deshabilitar)
 */
export const ProductPurchaseSelector = ({ products = [], onAdd, existingIds = new Set() }) => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return products.filter((p) => p.name_product.toLowerCase().includes(q)).slice(0, 8);
    }, [products, query]);

    return (
        <Card className="p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Agregar productos
            </p>
            <div className="relative mb-3">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                <Input
                    className="pl-9"
                    placeholder="Buscar producto por nombre..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {query.length > 0 && (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {filtered.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-400 italic">Sin resultados</p>
                    ) : (
                        filtered.map((p) => {
                            const alreadyAdded = existingIds.has(p.id);
                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between px-4 py-2.5"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {p.name_product}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {p.category?.name_category} · Stock: {p.stock}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={alreadyAdded}
                                        onClick={() => { onAdd(p); setQuery(''); }}
                                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Plus size={12} />
                                        {alreadyAdded ? 'Agregado' : 'Agregar'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </Card>
    );
};
