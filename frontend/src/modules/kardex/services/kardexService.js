import apiClient from '../../../services/api/client';

const cleanParams = (params = {}) =>
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

const downloadBlob = (data, filename) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Servicio Kardex – todas las llamadas usan apiClient (Axios con JWT).
 */
export const kardexService = {
    /**
     * Kardex General: lista paginada con filtros.
     * @param {Object} params – product_id, transaction_type, user_id,
     *                          source_type, date_from, date_to, skip, limit
     * @returns {{ items: [], total: number }}
     */
    getTransactions: async (params = {}) => {
        // Eliminar claves vacías para no enviar ?product_id= vacío
        const response = await apiClient.get('/inventory/transactions', { params: cleanParams(params) });
        return response.data;
    },

    getDailySummary: async (params = {}) => {
        const response = await apiClient.get('/reports/kardex/daily-summary', {
            params: cleanParams(params),
        });
        return response.data;
    },

    exportDailySummaryExcel: async (params = {}) => {
        const response = await apiClient.get('/reports/kardex/daily-summary/export/excel', {
            params: cleanParams(params),
            responseType: 'blob',
        });
        downloadBlob(response.data, `resumen_diario_kardex_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },

    exportDailySummaryCsv: async (params = {}) => {
        const response = await apiClient.get('/reports/kardex/daily-summary/export/csv', {
            params: cleanParams(params),
            responseType: 'blob',
        });
        downloadBlob(response.data, `resumen_diario_kardex_${new Date().toISOString().slice(0, 10)}.csv`);
    },

    exportDailySummaryPdf: async (params = {}) => {
        const response = await apiClient.get('/reports/kardex/daily-summary/export/pdf', {
            params: cleanParams(params),
            responseType: 'blob',
        });
        downloadBlob(response.data, `resumen_diario_kardex_${new Date().toISOString().slice(0, 10)}.pdf`);
    },

    /**
     * Kardex por Producto: info del producto + movimientos cronológicos.
     * @param {number} productId
     * @param {{ skip?: number, limit?: number }} params
     * @returns {ProductKardexResponse}
     */
    getKardexByProduct: async (productId, params = {}) => {
        const response = await apiClient.get(`/inventory/kardex/${productId}`, { params });
        return response.data;
    },

    /**
     * Resumen global del inventario.
     * @returns {InventorySummaryResponse}
     */
    getInventorySummary: async () => {
        const response = await apiClient.get('/inventory/summary');
        return response.data;
    },

    /**
     * Productos con stock por debajo del umbral.
     * @param {number} threshold – por defecto 5
     */
    getLowStockProducts: async (threshold = 5) => {
        const response = await apiClient.get('/inventory/low-stock', {
            params: { threshold },
        });
        return response.data;
    },
};
