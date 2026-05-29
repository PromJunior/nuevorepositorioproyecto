import apiClient from '../../../services/api/client';

export const clientService = {
    getClients: async (params = {}) => {
        const response = await apiClient.get('/clients/', { params });
        return response.data;
    },

    getClientById: async (id) => {
        const response = await apiClient.get(`/clients/${id}`);
        return response.data;
    },

    getClientByDni: async (dni) => {
        const response = await apiClient.get(`/clients/dni-local/${dni}`);
        return response.data;
    },

    consultDni: async (dni) => {
        const response = await apiClient.get(`/clients/dni/${dni}`);
        return response.data;
    },

    createClient: async (clientData) => {
        const response = await apiClient.post('/clients/', clientData);
        return response.data;
    },

    getClientsSummary: async () => {
        const response = await apiClient.get('/clients/stats/summary');
        return response.data;
    },

    updateClient: async (id, clientData) => {
        const response = await apiClient.put(`/clients/${id}`, clientData);
        return response.data;
    },

    deactivateClient: async (id) => {
        const response = await apiClient.delete(`/clients/${id}`);
        return response.data;
    },

    getClientStats: async (id) => {
        const response = await apiClient.get(`/clients/${id}/stats`);
        return response.data;
    },

    getClientPurchaseHistory: async (id, params = {}) => {
        const response = await apiClient.get(`/clients/${id}/purchase-history`, { params });
        return response.data;
    },
};
