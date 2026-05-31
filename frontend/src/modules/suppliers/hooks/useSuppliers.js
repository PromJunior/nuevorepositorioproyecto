import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../services/supplierService';

export const supplierKeys = {
    all: ['suppliers'],
    list: ['suppliers', 'list'],
};

export const useSuppliers = () =>
    useQuery({
        queryKey: supplierKeys.list,
        queryFn: supplierService.getSuppliers,
        staleTime: 1000 * 60 * 5,
    });

export const useCreateSupplier = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: supplierService.createSupplier,
        onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
    });
};

export const useGenericSupplier = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: supplierService.getOrCreateGenericSupplier,
        onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
    });
};

export const useUpdateSupplier = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => supplierService.updateSupplier(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
    });
};

export const useSearchRuc = () =>
    useMutation({
        mutationFn: async (ruc) => {
            if (!ruc || ruc.length !== 11) throw new Error('El RUC debe tener 11 digitos');
            try {
                const local = await supplierService.getSupplierByRucLocal(ruc);
                return { source: 'local', data: local, exists: true };
            } catch (err) {
                if (err.response?.status === 404) {
                    const external = await supplierService.consultRuc(ruc);
                    return { source: 'external', data: external, exists: false };
                }
                throw err;
            }
        },
    });
