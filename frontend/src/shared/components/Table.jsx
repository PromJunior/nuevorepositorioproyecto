import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ className, ...props }) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
            <table className={cn('w-full border-collapse text-left text-sm', className)} {...props} />
        </div>
    </div>
);

export const TableHead = ({ className, ...props }) => (
    <thead className={cn('border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400', className)} {...props} />
);

export const TableBody = ({ className, ...props }) => (
    <tbody className={cn('divide-y divide-slate-100 text-slate-700', className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
    <tr className={cn('transition hover:bg-slate-50/70', className)} {...props} />
);

export const TableCell = ({ className, as: Component = 'td', ...props }) => (
    React.createElement(Component, { className: cn('p-4 align-middle', className), ...props })
);
