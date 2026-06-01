import apiClient from '../../../services/api/client';

export const automationsService = {
    getEvents: async () => {
        const response = await apiClient.get('/automations/events', { params: { limit: 50 } });
        return response.data;
    },

    retryEvent: async (logId) => {
        const response = await apiClient.post('/automations/events/retry', { log_id: logId });
        return response.data;
    },
};
