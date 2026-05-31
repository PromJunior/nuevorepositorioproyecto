import React from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

export const Modal = ({ isOpen, title, description, children, footer, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <button type="button" aria-label="Cerrar modal" className="absolute inset-0 cursor-default" onClick={onClose} />
            <section className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
                <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">{title}</h2>
                        {description && <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>}
                    </div>
                    <Button variant="ghost" className="px-2" onClick={onClose}>
                        <X size={18} />
                    </Button>
                </header>
                <div className="p-5">{children}</div>
                {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 p-5">{footer}</footer>}
            </section>
        </div>
    );
};
