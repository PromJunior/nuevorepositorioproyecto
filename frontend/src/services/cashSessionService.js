import apiClient from './api/client';

export const cashSessionService = {
    getCurrentSession: async () => {
        const response = await apiClient.get('/cash-session/current');
        return response.data;
    },

    openSession: async (openingAmount) => {
        const response = await apiClient.post('/cash-session/open', { opening_amount: Number(openingAmount) });
        return response.data;
    },

    closeSession: async (closingAmount) => {
        const response = await apiClient.post('/cash-session/close', { closing_amount: Number(closingAmount) });
        return response.data;
    },

    getSessionHistory: async () => {
        const response = await apiClient.get('/cash-session/history');
        return response.data;
    },

    getSummary: async () => {
        const response = await apiClient.get('/summary');
        return response.data;
    },

    closeCashSession: async (closingData) => {
        const response = await apiClient.post('/close', closingData);
        return response.data;
    },

    getHistory: async () => {
        const response = await apiClient.get('/history');
        return response.data;
    },
};
