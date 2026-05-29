import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/clientService';

export const clientKeys = {
    all: ['clients'],
    list: (params = {}) => ['clients', 'list', params],
    summary: ['clients', 'summary'],
    detail: (id) => ['clients', 'detail', id],
    stats: (id) => ['clients', 'stats', id],
    history: (id, params = {}) => ['clients', 'history', id, params],
};

export const useClients = (params = {}) =>
    useQuery({
        queryKey: clientKeys.list(params),
        queryFn: () => clientService.getClients(params),
        staleTime: 1000 * 60 * 5,
    });

export const useClient = (id) =>
    useQuery({
        queryKey: clientKeys.detail(id),
        queryFn: () => clientService.getClientById(id),
        enabled: Boolean(id),
        staleTime: 1000 * 60 * 5,
    });

export const useClientsSummary = () =>
    useQuery({
        queryKey: clientKeys.summary,
        queryFn: clientService.getClientsSummary,
        staleTime: 1000 * 60 * 2,
    });

export const useClientStats = (id) =>
    useQuery({
        queryKey: clientKeys.stats(id),
        queryFn: () => clientService.getClientStats(id),
        enabled: Boolean(id),
        staleTime: 1000 * 60 * 2,
    });

export const useClientPurchaseHistory = (id, params = {}) =>
    useQuery({
        queryKey: clientKeys.history(id, params),
        queryFn: () => clientService.getClientPurchaseHistory(id, params),
        enabled: Boolean(id),
        staleTime: 1000 * 60,
    });

export const useCreateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: clientService.createClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export const useUpdateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => clientService.updateClient(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export const useDeactivateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: clientService.deactivateClient,
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export const useSearchClientByDni = () =>
    useMutation({
        mutationFn: clientService.getClientByDni,
    });
