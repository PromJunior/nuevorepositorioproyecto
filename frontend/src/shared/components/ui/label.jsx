import React from 'react';
import { cn } from '../../../lib/utils';

export const Label = ({ className, ...props }) => {
    return (
        <label
            className={cn('block text-xs font-bold uppercase tracking-wider text-slate-700', className)}
            {...props}
        />
    );
};
