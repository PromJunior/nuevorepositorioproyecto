import React from 'react';
import { cn } from '../../../lib/utils';

export const Select = ({ className, error, children, ...props }) => {
    return (
        <select
            className={cn(
                'w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-150',
                'focus:ring-2',
                error
                    ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15',
                'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
                'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")] bg-[right_0.75rem_center] bg-no-repeat pr-10',
                className,
            )}
            {...props}
        >
            {children}
        </select>
    );
};
