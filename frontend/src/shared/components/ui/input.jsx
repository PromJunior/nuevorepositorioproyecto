import React from 'react';
import { cn } from '../../../lib/utils';

export const Input = ({ className, ...props }) => {
    return (
        <input
            className={cn(
                'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10',
                className,
            )}
            {...props}
        />
    );
};
