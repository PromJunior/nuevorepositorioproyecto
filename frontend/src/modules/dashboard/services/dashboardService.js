/**
 * Dashboard Service – nivel módulo.
 * Todos los endpoints son del router /dashboard/*.
 * Usa apiClient (Axios + JWT). NO usa fetch.
 */
import apiClient from '../../../services/api/client';

export const dashboardService = {
    /** KPIs principales: ventas, compras, inventario, caja, entidades */
    getSummary: async () => {
        const response = await apiClient.get('/dashboard/summary');
        return response.data;
    },

    /** Top N productos por cantidad vendida */
    getTopProducts: async (limit = 10) => {
        const response = await apiClient.get('/dashboard/top-products', { params: { limit } });
        return response.data;
    },

    /** Top N clientes por gasto total */
    getTopClients: async (limit = 8) => {
        const response = await apiClient.get('/dashboard/top-clients', { params: { limit } });
        return response.data;
    },

    /** Últimas N ventas con cliente, vendedor y método de pago */
    getRecentSales: async (limit = 10) => {
        const response = await apiClient.get('/dashboard/recent-sales', { params: { limit } });
        return response.data;
    },

    /** Últimas N compras con proveedor y estado */
    getRecentPurchases: async (limit = 10) => {
        const response = await apiClient.get('/dashboard/recent-purchases', { params: { limit } });
        return response.data;
    },

    /** Serie temporal de ventas diarias — últimos N días */
    getSalesChart: async (days = 30) => {
        const response = await apiClient.get('/dashboard/sales-chart', { params: { days } });
        return response.data;
    },

    /** Distribución de ingresos por método de pago */
    getPaymentMethodStats: async () => {
        const response = await apiClient.get('/dashboard/payment-methods');
        return response.data;
    },

    /** Productos con stock ≤ threshold */
    getLowStock: async (threshold = 5) => {
        const response = await apiClient.get('/dashboard/low-stock', { params: { threshold } });
        return response.data;
    },
};
