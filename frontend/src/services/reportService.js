import apiClient from './api/client';

export const reportService = {
    getSalesReport: async () => {
        const response = await apiClient.get('/sales_report/');
        return response.data;
    },
};
