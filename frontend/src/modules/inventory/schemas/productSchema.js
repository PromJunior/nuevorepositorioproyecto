import { z } from 'zod';

export const productSchema = z.object({
    name_product: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    price: z.coerce.number().positive({ message: 'El precio debe ser mayor a 0.' }),
    stock: z.coerce.number().int().nonnegative({ message: 'El stock no puede ser negativo.' }),
    category_id: z.coerce.number().int().positive({ message: 'Selecciona una categoria valida.' }),
    description: z.string().trim().optional().default(''),
    stockProduct: z.boolean().default(true),
});

export const stockAdjustmentSchema = z.object({
    amount: z.coerce.number().int().positive({ message: 'Ingresa una cantidad mayor a cero.' }),
});
