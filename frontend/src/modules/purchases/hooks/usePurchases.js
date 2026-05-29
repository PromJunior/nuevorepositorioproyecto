import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseService } from '../../../services/purchaseService';
import { kardexKeys } from '../../kardex/hooks/useKardex';

export const purchaseKeys = {
    all: ['purchases'],
    list: (params) => ['purchases', 'list', params],
    detail: (id) => ['purchases', 'detail', id],
};

// ─── Listar compras ───────────────────────────────────────────────────────────
export const usePurchases = (params = {}) =>
    useQuery({
        queryKey: purchaseKeys.list(params),
        queryFn: () => purchaseService.getPurchases(params),
        staleTime: 1000 * 30,
    });

// ─── Detalle de compra ────────────────────────────────────────────────────────
export const usePurchase = (id) =>
    useQuery({
        queryKey: purchaseKeys.detail(id),
        queryFn: () => purchaseService.getPurchaseById(id),
        enabled: Boolean(id),
        staleTime: 1000 * 30,
    });

// ─── Crear compra (borrador) ──────────────────────────────────────────────────
export const useCreatePurchase = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: purchaseService.createPurchase,
        onSuccess: () => qc.invalidateQueries({ queryKey: purchaseKeys.all }),
    });
};

// ─── Recibir compra ───────────────────────────────────────────────────────────
export const useReceivePurchase = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: purchaseService.receivePurchase,
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: purchaseKeys.all });
            qc.invalidateQueries({ queryKey: purchaseKeys.detail(id) });
            // Invalida Kardex para reflejar la entrada
            qc.invalidateQueries({ queryKey: kardexKeys.summary });
            qc.invalidateQueries({ queryKey: ['kardex', 'transactions'] });
            qc.invalidateQueries({ queryKey: ['inventory', 'products'] });
        },
    });
};

// ─── Cancelar compra ──────────────────────────────────────────────────────────
export const useCancelPurchase = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: purchaseService.cancelPurchase,
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: purchaseKeys.all });
            qc.invalidateQueries({ queryKey: purchaseKeys.detail(id) });
        },
    });
};
