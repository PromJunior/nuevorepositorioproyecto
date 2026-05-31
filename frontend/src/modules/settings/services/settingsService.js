import apiClient from '../../../services/api/client';

export const settingsService = {
    getSettings: async () => {
        const response = await apiClient.get('/settings');
        return response.data;
    },

    getRuntimeSettings: async () => {
        const response = await apiClient.get('/settings/runtime');
        return response.data;
    },

    updateSettings: async (payload) => {
        const response = await apiClient.put('/settings', payload);
        return response.data;
    },

    getCompany: async () => {
        const response = await apiClient.get('/settings/company');
        return response.data;
    },

    updateCompany: async (payload) => {
        const response = await apiClient.put('/settings/company', payload);
        return response.data;
    },

    updatePaymentMethod: async (id, payload) => {
        const response = await apiClient.put(`/settings/payment-methods/${id}`, payload);
        return response.data;
    },
};
