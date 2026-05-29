import React from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Package, SlidersHorizontal, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';

const MiniStat = ({ icon, label, value, colorClass = 'text-slate-800' }) => {
    const IconComp = icon;
    return (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-5 py-3 text-center">
            <IconComp size={15} className="text-slate-400" />
            <span className={`text-lg font-black ${colorClass}`}>{value}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        </div>
    );
};

/**
 * Encabezado del Kardex por Producto.
 *
 * Props:
 *  - product: { id, name_product, category_name, stock, price }
 *  - totalEntries, totalExits, totalAdjustments: number
 */
export const ProductKardexHeader = ({
    product,
    totalEntries = 0,
    totalExits = 0,
    totalAdjustments = 0,
}) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            {/* Back + título */}
            <div className="flex items-start gap-3">
                <Button
                    variant="secondary"
                    className="shrink-0 px-3"
                    onClick={() => navigate('/kardex')}
                >
                    <ArrowLeft size={15} />
                </Button>
                <div>
                    <span className="block text-[11px] font-bold uppercase tracking-widest text-blue-600">
                        Kardex por producto
                    </span>
                    <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">
                        {product.name_product}
                    </h1>
                    {product.category_name && (
                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                            <Tag size={10} /> {product.category_name}
                        </span>
                    )}
                </div>
            </div>

            {/* Tarjeta de info + mini stats */}
            <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                {/* Info producto */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Package size={22} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Stock actual
                        </p>
                        <p className="text-2xl font-black text-slate-900">
                            {formatNumber(product.stock)}{' '}
                            <span className="text-sm font-bold text-slate-400">uds.</span>
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-400">
                            Precio venta: {formatCurrency(product.price, 'PEN')}
                        </p>
                    </div>
                </div>

                {/* Mini stats */}
                <div className="flex flex-wrap gap-3">
                    <MiniStat
                        icon={ArrowUpRight}
                        label="Entradas"
                        value={formatNumber(totalEntries)}
                        colorClass="text-emerald-600"
                    />
                    <MiniStat
                        icon={ArrowDownLeft}
                        label="Salidas"
                        value={formatNumber(totalExits)}
                        colorClass="text-rose-600"
                    />
                    <MiniStat
                        icon={SlidersHorizontal}
                        label="Ajustes"
                        value={formatNumber(totalAdjustments)}
                        colorClass="text-indigo-600"
                    />
                </div>
            </Card>
        </div>
    );
};
