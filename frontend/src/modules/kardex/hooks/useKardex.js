import { useQuery } from '@tanstack/react-query';
import { kardexService } from '../services/kardexService';

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const kardexKeys = {
    transactions: (params) => ['kardex', 'transactions', params],
    dailySummary: (params) => ['kardex', 'daily-summary', params],
    productKardex: (productId) => ['kardex', 'product', productId],
    summary: ['kardex', 'summary'],
    lowStock: (threshold) => ['kardex', 'low-stock', threshold],
};

// ─── Kardex General (con filtros + paginación) ───────────────────────────────
/**
 * @param {Object} params – product_id, transaction_type, user_id,
 *                          source_type, date_from, date_to, skip, limit
 */
export const useInventoryTransactions = (params = {}) =>
    useQuery({
        queryKey: kardexKeys.transactions(params),
        queryFn: () => kardexService.getTransactions(params),
        staleTime: 1000 * 30,
        placeholderData: (prev) => prev,  // mantener datos anteriores al paginar
    });

export const useKardexDailySummary = (params = {}) =>
    useQuery({
        queryKey: kardexKeys.dailySummary(params),
        queryFn: () => kardexService.getDailySummary(params),
        staleTime: 1000 * 30,
        placeholderData: (prev) => prev,
    });

// ─── Kardex por Producto ──────────────────────────────────────────────────────
/**
 * @param {number|string} productId
 * @param {{ skip?: number, limit?: number }} params
 */
export const useProductKardex = (productId, params = {}) =>
    useQuery({
        queryKey: kardexKeys.productKardex(productId),
        queryFn: () => kardexService.getKardexByProduct(productId, params),
        enabled: Boolean(productId),
        staleTime: 1000 * 30,
    });

// ─── Resumen Global ──────────────────────────────────────────────────────────
export const useInventorySummary = () =>
    useQuery({
        queryKey: kardexKeys.summary,
        queryFn: kardexService.getInventorySummary,
        staleTime: 1000 * 60,
    });

// ─── Productos bajo stock ─────────────────────────────────────────────────────
export const useLowStockProducts = (threshold = 5) =>
    useQuery({
        queryKey: kardexKeys.lowStock(threshold),
        queryFn: () => kardexService.getLowStockProducts(threshold),
        staleTime: 1000 * 60,
    });
