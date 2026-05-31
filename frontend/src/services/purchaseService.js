import apiClient from './api/client';

export const purchaseService = {
    getPurchases: async (params = {}) => {
        const response = await apiClient.get('/purchases/', { params });
        return response.data;
    },

    getPurchaseById: async (id) => {
        const response = await apiClient.get(`/purchases/${id}`);
        return response.data;
    },

    createPurchase: async (purchaseData) => {
        const response = await apiClient.post('/purchases/', purchaseData);
        return response.data;
    },

    receivePurchase: async (id) => {
        const response = await apiClient.post(`/purchases/${id}/receive`);
        return response.data;
    },

    cancelPurchase: async (id) => {
        const response = await apiClient.post(`/purchases/${id}/cancel`);
        return response.data;
    },
};
