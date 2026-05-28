import apiClient from './api/client';

export const cashSessionService = {
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
