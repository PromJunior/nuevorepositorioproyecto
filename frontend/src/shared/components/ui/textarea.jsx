import React from 'react';
import { cn } from '../../../lib/utils';

export const Textarea = ({ className, error, ...props }) => {
    return (
        <textarea
            className={cn(
                'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-150 resize-y min-h-[80px]',
                'placeholder:text-slate-400',
                'focus:ring-2',
                error
                    ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15',
                'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
                className,
            )}
            {...props}
        />
    );
};
