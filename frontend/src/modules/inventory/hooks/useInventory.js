import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';

export const useInventory = () => {
    const queryClient = useQueryClient();

    // 1. Obtención de productos con React Query (caché y revalidación asíncrona)
    const productsQuery = useQuery({
        queryKey: ['products'],
        queryFn: productService.getProducts,
        staleTime: 1000 * 60 * 5, // Datos frescos por 5 minutos
    });

    // 2. Obtención de categorías
    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: productService.getCategories,
        staleTime: 1000 * 60 * 10, // Datos frescos por 10 minutos
    });

    // 3. Mutación: Crear Producto
    const createProductMutation = useMutation({
        mutationFn: productService.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    // 4. Mutación: Actualizar Producto
    const updateProductMutation = useMutation({
        mutationFn: ({ id, data }) => productService.updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    // 5. Mutación: Eliminar Producto
    const deleteProductMutation = useMutation({
        mutationFn: productService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    return {
        // Datos y Estados
        products: productsQuery.data || [],
        categories: categoriesQuery.data || [],
        isLoading: productsQuery.isLoading || categoriesQuery.isLoading,
        isError: productsQuery.isError || categoriesQuery.isError,
        error: productsQuery.error || categoriesQuery.error,

        // Operaciones de Mutación
        createProduct: createProductMutation.mutateAsync,
        isCreating: createProductMutation.isPending,

        updateProduct: updateProductMutation.mutateAsync,
        isUpdating: updateProductMutation.isPending,

        deleteProduct: deleteProductMutation.mutateAsync,
        isDeleting: deleteProductMutation.isPending,

        // Forzar actualización manual
        refetchProducts: productsQuery.refetch
    };
};
