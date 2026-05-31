import { create } from 'zustand';

export const useCashSessionStore = create((set) => ({
    currentSession: null,
    filters: {
        user: '',
        status: 'Todos',
        date: '',
    },

    setCurrentSession: (currentSession) => set({ currentSession }),
    clearCurrentSession: () => set({ currentSession: null }),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    clearFilters: () => set({ filters: { user: '', status: 'Todos', date: '' } }),
}));
