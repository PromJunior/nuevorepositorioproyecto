import React, { useCallback, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckSquare, Minus, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    Table,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    TableTh,
    TableSkeletonRows,
} from './Table';
import { EmptyState } from './EmptyState';
import { ErrorCard } from './ErrorCard';

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

const getRowKey = (row, rowKey) =>
    typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? row.id);

const sortRows = (rows, key, dir) => {
    if (!key) return rows;
    return [...rows].sort((a, b) => {
        const av = a[key] ?? '';
        const bv = b[key] ?? '';
        const cmp =
            typeof av === 'number' && typeof bv === 'number'
                ? av - bv
                : String(av).localeCompare(String(bv), 'es-PE', { numeric: true });
        return dir === 'asc' ? cmp : -cmp;
    });
};

/* ─── DataTable ─────────────────────────────────────────────────────────────── */

/**
 * DataTable — tabla de datos configurable y reutilizable para el ERP.
 *
 * @param {Object[]} columns  Configuración de columnas:
 *   { key, label, render?(value, row), sortable?, align?, width?, className?, cellClassName? }
 * @param {Object[]} data     Filas a renderizar (ya paginadas si paginación es externa).
 * @param {string|Function} rowKey  Clave única por fila. Default: 'id'.
 * @param {boolean} isLoading       Muestra skeleton de carga.
 * @param {boolean} isError         Muestra ErrorCard con botón de reintento.
 * @param {boolean} isEmpty         Sobreescribe la detección automática de vacío.
 * @param {Function} onRetry        Callback al pulsar "Reintentar" en error.
 * @param {boolean} selectable      Activa columna de checkboxes + bulk bar.
 * @param {Function} onSelectionChange  cb(selectedRows[]) al cambiar selección.
 * @param {boolean} stickyHeader    Fija el encabezado al hacer scroll vertical.
 * @param {boolean} compact         Filas más compactas (py-2 en celdas).
 * @param {string} emptyTitle
 * @param {string} emptyDescription
 * @param {number} loadingRows      Número de filas skeleton. Default: 6.
 * @param {string} className        Clase extra para la tabla <table>.
 * @param {string} wrapperClassName Clase extra para el contenedor exterior.
 */
