import React, { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { useInventoryTransactions, useInventorySummary } from '../hooks/useKardex';
import { useInventory } from '../../inventory/hooks/useInventory';
import { KardexSummaryCards } from '../components/KardexSummaryCards';
import { KardexFilters } from '../components/KardexFilters';
import { KardexTable } from '../components/KardexTable';

const PAGE_SIZE = 50;

const INITIAL_FILTERS = {
    product_id: '',
    transaction_type: '',
    source_type: '',
    date_from: '',
    date_to: '',
};

const KardexPage = () => {
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [page, setPage] = useState(1);

    // ─── Params para la query (incluye paginación) ───────────────────────────
    const queryParams = useMemo(() => ({
        ...filters,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
    }), [filters, page]);

    // ─── Hooks ───────────────────────────────────────────────────────────────
    const summaryQuery = useInventorySummary();
    const transactionsQuery = useInventoryTransactions(queryParams);
    const { products } = useInventory();   // reutilizar hook existente

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);   // resetear paginación al cambiar filtros
    }, []);

    const handleReset = useCallback(() => {
        setFilters(INITIAL_FILTERS);
        setPage(1);
    }, []);

    const { items = [], total = 0 } = transactionsQuery.data ?? {};

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
                onFilterChange={handleFilterChange}
                onReset={handleReset}
            />

            {/* Tabla con paginación */}
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
