import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../../lib/utils';

const SIZES = {
    sm:   'max-w-md',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-[95vw]',
};

/**
 * Modal
 *
 * Props:
 *   isOpen      boolean
 *   title       string
 *   description string
 *   size        'sm' | 'md' | 'lg' | 'xl' | 'full'
 *   onClose     fn
 *   children    ReactNode
 *   footer      ReactNode
 *   hideClose   boolean    — oculta el botón X
 *   className   string     — clases extra para el panel
 */
export const Modal = ({
    isOpen,
    title,
    description,
    size      = 'md',
    onClose,
    children,
    footer,
    hideClose = false,
    className,
}) => {
    const panelRef = useRef(null);

    /* Cerrar con Escape */
    useEffect(() => {
        if (!isOpen) return;
        const handle = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', handle);
        return () => document.removeEventListener('keydown', handle);
    }, [isOpen, onClose]);

    /* Bloquear scroll del body */
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Overlay */}
            <button
                type="button"
                aria-label="Cerrar modal"
                className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]"
                tabIndex={-1}
                onClick={onClose}
            />

            {/* Panel */}
            <section
                ref={panelRef}
                className={cn(
                    'relative z-10 flex w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl',
                    'max-h-[90vh]',
                    SIZES[size] || SIZES.md,
                    className,
                )}
            >
                {/* Header */}
                {(title || !hideClose) && (
                    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                        <div className="min-w-0">
                            {title && (
                                <h2
                                    id="modal-title"
                                    className="text-base font-bold text-slate-900"
                                >
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    {description}
                                </p>
                            )}
                        </div>
                        {!hideClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="Cerrar"
                                className="shrink-0 text-slate-400 hover:text-slate-700"
                            >
                                <X size={18} />
                            </Button>
                        )}
                    </header>
                )}

                {/* Body — scrollable */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                        {footer}
                    </footer>
                )}
            </section>
        </div>
    );
};
