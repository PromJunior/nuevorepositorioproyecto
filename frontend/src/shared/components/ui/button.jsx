import React from 'react';
import { cn } from '../../../lib/utils';

const variants = {
    default:   'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/10 focus-visible:ring-2 focus-visible:ring-blue-600/30',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
    ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/10',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/10',
    outline:   'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
};

const sizes = {
    sm:  'h-8 px-3 text-xs',
    md:  'h-9 px-4 text-sm',
    lg:  'h-10 px-5 text-sm',
    xl:  'h-11 px-6 text-base',
    icon:'h-9 w-9 p-0',
};

const Spinner = () => (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

export const Button = ({
    className,
    variant = 'default',
    size = 'md',
    loading = false,
    disabled,
    children,
    type = 'button',
    ...props
}) => {
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            disabled={isDisabled}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg font-semibold outline-none transition-all duration-150',
                'disabled:cursor-not-allowed disabled:opacity-55',
                variants[variant] ?? variants.default,
                sizes[size] ?? sizes.md,
                className,
            )}
            {...props}
        >
            {loading && <Spinner />}
            {children}
        </button>
    );
};
