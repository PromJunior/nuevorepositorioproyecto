import React from 'react';

export const PageHeader = ({ title, description, actions, eyebrow }) => (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
            {eyebrow && <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">{eyebrow}</span>}
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{title}</h1>
            {description && <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
);
