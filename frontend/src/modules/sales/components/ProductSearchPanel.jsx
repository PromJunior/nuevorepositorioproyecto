import React, { useMemo, useState } from 'react';
import { Package, Plus, Search } from 'lucide-react';
import { Input } from '../../../shared/components/ui/input';
import { Card } from '../../../shared/components/ui/card';
import { DataState } from '../../../shared/components/DataState';
import { formatCurrency } from '../../../shared/utils/formatters';

export const ProductSearchPanel = ({ products = [], isLoading, isError, onAddProduct }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter((product) => (
            product.name_product || ''
        ).toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <Input
                        className="pl-11"
                        placeholder="Buscar producto por nombre..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>
            </Card>

            <DataState
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && filteredProducts.length === 0}
                emptyTitle="Sin productos"
                emptyDescription="No hay productos que coincidan con la busqueda."
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((product) => {
                        const stock = Number(product.stock || 0);
                        const isOutOfStock = stock <= 0;
                        const isLowStock = stock > 0 && stock <= 5;

                        return (
                            <button
                                key={product.id}
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => onAddProduct(product)}
                                className="flex min-h-36 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="line-clamp-2 text-sm font-black text-slate-900">{product.name_product}</h3>
                                        <p className="mt-1 text-xs font-semibold text-slate-400">{product.category?.name_category || 'General'}</p>
                                    </div>
                                    <div className={`rounded-lg p-2 ${isOutOfStock ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                        {isOutOfStock ? <Package size={16} /> : <Plus size={16} />}
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <p className="text-lg font-black text-slate-900">{formatCurrency(product.price)}</p>
                                    <span className={`rounded-full px-2 py-1 text-[11px] font-black ${isLowStock ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {isOutOfStock ? 'Agotado' : `${stock} disp.`}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DataState>
        </div>
    );
};
