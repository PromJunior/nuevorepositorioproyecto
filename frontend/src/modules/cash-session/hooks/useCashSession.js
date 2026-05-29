import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashSessionService } from '../../../services/cashSessionService';

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const cashSessionKeys = {
    active: ['cash-session', 'active'],
    summary: ['cash-session', 'summary'],
    history: ['cash-session', 'history'],
};

// ─── Sesión activa ───────────────────────────────────────────────────────────
/**
 * Devuelve la sesión de caja abierta del usuario.
 * `data` es null si el servidor responde 404 (sin sesión abierta).
 */
export const useActiveSession = () =>
    useQuery({
        queryKey: cashSessionKeys.active,
        queryFn: async () => {
            try {
                return await cashSessionService.getActiveSession();
            } catch (error) {
                if (error.response?.status === 404) return null;
                throw error;
            }
        },
        staleTime: 1000 * 30,
        retry: false,
    });

// ─── Resumen de la sesión activa ─────────────────────────────────────────────
/**
 * Ventas del día, efectivo esperado, total de órdenes, diferencia.
 * Solo consulta si hay sesión abierta (enabled depende de `hasSession`).
 */
export const useSessionSummary = (hasSession) =>
    useQuery({
        queryKey: cashSessionKeys.summary,
        queryFn: async () => {
            try {
                return await cashSessionService.getActiveSummary();
            } catch (error) {
                if (error.response?.status === 404) return null;
                throw error;
            }
        },
        enabled: Boolean(hasSession),
        staleTime: 1000 * 15,
        refetchInterval: 1000 * 30,
    });

// ─── Historial ───────────────────────────────────────────────────────────────
export const useSessionHistory = () =>
    useQuery({
        queryKey: cashSessionKeys.history,
        queryFn: cashSessionService.getSessionHistory,
        staleTime: 1000 * 60,
    });

// ─── Abrir caja ──────────────────────────────────────────────────────────────
export const useOpenSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cashSessionService.openSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cashSessionKeys.active });
            queryClient.invalidateQueries({ queryKey: cashSessionKeys.summary });
            queryClient.invalidateQueries({ queryKey: cashSessionKeys.history });
        },
    });
};

// ─── Cerrar caja ─────────────────────────────────────────────────────────────
export const useCloseSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cashSessionService.closeSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cashSessionKeys.active });
            queryClient.invalidateQueries({ queryKey: cashSessionKeys.summary });
            queryClient.invalidateQueries({ queryKey: cashSessionKeys.history });
        },
    });
};
