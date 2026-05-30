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

    getCrmClients: async (params = {}) => {
        const response = await apiClient.get('/clients/crm/list', { params });
        return response.data;
    },

    getCrmSegments: async (params = {}) => {
        const response = await apiClient.get('/clients/crm/segments', { params });
        return response.data;
    },

    getCrmRanking: async (params = {}) => {
        const response = await apiClient.get('/clients/crm/ranking', { params });
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

    getClientNotes: async (id) => {
        const response = await apiClient.get(`/clients/${id}/notes`);
        return response.data;
    },

    createClientNote: async (id, data) => {
        const response = await apiClient.post(`/clients/${id}/notes`, data);
        return response.data;
    },

    getClientFollowUps: async (id) => {
        const response = await apiClient.get(`/clients/${id}/follow-ups`);
        return response.data;
    },

    createClientFollowUp: async (id, data) => {
        const response = await apiClient.post(`/clients/${id}/follow-ups`, data);
        return response.data;
    },

    updateClientFollowUp: async (id, data) => {
        const response = await apiClient.put(`/clients/follow-ups/${id}`, data);
        return response.data;
    },
};
