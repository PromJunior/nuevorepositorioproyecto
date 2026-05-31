import { create } from 'zustand';

export const useOrderStore = create((set) => ({
    selectedOrder: null,
    filters: {
        client: '',
        dateFrom: '',
        dateTo: '',
        saleType: 'Todos',
        minAmount: '',
    },

    setSelectedOrder: (selectedOrder) => set({ selectedOrder }),
    clearSelectedOrder: () => set({ selectedOrder: null }),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    clearFilters: () => set({
        filters: {
            client: '',
            dateFrom: '',
            dateTo: '',
            saleType: 'Todos',
            minAmount: '',
        },
    }),
}));
