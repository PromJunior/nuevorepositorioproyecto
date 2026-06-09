import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, Package, RefreshCw,
    ShoppingCart, Wallet, Zap,
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { ROUTES } from '../../../constants/routes';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useDashboardSummary } from '../hooks/useDashboard';
import { PaymentMethodFilter } from '../../../shared/components/PaymentMethodFilter';
import { UserFilter } from '../../../shared/components/UserFilter';

import { DashboardKpiCards }        from '../components/DashboardKpiCards';
import { SalesChart }               from '../components/SalesChart';
import { PaymentMethodsChart }      from '../components/PaymentMethodsChart';
import { TopProductsTable }         from '../components/TopProductsTable';
import { TopClientsTable }          from '../components/TopClientsTable';
import { ClientSegmentationChart }  from '../components/ClientSegmentationChart';
import { RecentSalesTable }         from '../components/RecentSalesTable';
import { RecentPurchasesTable }     from '../components/RecentPurchasesTable';
import { LowStockTable }            from '../components/LowStockTable';

/* ─── KPI skeleton ─────────────────────────────────────────────────────────── */
const KpiSkeleton = () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[100px] animate-pulse rounded-xl bg-white border border-slate-200" />
        ))}
    </div>
);

/* ─── Company header card ──────────────────────────────────────────────────── */
const CompanyCard = ({ company }) => {
    if (!company) return null;
    const name = company.trade_name || company.legal_name || 'Empresa';

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                    {company.logo_url ? (
                        <img
                            src={company.logo_url}
                            alt={name}
                            className="h-full w-full rounded-xl object-contain p-1.5"
                        />
                    ) : (
                        <Building2 size={22} className="text-slate-400" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-900">{name}</p>
                    {company.legal_name && name !== company.legal_name && (
                        <p className="truncate text-xs font-medium text-slate-500">{company.legal_name}</p>
                    )}
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {company.ruc ? `RUC ${company.ruc}` : 'RUC pendiente'}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Moneda</span>
                    <span className="text-sm font-black text-slate-800">{company.primary_currency}</span>
                </div>
                {company.address && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Dirección</span>
                        <span className="max-w-[200px] truncate text-sm font-semibold text-slate-600">
                            {company.address}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Filters bar ──────────────────────────────────────────────────────────── */
const FiltersBar = ({ paymentMethodId, setPaymentMethodId, userId, setUserId, onRefresh, isLoading }) => (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <PaymentMethodFilter
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            quickOnly
            variant="buttons"
        />
        <div className="flex items-center gap-2">
            <div className="w-full max-w-xs">
                <UserFilter value={userId} onChange={setUserId} />
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Actualizar"
                title="Actualizar datos"
            >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </Button>
        </div>
    </div>
);

/* ─── Quick actions ────────────────────────────────────────────────────────── */
const QuickActions = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Accesos rápidos
            </p>
            <h3 className="text-sm font-bold text-slate-900">Acciones frecuentes</h3>
        </div>
        <div className="grid gap-2 p-4">
            <Link to={ROUTES.sales}>
                <Button size="md" className="w-full justify-start gap-3">
                    <ShoppingCart size={15} />
                    Registrar venta
                </Button>
            </Link>
            <Link to={ROUTES.purchases}>
                <Button variant="secondary" size="md" className="w-full justify-start gap-3">
                    <Zap size={15} />
                    Nueva compra
                </Button>
            </Link>
            <Link to={ROUTES.inventory}>
                <Button variant="secondary" size="md" className="w-full justify-start gap-3">
                    <Package size={15} />
                    Ver inventario
                </Button>
            </Link>
            <Link to={ROUTES.cashClosing}>
                <Button variant="secondary" size="md" className="w-full justify-start gap-3">
                    <Wallet size={15} />
                    Gestionar caja
                </Button>
            </Link>
        </div>
    </div>
);

/* ─── Section label ────────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{children}</p>
);

/* ─── Main page ────────────────────────────────────────────────────────────── */
const DashboardPage = () => {
    const role = useAuthStore((s) => s.role);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [userId, setUserId]                   = useState('');

    const dashboardFilters = {
        payment_method_id: paymentMethodId,
        user_id: userId,
    };

    const summaryQuery      = useDashboardSummary(dashboardFilters);
    const dashboardSettings = summaryQuery.data?.dashboard_settings || {};
    const visibleKpis       = dashboardSettings.visible_kpis   || [];
    const visibleCharts     = dashboardSettings.visible_charts || [];
    const showWidget = (id) => visibleCharts.length === 0 || visibleCharts.includes(id);

    return (
        <div className="space-y-6 p-6">

            {/* Page title */}
            <PageHeader
                eyebrow="Operación"
                title="Dashboard Ejecutivo"
                description="Indicadores en tiempo real · ventas, inventario, caja y compras."
                actions={
                    <div className="flex items-center gap-2">
                        {summaryQuery.data?.has_open_session && (
                            <Badge variant="success" dot>Caja abierta</Badge>
                        )}
                        <Link to={ROUTES.sales}>
                            <Button size="md">
                                <ShoppingCart size={15} />
                                Nueva venta
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Company info */}
            <CompanyCard company={summaryQuery.data?.company} />

            {/* Filters */}
            <FiltersBar
                paymentMethodId={paymentMethodId}
                setPaymentMethodId={setPaymentMethodId}
                userId={userId}
                setUserId={setUserId}
                onRefresh={() => summaryQuery.refetch()}
                isLoading={summaryQuery.isFetching}
            />

            {/* ── KPI Cards ─────────────────────────────────────────── */}
            {summaryQuery.isLoading ? (
                <KpiSkeleton />
            ) : summaryQuery.isError ? (
                <DataState
                    isLoading={false}
                    isError
                    errorTitle="No se pudieron cargar los KPIs"
                    errorDescription={
                        summaryQuery.error?.response?.data?.detail ||
                        summaryQuery.error?.message
                    }
                />
            ) : (
                <DashboardKpiCards
                    summary={summaryQuery.data}
                    visibleKpis={visibleKpis}
                />
            )}

            {/* ── Alertas bajo stock ─────────────────────────────────── */}
            {showWidget('low_stock') && (
                <LowStockTable threshold={summaryQuery.data?.low_stock_threshold} />
            )}

            {/* ── Gráficos principales ───────────────────────────────── */}
            {(showWidget('sales_chart') || showWidget('payment_methods')) && (
                <div>
                    <SectionLabel>Análisis de ventas</SectionLabel>
                    <div className="mt-3 grid grid-cols-1 gap-5 xl:grid-cols-3">
                        {showWidget('sales_chart') && (
                            <div className="xl:col-span-2">
                                <SalesChart filters={dashboardFilters} />
                            </div>
                        )}
                        {showWidget('payment_methods') && (
                            <PaymentMethodsChart filters={dashboardFilters} />
                        )}
                    </div>
                </div>
            )}

            {/* ── Top productos + Segmentación clientes ─────────────── */}
            {(showWidget('top_products') || showWidget('client_segmentation')) && (
                <div>
                    <SectionLabel>Productos y clientes</SectionLabel>
                    <div className="mt-3 grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {showWidget('top_products') && (
                            <TopProductsTable filters={dashboardFilters} />
                        )}
                        {showWidget('client_segmentation') && (
                            <ClientSegmentationChart filters={dashboardFilters} />
                        )}
                    </div>
                </div>
            )}

            {/* ── Top clientes ───────────────────────────────────────── */}
            {showWidget('top_clients') && (
                <div>
                    <SectionLabel>Clientes principales</SectionLabel>
                    <div className="mt-3">
                        <TopClientsTable filters={dashboardFilters} />
                    </div>
                </div>
            )}

            {/* ── Ventas recientes + Accesos rápidos ────────────────── */}
            {(showWidget('recent_sales') || showWidget('quick_actions')) && (
                <div>
                    <SectionLabel>Actividad reciente</SectionLabel>
                    <div className="mt-3 grid grid-cols-1 gap-5 xl:grid-cols-3">
                        {showWidget('recent_sales') && (
                            <div className="xl:col-span-2">
                                <RecentSalesTable filters={dashboardFilters} />
                            </div>
                        )}
                        {showWidget('quick_actions') && <QuickActions />}
                    </div>
                </div>
            )}

            {/* ── Compras recientes (solo admin) ─────────────────────── */}
            {role === 'admin' && showWidget('recent_purchases') && (
                <div>
                    <SectionLabel>Compras recientes</SectionLabel>
                    <div className="mt-3">
                        <RecentPurchasesTable />
                    </div>
                </div>
            )}

        </div>
    );
};

export default DashboardPage;
