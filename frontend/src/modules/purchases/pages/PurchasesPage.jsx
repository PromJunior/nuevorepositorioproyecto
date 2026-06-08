import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Pagination } from '../../../shared/components/Pagination';
import { ExportButtons } from '../../../shared/components/ExportButtons';
import { PurchaseTable } from '../components/PurchaseTable';
import { usePurchases } from '../hooks/usePurchases';

const PAGE_SIZE = 20;
const PURCHASE_COLUMNS = [
    { key: 'id', label: '#' },
    { key: 'purchase_date', label: 'Fecha', value: (purchase) => new Date(purchase.purchase_date).toLocaleString('es-PE') },
    { key: 'supplier', label: 'Proveedor', value: (purchase) => purchase.supplier?.company_name || '' },
    { key: 'invoice_number', label: 'Factura' },
    { key: 'status', label: 'Estado', value: (purchase) => purchase.status?.name_status || '' },
    { key: 'total_amount', label: 'Total', value: (purchase) => Number(purchase.total_amount || 0) },
];

const PurchasesPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data: purchases = [], isLoading, isError } = usePurchases();

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return purchases.filter((p) => {
            const matchText =
                !q ||
                p.supplier?.company_name?.toLowerCase().includes(q) ||
                (p.invoice_number || '').toLowerCase().includes(q) ||
                String(p.id).includes(q);
            const matchStatus =
                !statusFilter || p.status?.name_status === statusFilter;
            return matchText && matchStatus;
        });
    }, [purchases, query, statusFilter]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Compras"
                title="Gestión de compras"
                description="Registro de compras a proveedores y control de entradas de inventario."
                actions={
                    <Button onClick={() => navigate('/compras/nueva')}>
                        <Plus size={15} /> Nueva compra
                    </Button>
                }
            />

            {/* Filtros */}
            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                    <Input
                        className="pl-9"
                        placeholder="Buscar por proveedor, N° factura o ID..."
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    />
                </div>
                <select
                    className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">Todos los estados</option>
                    <option value="BORRADOR">Borrador</option>
                    <option value="RECIBIDA">Recibida</option>
                    <option value="CANCELADA">Cancelada</option>
                </select>
            </Card>

            {/* Tabla */}
            <DataState
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && filtered.length === 0}
                loadingLabel="Cargando compras..."
                emptyTitle="Sin compras"
                emptyDescription="Crea la primera compra usando el botón de arriba."
            >
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                            {filtered.length} compra{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                            <ExportButtons
                                data={filtered}
                                columns={PURCHASE_COLUMNS}
                                filters={{ query, status: statusFilter }}
                                filename="purchases"
                                module="purchases"
                                title="Gestion de compras"
                                disabled={filtered.length === 0}
                                totals={{ '#': 'TOTAL', Total: filtered.reduce((sum, purchase) => sum + Number(purchase.total_amount || 0), 0) }}
                            />
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                        </div>
                    </div>
                    <PurchaseTable purchases={paginated} />
                </div>
            </DataState>
        </div>
    );
};

export default PurchasesPage;
