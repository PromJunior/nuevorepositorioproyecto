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

    getExportTracking: async () => {
        const response = await apiClient.get('/exports/tracking');
        return response.data;
    },

    resetExportTracking: async (module) => {
        const response = await apiClient.post('/exports/tracking/reset', { module });
        return response.data;
    },

    getBackupStatus: async () => {
        const response = await apiClient.get('/exports/backup-status');
        return response.data;
    },

    runDailyBackupNow: async () => {
        const response = await apiClient.post('/exports/daily-run', { incremental: true, trigger_type: 'manual' });
        return response.data;
    },
};