export const DataTable = ({
    columns = [],
    data = [],
    rowKey = 'id',
    isLoading = false,
    isError = false,
    isEmpty: isEmptyProp,
    onRetry,
    selectable = false,
    onSelectionChange,
    stickyHeader = false,
    compact = false,
    emptyTitle = 'Sin registros',
    emptyDescription = 'No hay datos para mostrar con los filtros actuales.',
    loadingRows = 6,
    className,
    wrapperClassName,
}) => {
    /* ── Sort state ──────────────────────────────────────────────────────────── */
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const handleSort = useCallback((key) => {
        setSortKey((prevKey) => {
            if (prevKey === key) {
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                return key;
            }
            setSortDir('asc');
            return key;
        });
    }, []);

    const sorted = useMemo(() => sortRows(data, sortKey, sortDir), [data, sortKey, sortDir]);

    /* ── Selection state ─────────────────────────────────────────────────────── */
    const [selectedKeys, setSelectedKeys] = useState(new Set());

    const allKeys = useMemo(
        () => sorted.map((r) => getRowKey(r, rowKey)),
        [sorted, rowKey],
    );
    const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));
    const someSelected = !allSelected && allKeys.some((k) => selectedKeys.has(k));

    const toggleAll = useCallback(() => {
        const nextSelected = allSelected ? new Set() : new Set(allKeys);
        setSelectedKeys(nextSelected);
        onSelectionChange?.(allSelected ? [] : sorted);
    }, [allSelected, allKeys, sorted, onSelectionChange]);

    const toggleRow = useCallback(
        (key) => {
            setSelectedKeys((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                onSelectionChange?.(sorted.filter((r) => next.has(getRowKey(r, rowKey))));
                return next;
            });
        },
        [sorted, rowKey, onSelectionChange],
    );

    const clearSelection = useCallback(() => {
        setSelectedKeys(new Set());
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    /* ── Derivados ───────────────────────────────────────────────────────────── */
    const isEmpty =
        isEmptyProp !== undefined
            ? isEmptyProp
            : !isLoading && !isError && sorted.length === 0;

    const colSpan = columns.length + (selectable ? 1 : 0);
    const hasBulkBar = selectable && selectedKeys.size > 0;

    /* ── Loading ─────────────────────────────────────────────────────────────── */
    if (isLoading) {
        return (
            <Table wrapperClassName={wrapperClassName} className={className}>
                <TableHead>
                    <tr>
                        {selectable && <TableTh className="w-10" />}
                        {columns.map((col) => (
                            <TableTh key={col.key} className={cn(col.width, col.className)}>
                                {col.label}
                            </TableTh>
                        ))}
                    </tr>
                </TableHead>
                <TableBody>
                    <TableSkeletonRows rows={loadingRows} cols={colSpan} />
                </TableBody>
            </Table>
        );
    }

    /* ── Error ───────────────────────────────────────────────────────────────── */
    if (isError) {
        return (
            <ErrorCard
                title="Error al cargar datos"
                description="No se pudo obtener la información del servidor."
                onRetry={onRetry}
            />
        );
    }

    /* ── Empty ───────────────────────────────────────────────────────────────── */
    if (isEmpty) {
        return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }

    /* ── Tabla ───────────────────────────────────────────────────────────────── */
    return (
        <div className={wrapperClassName}>
            {/* Bulk action bar */}
            {hasBulkBar && (
                <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-blue-200 bg-blue-50 px-4 py-2.5">
                    <span className="text-sm font-semibold text-blue-700">
                        {selectedKeys.size} fila{selectedKeys.size !== 1 ? 's' : ''} seleccionada
                        {selectedKeys.size !== 1 ? 's' : ''}
                    </span>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="text-xs font-bold text-blue-600 hover:underline"
                    >
                        Deseleccionar todo
                    </button>
                </div>
            )}

            <Table
                className={className}
                wrapperClassName={hasBulkBar ? 'rounded-t-none' : undefined}
            >
                <TableHead className={stickyHeader ? 'sticky top-0 z-10' : undefined}>
                    <tr>
                        {selectable && (
                            <TableTh className="w-10 px-3">
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    aria-label={allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                    className="flex items-center justify-center"
                                >
                                    {allSelected ? (
                                        <CheckSquare size={15} className="text-blue-600" />
                                    ) : someSelected ? (
                                        <Minus size={15} className="text-blue-400" />
                                    ) : (
                                        <Square size={15} className="text-slate-400" />
                                    )}
                                </button>
                            </TableTh>
                        )}
                        {columns.map((col) => (
                            <TableTh
                                key={col.key}
                                sortable={col.sortable}
                                className={cn(
                                    col.align === 'right' && 'text-right',
                                    col.align === 'center' && 'text-center',
                                    col.width,
                                    col.className,
                                )}
                                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                            >
                                {col.sortable ? (
                                    <span className="inline-flex cursor-pointer select-none items-center gap-1">
                                        {col.label}
                                        {sortKey === col.key ? (
                                            sortDir === 'asc' ? (
                                                <ArrowUp size={12} />
                                            ) : (
                                                <ArrowDown size={12} />
                                            )
                                        ) : (
                                            <ArrowUpDown size={12} className="opacity-30" />
                                        )}
                                    </span>
                                ) : (
                                    col.label
                                )}
                            </TableTh>
                        ))}
                    </tr>
                </TableHead>

                <TableBody>
                    {sorted.map((row) => {
                        const key = getRowKey(row, rowKey);
                        const isSelected = selectedKeys.has(key);
                        return (
                            <TableRow
                                key={key}
                                className={cn(isSelected && 'bg-blue-50/60')}
                            >
                                {selectable && (
                                    <TableCell className="w-10 px-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleRow(key)}
                                            aria-label="Seleccionar fila"
                                            className="flex items-center justify-center"
                                        >
                                            {isSelected ? (
                                                <CheckSquare size={15} className="text-blue-600" />
                                            ) : (
                                                <Square size={15} className="text-slate-400 hover:text-blue-600" />
                                            )}
                                        </button>
                                    </TableCell>
                                )}
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.key}
                                        className={cn(
                                            col.align === 'right' && 'text-right',
                                            col.align === 'center' && 'text-center',
                                            compact && 'py-2',
                                            col.cellClassName,
                                        )}
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : (row[col.key] ?? '—')}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
