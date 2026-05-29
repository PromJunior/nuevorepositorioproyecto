import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const dashboardKeys = {
    summary: ['dashboard', 'summary'],
    topProducts: (limit) => ['dashboard', 'top-products', limit],
    topClients: (limit) => ['dashboard', 'top-clients', limit],
    recentSales: (limit) => ['dashboard', 'recent-sales', limit],
    recentPurchases: (limit) => ['dashboard', 'recent-purchases', limit],
    salesChart: (days) => ['dashboard', 'sales-chart', days],
    paymentMethods: ['dashboard', 'payment-methods'],
    lowStock: (threshold) => ['dashboard', 'low-stock', threshold],
};

const ONE_MIN = 1000 * 60;
const FIVE_MIN = ONE_MIN * 5;

// ─── KPIs principales ─────────────────────────────────────────────────────────
export const useDashboardSummary = () =>
    useQuery({
        queryKey: dashboardKeys.summary,
        queryFn: dashboardService.getSummary,
        staleTime: ONE_MIN,
        refetchInterval: ONE_MIN * 2,
    });

// ─── Top Productos ────────────────────────────────────────────────────────────
export const useTopProducts = (limit = 10) =>
    useQuery({
        queryKey: dashboardKeys.topProducts(limit),
        queryFn: () => dashboardService.getTopProducts(limit),
        staleTime: FIVE_MIN,
    });

// ─── Top Clientes ─────────────────────────────────────────────────────────────
export const useTopClients = (limit = 8) =>
    useQuery({
        queryKey: dashboardKeys.topClients(limit),
        queryFn: () => dashboardService.getTopClients(limit),
        staleTime: FIVE_MIN,
    });

// ─── Ventas Recientes ─────────────────────────────────────────────────────────
export const useRecentSales = (limit = 10) =>
    useQuery({
        queryKey: dashboardKeys.recentSales(limit),
        queryFn: () => dashboardService.getRecentSales(limit),
        staleTime: ONE_MIN,
        refetchInterval: ONE_MIN * 2,
    });

// ─── Compras Recientes ────────────────────────────────────────────────────────
export const useRecentPurchases = (limit = 10) =>
    useQuery({
        queryKey: dashboardKeys.recentPurchases(limit),
        queryFn: () => dashboardService.getRecentPurchases(limit),
        staleTime: FIVE_MIN,
    });

// ─── Gráfico Ventas ───────────────────────────────────────────────────────────
export const useSalesChart = (days = 30) =>
    useQuery({
        queryKey: dashboardKeys.salesChart(days),
        queryFn: () => dashboardService.getSalesChart(days),
        staleTime: FIVE_MIN,
    });

// ─── Métodos de Pago ──────────────────────────────────────────────────────────
export const usePaymentMethodStats = () =>
    useQuery({
        queryKey: dashboardKeys.paymentMethods,
        queryFn: dashboardService.getPaymentMethodStats,
        staleTime: FIVE_MIN,
    });

// ─── Bajo Stock ───────────────────────────────────────────────────────────────
export const useLowStock = (threshold = 5) =>
    useQuery({
        queryKey: dashboardKeys.lowStock(threshold),
        queryFn: () => dashboardService.getLowStock(threshold),
        staleTime: FIVE_MIN,
    });
