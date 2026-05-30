import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashSessionService } from '../../../services/cashSessionService';

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const cashSessionKeys = {
    active: ['cash-session', 'active'],
    summary: (params = {}) => ['cash-session', 'summary', params],
    history: (params = {}) => ['cash-session', 'history', params],
};

const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, value]) => value));

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
export const useSessionSummary = (hasSession, params = {}) =>
    useQuery({
        queryKey: cashSessionKeys.summary(clean(params)),
        queryFn: async () => {
            try {
                return await cashSessionService.getActiveSummary(clean(params));
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
export const useSessionHistory = (params = {}) =>
    useQuery({
        queryKey: cashSessionKeys.history(clean(params)),
        queryFn: () => cashSessionService.getSessionHistory(clean(params)),
        staleTime: 1000 * 60,
    });

// ─── Abrir caja ──────────────────────────────────────────────────────────────
export const useOpenSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cashSessionService.openSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cashSessionKeys.active });
            queryClient.invalidateQueries({ queryKey: ['cash-session', 'summary'] });
            queryClient.invalidateQueries({ queryKey: ['cash-session', 'history'] });
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
            queryClient.invalidateQueries({ queryKey: ['cash-session', 'summary'] });
            queryClient.invalidateQueries({ queryKey: ['cash-session', 'history'] });
        },
    });
};
