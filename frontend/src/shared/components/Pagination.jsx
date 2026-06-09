import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const PageBtn = ({ active, disabled, onClick, children, className, 'aria-label': ariaLabel }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-current={active ? 'page' : undefined}
        className={cn(
            'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors duration-100',
            active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            disabled && 'pointer-events-none opacity-40',
            className,
        )}
    >
        {children}
    </button>
);

/**
 * Pagination
 *
 * Props:
 *   page        number — página actual (1-indexed)
 *   totalPages  number
 *   total       number — total de registros (opcional, para mostrar "X registros")
 *   pageSize    number — registros por página (opcional)
 *   onPageChange fn(page)
 *   className   string
 */
export const Pagination = ({
    page,
    totalPages,
    total,
    pageSize,
    onPageChange,
    className,
}) => {
    if (!totalPages || totalPages <= 1) return null;

    /* Páginas a mostrar (ventana de 5 alrededor de la actual) */
    const WINDOW = 2;
    const pages = [];
    for (let p = Math.max(1, page - WINDOW); p <= Math.min(totalPages, page + WINDOW); p++) {
        pages.push(p);
    }

    const showFirst = pages[0] > 1;
    const showLast  = pages[pages.length - 1] < totalPages;

    /* Rango de registros visibles */
    const from = pageSize ? (page - 1) * pageSize + 1 : null;
    const to   = pageSize ? Math.min(page * pageSize, total ?? page * pageSize) : null;

    return (
        <nav
            role="navigation"
            aria-label="Paginación"
            className={cn('flex flex-wrap items-center justify-between gap-3', className)}
        >
            {/* Info de registros */}
            <p className="text-xs font-medium text-slate-400">
                {total != null && pageSize
                    ? `Mostrando ${from}–${to} de ${total} registros`
                    : `Página ${page} de ${totalPages}`}
            </p>

            {/* Controles */}
            <div className="flex items-center gap-1">
                {/* Primera página */}
                <PageBtn
                    aria-label="Primera página"
                    disabled={page <= 1}
                    onClick={() => onPageChange(1)}
                >
                    <ChevronsLeft size={14} />
                </PageBtn>

                {/* Anterior */}
                <PageBtn
                    aria-label="Página anterior"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeft size={14} />
                </PageBtn>

                {/* Elipsis izquierda */}
                {showFirst && (
                    <>
                        <PageBtn onClick={() => onPageChange(1)}>1</PageBtn>
                        {pages[0] > 2 && (
                            <span className="flex h-8 w-8 items-center justify-center text-xs text-slate-400">
                                …
                            </span>
                        )}
                    </>
                )}

                {/* Páginas ventana */}
                {pages.map((p) => (
                    <PageBtn
                        key={p}
                        active={p === page}
                        onClick={() => onPageChange(p)}
                        aria-label={`Página ${p}`}
                    >
                        {p}
                    </PageBtn>
                ))}

                {/* Elipsis derecha */}
                {showLast && (
                    <>
                        {pages[pages.length - 1] < totalPages - 1 && (
                            <span className="flex h-8 w-8 items-center justify-center text-xs text-slate-400">
                                …
                            </span>
                        )}
                        <PageBtn onClick={() => onPageChange(totalPages)}>
                            {totalPages}
                        </PageBtn>
                    </>
                )}

                {/* Siguiente */}
                <PageBtn
                    aria-label="Página siguiente"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    <ChevronRight size={14} />
                </PageBtn>

                {/* Última página */}
                <PageBtn
                    aria-label="Última página"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(totalPages)}
                >
                    <ChevronsRight size={14} />
                </PageBtn>
            </div>
        </nav>
    );
};
