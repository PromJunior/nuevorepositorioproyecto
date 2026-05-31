import React from 'react';
import { Card } from '../../../shared/components/ui/card';

export const Field = ({ label, children }) => (
    <label className="space-y-1.5">
        <span className="block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>
        {children}
    </label>
);

export const TextInput = ({ readOnly = false, className = '', ...props }) => (
    <input
        readOnly={readOnly}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 read-only:bg-slate-50 read-only:text-slate-500 ${className}`}
        {...props}
    />
);

export const SelectInput = ({ readOnly = false, children, ...props }) => (
    <select
        disabled={readOnly}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
        {...props}
    >
        {children}
    </select>
);

export const Toggle = ({ checked, onChange, disabled = false }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition disabled:opacity-60 ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
        aria-pressed={checked}
    >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);

export const Section = ({ title, description, children }) => (
    <Card className="p-5">
        <div className="mb-5">
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>}
        </div>
        {children}
    </Card>
);

export const FieldGrid = ({ children }) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
);
