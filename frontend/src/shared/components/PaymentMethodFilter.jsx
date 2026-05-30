import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../../services/paymentService';

const METHOD_ORDER = ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta', 'otros'];
const QUICK_METHODS = ['efectivo', 'yape', 'plin'];

const normalize = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getOrderedMethods = (methods, quickOnly) => {
    const allowed = quickOnly ? QUICK_METHODS : METHOD_ORDER;

    return methods
        .filter((method) => allowed.includes(normalize(method.name_payment_method)))
        .sort((a, b) => {
            const aIndex = allowed.indexOf(normalize(a.name_payment_method));
            const bIndex = allowed.indexOf(normalize(b.name_payment_method));
            return aIndex - bIndex;
        });
};

const usePaymentMethodOptions = (quickOnly = false) =>
    useQuery({
        queryKey: ['payment-method-options', quickOnly],
        queryFn: paymentService.getPaymentMethods,
        select: (methods) => getOrderedMethods(methods, quickOnly),
        staleTime: 1000 * 60 * 10,
    });

export const PaymentMethodFilter = ({
    value = '',
    onChange,
    quickOnly = false,
    variant = 'select',
    className = '',
}) => {
    const { data: methods = [] } = usePaymentMethodOptions(quickOnly);
    const selectedValue = value || '';

    if (variant === 'buttons') {
        return (
            <div className={`flex flex-wrap gap-2 ${className}`}>
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                        selectedValue === ''
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Todos
                </button>
                {methods.map((method) => {
                    const methodValue = String(method.id);
                    return (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => onChange(methodValue)}
                            className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                                selectedValue === methodValue
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {method.name_payment_method}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <select
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 ${className}`}
            value={selectedValue}
            onChange={(event) => onChange(event.target.value)}
        >
            <option value="">Todos</option>
            {methods.map((method) => (
                <option key={method.id} value={method.id}>
                    {method.name_payment_method}
                </option>
            ))}
        </select>
    );
};
