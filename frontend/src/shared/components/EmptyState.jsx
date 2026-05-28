import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export const EmptyState = ({ title = 'Sin datos', description = 'No hay informacion para mostrar.', icon: Icon = Inbox, action, className }) => (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center', className)}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            {React.createElement(Icon, { size: 22 })}
        </div>
        <h3 className="mt-4 text-base font-black text-slate-900">{title}</h3>
        <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">{description}</p>
        {action && <div className="mt-5">{action}</div>}
    </div>
);
