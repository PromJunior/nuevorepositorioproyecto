import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const dashboardQueryKeys = {
    summary: ['dashboard', 'summary'],
};

export const useDashboard = () => {
    return useQuery({
        queryKey: dashboardQueryKeys.summary,
        queryFn: dashboardService.getDashboard,
        staleTime: 1000 * 60,
    });
};
