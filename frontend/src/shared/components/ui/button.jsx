import React from 'react';
import { cn } from '../../../lib/utils';

const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/10',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
};

export const Button = ({ className, variant = 'default', type = 'button', ...props }) => {
    return (
        <button
            type={type}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold outline-none transition disabled:cursor-not-allowed disabled:opacity-60',
                variants[variant] || variants.default,
                className,
            )}
            {...props}
        />
    );
};
