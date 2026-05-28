import apiClient from './api/client';

export const purchaseService = {
    getPurchases: async (params = {}) => {
        const response = await apiClient.get('/purchases/', { params });
        return response.data;
    },

    createPurchase: async (purchaseData) => {
        const response = await apiClient.post('/purchases/', purchaseData);
        return response.data;
    },
};
