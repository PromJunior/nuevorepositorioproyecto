import React, { useState, useCallback, useMemo } from 'react';
import { Download, FileText } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { useInventoryTransactions, useInventorySummary, useKardexDailySummary } from '../hooks/useKardex';
import { useInventory } from '../../inventory/hooks/useInventory';
import { KardexSummaryCards } from '../components/KardexSummaryCards';
import { KardexDailySummaryCards } from '../components/KardexDailySummaryCards';
import { KardexDailySummaryTable } from '../components/KardexDailySummaryTable';
import { KardexFilters } from '../components/KardexFilters';
import { KardexTable } from '../components/KardexTable';
import { kardexService } from '../services/kardexService';
import { useAuthStore } from '../../../shared/store/useAuthStore';

const PAGE_SIZE = 50;

const INITIAL_FILTERS = {
    product_id: '',
    category_id: '',
    transaction_type: '',
    source_type: '',
    date_from: '',
    date_to: '',
    user_id: '',
    payment_method_id: '',
};

const KardexPage = () => {
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [page, setPage] = useState(1);
    const role = useAuthStore((state) => state.role);
    const isAdmin = role === 'admin';

    // ─── Params para la query (incluye paginación) ───────────────────────────
    const queryParams = useMemo(() => ({
        ...filters,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
    }), [filters, page]);

    // ─── Hooks ───────────────────────────────────────────────────────────────
    const summaryQuery = useInventorySummary();
    const transactionsQuery = useInventoryTransactions(queryParams);
    const dailySummaryQuery = useKardexDailySummary(filters);
    const { products, categories } = useInventory();   // reutilizar hook existente

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);   // resetear paginación al cambiar filtros
    }, []);

    const handleReset = useCallback(() => {
        setFilters(INITIAL_FILTERS);
        setPage(1);
    }, []);

    const handleExportExcel = useCallback(() => {
        kardexService.exportDailySummaryExcel(filters);
    }, [filters]);

    const handleExportPdf = useCallback(() => {
        kardexService.exportDailySummaryPdf(filters);
    }, [filters]);

    const { items = [], total = 0 } = transactionsQuery.data ?? {};
    const dailyRows = dailySummaryQuery.data ?? [];

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Inventario"
                title="Kardex General"
                description="Historial completo de movimientos de inventario — entradas, salidas y ajustes."
            />

            {/* KPI Cards */}
            <DataState
                isLoading={summaryQuery.isLoading}
                isError={summaryQuery.isError}
                loadingLabel="Cargando resumen..."
            >
                <KardexSummaryCards summary={summaryQuery.data} />
            </DataState>

            {/* Filtros */}
            <KardexFilters
                filters={filters}
                products={products}
                categories={categories}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
            />

            {/* Tabla con paginación */}
            <DataState
                isLoading={dailySummaryQuery.isLoading}
                isError={dailySummaryQuery.isError}
                isEmpty={!dailySummaryQuery.isLoading && dailyRows.length === 0}
                loadingLabel="Cargando resumen diario..."
                emptyTitle="Sin resumen diario"
                emptyDescription="No hay movimientos ni ventas con los filtros aplicados."
            >
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                            <KardexDailySummaryCards rows={dailyRows} />
                        </div>
                        {isAdmin && (
                        <div className="flex shrink-0 gap-2">
                            <button
                                type="button"
                                onClick={handleExportExcel}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
                            >
                                <Download size={14} /> Excel
                            </button>
                            <button
                                type="button"
                                onClick={handleExportPdf}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-black text-white hover:bg-slate-900"
                            >
                                <FileText size={14} /> PDF
                            </button>
                        </div>
                        )}
                    </div>
                    <KardexDailySummaryTable rows={dailyRows} />
                </div>
            </DataState>

            <DataState
                isLoading={transactionsQuery.isLoading}
                isError={transactionsQuery.isError}
                isEmpty={!transactionsQuery.isLoading && items.length === 0 && total === 0}
                loadingLabel="Cargando movimientos..."
                emptyTitle="Sin movimientos"
                emptyDescription="No hay registros con los filtros aplicados."
            >
                <KardexTable
                    items={items}
                    total={total}
                    page={page}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                    isFetching={transactionsQuery.isFetching}
                />
            </DataState>
        </div>
    );
};

export default KardexPage;
