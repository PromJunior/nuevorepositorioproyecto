import apiClient from './api/client';

export const paymentService = {
    getPaymentMethods: async () => {
        const response = await apiClient.get('/payment_methods/');
        return response.data;
    },
};
