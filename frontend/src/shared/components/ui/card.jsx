import React from 'react';
import { cn } from '../../../lib/utils';

export const Card = ({ className, ...props }) => (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...props} />
);
