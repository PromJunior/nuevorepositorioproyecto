import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { automationsService } from '../services/automationsService';

export const automationsKeys = {
    events: ['automations', 'events'],
    exportTracking: ['automations', 'export-tracking'],
    backupStatus: ['automations', 'backup-status'],
};

export const useAutomationEvents = () =>
    useQuery({
        queryKey: automationsKeys.events,
        queryFn: automationsService.getEvents,
        refetchInterval: 30000,
    });

export const useRetryAutomationEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: automationsService.retryEvent,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: automationsKeys.events }),
    });
};

export const useExportTracking = () =>
    useQuery({
        queryKey: automationsKeys.exportTracking,
        queryFn: automationsService.getExportTracking,
        refetchInterval: 30000,
    });

export const useResetExportTracking = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: automationsService.resetExportTracking,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: automationsKeys.exportTracking }),
    });
};

export const useBackupStatus = () =>
    useQuery({
        queryKey: automationsKeys.backupStatus,
        queryFn: automationsService.getBackupStatus,
        refetchInterval: 30000,
    });

export const useRunDailyBackupNow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: automationsService.runDailyBackupNow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: automationsKeys.backupStatus });
            queryClient.invalidateQueries({ queryKey: automationsKeys.exportTracking });
        },
    });
};
