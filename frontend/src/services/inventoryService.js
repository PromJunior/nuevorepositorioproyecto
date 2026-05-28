import { productService } from './productService';

export const inventoryService = {
    getProducts: productService.getProducts,
    getCategories: productService.getCategories,
};
