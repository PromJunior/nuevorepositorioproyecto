import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const dashboardKeys = {
    summary: (params = {}) => ['dashboard', 'summary', params],
    topProducts: (limit, params = {}) => ['dashboard', 'top-products', limit, params],
    topClients: (limit, params = {}) => ['dashboard', 'top-clients', limit, params],
    clientSegmentation: (params = {}) => ['dashboard', 'client-segmentation', params],
    recentSales: (limit, params = {}) => ['dashboard', 'recent-sales', limit, params],
    recentPurchases: (limit) => ['dashboard', 'recent-purchases', limit],
    salesChart: (days, params = {}) => ['dashboard', 'sales-chart', days, params],
    paymentMethods: (params = {}) => ['dashboard', 'payment-methods', params],
    lowStock: (threshold) => ['dashboard', 'low-stock', threshold],
};

const ONE_MIN = 1000 * 60;
const FIVE_MIN = ONE_MIN * 5;

// ─── KPIs principales ─────────────────────────────────────────────────────────
const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, value]) => value));

export const useDashboardSummary = (params = {}) =>
    useQuery({
        queryKey: dashboardKeys.summary(clean(params)),
        queryFn: () => dashboardService.getSummary(clean(params)),
        staleTime: ONE_MIN,
        refetchInterval: ONE_MIN * 2,
    });

// ─── Top Productos ────────────────────────────────────────────────────────────
export const useTopProducts = (limit = 10, params = {}) =>
    useQuery({
        queryKey: dashboardKeys.topProducts(limit, clean(params)),
        queryFn: () => dashboardService.getTopProducts(limit, clean(params)),
        staleTime: FIVE_MIN,
    });

// ─── Top Clientes ─────────────────────────────────────────────────────────────
export const useTopClients = (limit = 8, params = {}) =>
    useQuery({
        queryKey: dashboardKeys.topClients(limit, clean(params)),
        queryFn: () => dashboardService.getTopClients(limit, clean(params)),
        staleTime: FIVE_MIN,
    });

export const useClientSegmentation = (params = {}) =>
    useQuery({
        queryKey: dashboardKeys.clientSegmentation(clean(params)),
        queryFn: () => dashboardService.getClientSegmentation(clean(params)),
        staleTime: FIVE_MIN,
    });

// ─── Ventas Recientes ─────────────────────────────────────────────────────────
export const useRecentSales = (limit = 10, params = {}) =>
    useQuery({
        queryKey: dashboardKeys.recentSales(limit, clean(params)),
        queryFn: () => dashboardService.getRecentSales(limit, clean(params)),
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
export const useSalesChart = (days = 30, params = {}) =>
    useQuery({
        queryKey: dashboardKeys.salesChart(days, clean(params)),
        queryFn: () => dashboardService.getSalesChart(days, clean(params)),
        staleTime: FIVE_MIN,
    });

// ─── Métodos de Pago ──────────────────────────────────────────────────────────
export const usePaymentMethodStats = (params = {}) =>
    useQuery({
        queryKey: dashboardKeys.paymentMethods(clean(params)),
        queryFn: () => dashboardService.getPaymentMethodStats(clean(params)),
        staleTime: FIVE_MIN,
    });

// ─── Bajo Stock ───────────────────────────────────────────────────────────────
export const useLowStock = (threshold = 5) =>
    useQuery({
        queryKey: dashboardKeys.lowStock(threshold),
        queryFn: () => dashboardService.getLowStock(threshold),
        staleTime: FIVE_MIN,
    });
