import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Wallet, Zap } from 'lucide-react';
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

const DashboardPage = () => {
    const role = useAuthStore((s) => s.role);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [userId, setUserId] = useState('');
    const dashboardFilters = { payment_method_id: paymentMethodId, user_id: userId };
    const summaryQuery = useDashboardSummary(dashboardFilters);

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

            {/* ─── KPI Cards ──────────────────────────────────────── */}
            <DataState
                isLoading={summaryQuery.isLoading}
                isError={summaryQuery.isError}
                loadingLabel="Cargando indicadores..."
                errorTitle="No se pudieron cargar los KPIs"
                errorDescription={summaryQuery.error?.response?.data?.detail || summaryQuery.error?.message}
            >
                <DashboardKpiCards summary={summaryQuery.data} />
            </DataState>

            {/* ─── Alertas bajo stock (si hay) ────────────────────── */}
            <LowStockTable />

            {/* ─── Gráficos principales ───────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="min-w-0 xl:col-span-2">
                    <SalesChart filters={dashboardFilters} />
                </div>
                <PaymentMethodsChart filters={dashboardFilters} />
            </div>

            {/* ─── Top productos + Top clientes ───────────────────── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <TopProductsTable filters={dashboardFilters} />
                <TopClientsTable filters={dashboardFilters} />
            </div>

            {/* ─── Ventas recientes + Accesos rápidos ─────────────── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <RecentSalesTable filters={dashboardFilters} />
                </div>
                <QuickActions />
            </div>

            {/* ─── Compras recientes (solo admin) ─────────────────── */}
            {role === 'admin' && (
                <RecentPurchasesTable />
            )}
        </div>
    );
};

export default DashboardPage;
