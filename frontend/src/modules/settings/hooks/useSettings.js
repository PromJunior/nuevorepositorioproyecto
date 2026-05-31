import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';

export const settingsKeys = {
    all: ['settings'],
    company: ['settings', 'company'],
    runtime: ['settings', 'runtime'],
};

export const useSettings = () =>
    useQuery({
        queryKey: settingsKeys.all,
        queryFn: settingsService.getSettings,
    });

export const useCompanySettings = () =>
    useQuery({
        queryKey: settingsKeys.company,
        queryFn: settingsService.getCompany,
    });

export const useRuntimeSettings = () =>
    useQuery({
        queryKey: settingsKeys.runtime,
        queryFn: settingsService.getRuntimeSettings,
    });

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: settingsService.updateSettings,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
    });
};

export const useUpdateCompanySettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: settingsService.updateCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.all });
            queryClient.invalidateQueries({ queryKey: settingsKeys.company });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export const useUpdatePaymentMethodSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => settingsService.updatePaymentMethod(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.all });
            queryClient.invalidateQueries({ queryKey: ['payment-method-options'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};
