export const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
};

export const formatNumber = (value) => {
    return new Intl.NumberFormat('es-PE').format(Number(value || 0));
};

export const formatDateTime = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

export const toNumber = (value) => Number(value || 0);
