import apiClient from './api/client';

export const cashSessionService = {
    /** Abre una nueva sesión de caja */
    openSession: async (openingAmount) => {
        const response = await apiClient.post('/cash-session/open', {
            opening_amount: Number(openingAmount),
        });
        return response.data;
    },

    /** Devuelve la sesión activa (OPEN) del usuario autenticado — 404 si no hay */
    getActiveSession: async () => {
        const response = await apiClient.get('/cash-session/active');
        return response.data;
    },

    /** Resumen de la sesión activa: ventas, totales, diferencia esperada */
    getActiveSummary: async (params = {}) => {
        const response = await apiClient.get('/cash-session/active/summary', { params });
        return response.data;
    },

    /** Cierra la sesión activa del usuario */
    closeSession: async (closingAmount) => {
        const response = await apiClient.post('/cash-session/close', {
            closing_amount: Number(closingAmount),
        });
        return response.data;
    },

    /**
     * Historial de sesiones.
     * Admin → todas las sesiones.
     * Vendedor → solo las propias.
     */
    getSessionHistory: async (params = {}) => {
        const response = await apiClient.get('/cash-session/history', { params });
        return response.data;
    },
};
