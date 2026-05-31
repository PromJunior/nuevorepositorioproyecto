import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Package, ShoppingCart, Wallet, Zap } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { ROUTES } from '../../../constants/routes';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useDashboardSummary } from '../hooks/useDashboard';
import { PaymentMethodFilter } from '../../../shared/components/PaymentMethodFilter';
import { UserFilter } from '../../../shared/components/UserFilter';

// Componentes del dashboard
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { SalesChart } from '../components/SalesChart';
import { PaymentMethodsChart } from '../components/PaymentMethodsChart';
import { TopProductsTable } from '../components/TopProductsTable';
import { TopClientsTable } from '../components/TopClientsTable';
import { ClientSegmentationChart } from '../components/ClientSegmentationChart';
import { RecentSalesTable } from '../components/RecentSalesTable';
import { RecentPurchasesTable } from '../components/RecentPurchasesTable';
import { LowStockTable } from '../components/LowStockTable';

const QuickActions = () => (
    <Card className="p-5">
        <h2 className="mb-4 text-sm font-black text-slate-900">Accesos rápidos</h2>
        <div className="grid gap-2">
            <Link to={ROUTES.sales}>
                <Button className="w-full justify-start">
                    <ShoppingCart size={15} /> Registrar venta
                </Button>
            </Link>
            <Link to={ROUTES.purchases}>
                <Button variant="secondary" className="w-full justify-start">
                    <Zap size={15} /> Nueva compra
                </Button>
            </Link>
            <Link to={ROUTES.inventory}>
                <Button variant="secondary" className="w-full justify-start">
                    <Package size={15} /> Ver inventario
                </Button>
            </Link>
            <Link to={ROUTES.cashClosing}>
                <Button variant="secondary" className="w-full justify-start">
                    <Wallet size={15} /> Gestionar caja
                </Button>
            </Link>
        </div>
    </Card>
);

const CompanyCard = ({ company }) => {
    if (!company) return null;
    const name = company.trade_name || company.legal_name || 'Empresa';

    return (
        <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                    {company.logo_url ? (
                        <img src={company.logo_url} alt={name} className="h-full w-full rounded-xl object-contain p-1" />
                    ) : (
                        <Building2 size={24} />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-lg font-black text-slate-900">{name}</p>
                    <p className="truncate text-sm font-semibold text-slate-500">{company.legal_name}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{company.ruc ? `RUC ${company.ruc}` : 'RUC pendiente'}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:flex">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Moneda</span>
                    <span className="font-black text-slate-800">{company.primary_currency}</span>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Direccion</span>
                    <span className="font-bold text-slate-600">{company.address || 'Pendiente'}</span>
                </div>
            </div>
        </Card>
    );
};

const DashboardPage = () => {
    const role = useAuthStore((s) => s.role);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [userId, setUserId] = useState('');
    const dashboardFilters = { payment_method_id: paymentMethodId, user_id: userId };
    const summaryQuery = useDashboardSummary(dashboardFilters);
    const dashboardSettings = summaryQuery.data?.dashboard_settings || {};
    const visibleKpis = dashboardSettings.visible_kpis || [];
    const visibleCharts = dashboardSettings.visible_charts || [];
    const showWidget = (id) => visibleCharts.length === 0 || visibleCharts.includes(id);

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Operación"
                title="Dashboard Ejecutivo"
                description="Indicadores en tiempo real de ventas, inventario, caja y compras."
                actions={
                    <Link to={ROUTES.sales}>
                        <Button>
                            <ShoppingCart size={15} /> Nueva venta
                        </Button>
                    </Link>
                }
            />

            <Card className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
                <PaymentMethodFilter
                    value={paymentMethodId}
                    onChange={setPaymentMethodId}
                    quickOnly
                    variant="buttons"
                />
                <div className="w-full max-w-xs">
                    <UserFilter value={userId} onChange={setUserId} />
                </div>
            </Card>

            <CompanyCard company={summaryQuery.data?.company} />

            {/* ─── KPI Cards ──────────────────────────────────────── */}
            <DataState
                isLoading={summaryQuery.isLoading}
                isError={summaryQuery.isError}
                loadingLabel="Cargando indicadores..."
                errorTitle="No se pudieron cargar los KPIs"
                errorDescription={summaryQuery.error?.response?.data?.detail || summaryQuery.error?.message}
            >
                <DashboardKpiCards summary={summaryQuery.data} visibleKpis={visibleKpis} />
            </DataState>

            {/* ─── Alertas bajo stock (si hay) ────────────────────── */}
            {showWidget('low_stock') && <LowStockTable threshold={summaryQuery.data?.low_stock_threshold} />}

            {/* ─── Gráficos principales ───────────────────────────── */}
            {(showWidget('sales_chart') || showWidget('payment_methods')) && (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {showWidget('sales_chart') && (
                        <div className="min-w-0 xl:col-span-2">
                            <SalesChart filters={dashboardFilters} />
                        </div>
                    )}
                    {showWidget('payment_methods') && <PaymentMethodsChart filters={dashboardFilters} />}
                </div>
            )}

            {/* ─── Top productos + Top clientes ───────────────────── */}
            {(showWidget('top_products') || showWidget('client_segmentation')) && (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {showWidget('top_products') && <TopProductsTable filters={dashboardFilters} />}
                    {showWidget('client_segmentation') && <ClientSegmentationChart filters={dashboardFilters} />}
                </div>
            )}

            {showWidget('top_clients') && (
                <div className="grid grid-cols-1 gap-6">
                    <TopClientsTable filters={dashboardFilters} />
                </div>
            )}

            {/* ─── Ventas recientes + Accesos rápidos ─────────────── */}
            {(showWidget('recent_sales') || showWidget('quick_actions')) && (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {showWidget('recent_sales') && (
                        <div className="xl:col-span-2">
                            <RecentSalesTable filters={dashboardFilters} />
                        </div>
                    )}
                    {showWidget('quick_actions') && <QuickActions />}
                </div>
            )}

            {/* ─── Compras recientes (solo admin) ─────────────────── */}
            {role === 'admin' && showWidget('recent_purchases') && (
                <RecentPurchasesTable />
            )}
        </div>
    );
};

export default DashboardPage;
