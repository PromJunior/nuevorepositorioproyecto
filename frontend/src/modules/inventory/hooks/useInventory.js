import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';

export const inventoryQueryKeys = {
    products: ['inventory', 'products'],
    categories: ['inventory', 'categories'],
};

export const useInventory = () => {
    const queryClient = useQueryClient();

    const invalidateProducts = () => {
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.products });
    };

    const productsQuery = useQuery({
        queryKey: inventoryQueryKeys.products,
        queryFn: productService.getProducts,
        staleTime: 1000 * 60 * 5,
    });

    const categoriesQuery = useQuery({
        queryKey: inventoryQueryKeys.categories,
        queryFn: productService.getCategories,
        staleTime: 1000 * 60 * 10,
    });

    const createProductMutation = useMutation({
        mutationFn: productService.createProduct,
        onSuccess: invalidateProducts,
    });

    const updateProductMutation = useMutation({
        mutationFn: ({ id, data }) => productService.updateProduct(id, data),
        onSuccess: invalidateProducts,
    });

    const deleteProductMutation = useMutation({
        mutationFn: productService.deleteProduct,
        onSuccess: invalidateProducts,
    });

    return {
        products: productsQuery.data || [],
        categories: categoriesQuery.data || [],
        isLoading: productsQuery.isLoading || categoriesQuery.isLoading,
        isFetching: productsQuery.isFetching || categoriesQuery.isFetching,
        isError: productsQuery.isError || categoriesQuery.isError,
        error: productsQuery.error || categoriesQuery.error,

        createProduct: createProductMutation.mutateAsync,
        isCreating: createProductMutation.isPending,

        updateProduct: updateProductMutation.mutateAsync,
        isUpdating: updateProductMutation.isPending,

        deleteProduct: deleteProductMutation.mutateAsync,
        isDeleting: deleteProductMutation.isPending,

        refetchProducts: productsQuery.refetch,
    };
};
