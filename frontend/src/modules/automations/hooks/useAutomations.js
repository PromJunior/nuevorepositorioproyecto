import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { automationsService } from '../services/automationsService';

export const automationsKeys = {
    events: ['automations', 'events'],
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
