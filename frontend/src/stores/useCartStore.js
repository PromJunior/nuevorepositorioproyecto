import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
    items: [],

    addItem: (product, quantity = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.product_id === product.id);

        if (existingItem) {
            set({
                items: currentItems.map((item) => (
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )),
            });
            return;
        }

        set({
            items: [
                ...currentItems,
                {
                    product_id: product.id,
                    name_product: product.name_product,
                    price: Number(product.price),
                    quantity,
                },
            ],
        });
    },

    removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.product_id !== productId) });
    },

    updateQuantity: (productId, quantity) => {
        set({
            items: get().items.map((item) => (
                item.product_id === productId
                    ? { ...item, quantity: Number(quantity) }
                    : item
            )),
        });
    },

    clearCart: () => set({ items: [] }),

    getTotal: () => get().items.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
}));
