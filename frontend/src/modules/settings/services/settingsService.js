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

    getWebhookSettings: async () => {
        const response = await apiClient.get('/settings');
        return response.data.automations;
    },

    updateWebhookSettings: async (payload) => {
        const settingsResponse = await apiClient.get('/settings');
        const response = await apiClient.put('/settings', {
            ...settingsResponse.data,
            automations: payload,
        });
        return response.data;
    },

    testWebhook: async () => {
        const response = await apiClient.post('/automations/webhook/test');
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
