import React from 'react';
import { cn } from '../../../lib/utils';

export const Label = ({ className, required, error, children, ...props }) => {
    return (
        <label
            className={cn(
                'block text-xs font-semibold tracking-wide',
                error ? 'text-red-600' : 'text-slate-700',
                className,
            )}
            {...props}
        >
            {children}
            {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
    );
};
