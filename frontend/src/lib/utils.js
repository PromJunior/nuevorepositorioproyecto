export const cn = (...classes) => {
    return classes.flatMap((item) => {
        if (!item) return [];
        if (typeof item === 'string') return [item];
        if (Array.isArray(item)) return item;
        if (typeof item === 'object') {
            return Object.entries(item)
                .filter(([, value]) => Boolean(value))
                .map(([key]) => key);
        }
        return [];
    }).join(' ');
};
