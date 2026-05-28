import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const normalizeCartItem = (product, quantity = 1) => ({
    product_id: product.product_id || product.id,
    name_product: product.name_product,
    price: Number(product.price),
    quantity: Number(quantity),
    stock: Number(product.stock ?? product.available_stock ?? 0),
});

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product, quantity = 1) => {
                const currentItems = get().items;
                const productId = product.id || product.product_id;
                const existingItem = currentItems.find((item) => item.product_id === productId);
                const nextQuantity = Number(quantity);

                if (existingItem) {
                    set({
                        items: currentItems.map((item) => {
                            if (item.product_id !== productId) return item;
                            const stockLimit = Number(product.stock ?? item.stock ?? Infinity);
                            return {
                                ...item,
                                stock: Number(product.stock ?? item.stock ?? 0),
                                quantity: Math.min(Number(item.quantity) + nextQuantity, stockLimit),
                            };
                        }),
                    });
                    return;
                }

                set({ items: [...currentItems, normalizeCartItem(product, nextQuantity)] });
            },

            removeItem: (productId) => {
                set({ items: get().items.filter((item) => item.product_id !== productId) });
            },

            updateQuantity: (productId, quantity) => {
                set({
                    items: get().items.map((item) => {
                        if (item.product_id !== productId) return item;
                        const stockLimit = Number(item.stock || Infinity);
                        const safeQuantity = Math.max(1, Math.min(Number(quantity), stockLimit));
                        return { ...item, quantity: safeQuantity };
                    }),
                });
            },

            syncStock: (products) => {
                set({
                    items: get().items.map((item) => {
                        const product = products.find((entry) => entry.id === item.product_id);
                        if (!product) return item;
                        const stock = Number(product.stock || 0);
                        return {
                            ...item,
                            price: Number(product.price),
                            stock,
                            quantity: Math.min(Number(item.quantity), Math.max(stock, 1)),
                        };
                    }),
                });
            },

            clearCart: () => set({ items: [] }),

            getSubtotal: () => get().items.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
            getTotal: () => get().items.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
        }),
        {
            name: 'erp-sales-cart',
            partialize: (state) => ({ items: state.items }),
        },
    ),
);
