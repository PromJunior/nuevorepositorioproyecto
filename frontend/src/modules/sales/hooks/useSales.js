import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/salesService';

export const salesQueryKeys = {
    products: ['sales', 'products'],
    paymentMethods: ['sales', 'payment-methods'],
    client: (dni) => ['sales', 'client', dni],
};

export const useSalesProducts = () => useQuery({
    queryKey: salesQueryKeys.products,
    queryFn: salesService.getProducts,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
});

export const usePaymentMethods = () => useQuery({
    queryKey: salesQueryKeys.paymentMethods,
    queryFn: salesService.getPaymentMethods,
    staleTime: 1000 * 60 * 10,
});

export const useCreateSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: salesService.createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesQueryKeys.products });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

export const useCreateClient = () => useMutation({
    mutationFn: salesService.createClient,
});

export const useSearchClient = () => useMutation({
    mutationFn: async (dni) => {
        if (!dni || dni.length !== 8) {
            throw new Error('El DNI debe tener 8 dígitos');
        }
        try {
            // 1. Intentar buscar localmente
            const localClient = await salesService.getClientByDni(dni);
            return { client: localClient, source: 'local', exists: true };
        } catch (error) {
            // Si retorna 404 (no existe en BD), buscar en API Perú
            if (error.response?.status === 404) {
                try {
                    const externalData = await salesService.consultDni(dni);
                    return { client: externalData, source: 'external', exists: false };
                } catch (extError) {
                    const detail = extError.response?.data?.detail || extError.message || 'Error de búsqueda en API Perú';
                    throw new Error(detail);
                }
            }
            throw new Error(error.response?.data?.detail || error.message || 'Error al buscar cliente en BD');
        }
    }
});

