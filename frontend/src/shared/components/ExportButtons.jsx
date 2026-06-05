import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, Table } from 'lucide-react';
import apiClient from '../../services/api/client';
import { Button } from './ui/button';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const today = () => new Date().toISOString().slice(0, 10);

const getValue = (row, column) => {
    const raw = typeof column.value === 'function' ? column.value(row) : row?.[column.key];
    return raw == null ? '' : raw;
};

const normalizeRows = (data = [], columns = []) =>
    data.map((row) =>
        Object.fromEntries(columns.map((column) => [column.label, getValue(row, column)]))
    );

const filenameFor = (filename, module, format) => {
    if (filename) return filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;
    return `${module || 'export'}_${today()}.${format}`;
};

const downloadText = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

const csvEscape = (value) => {
    const text = String(value ?? '');
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
};

const emitExportEvent = async ({ module, format, filename, filters }) => {
    try {
        await apiClient.post('/reports/export/event', { module, format, filename, filters });
    } catch (error) {
        console.warn('report.generated no se pudo registrar', error);
    }
};

const getCompanyInfo = async () => {
    try {
        const response = await apiClient.get('/settings/runtime');
        return response.data?.company || null;
    } catch {
        return null;
    }
};

export const ExportButtons = ({
    data = [],
    columns = [],
    filters = {},
    filename = '',
    module = 'export',
    title = 'Exportacion',
    totals = null,
    disabled = false,
    onExportCsv,
    onExportExcel,
    onExportPdf,
    emitEvent = true,
}) => {
    const [loadingFormat, setLoadingFormat] = useState(null);
    const isDisabled = disabled || loadingFormat || columns.length === 0;

    const runExport = async (format) => {
        const finalFilename = filenameFor(filename || module, module, format);
        setLoadingFormat(format);
        try {
            if (format === 'csv' && onExportCsv) {
                await onExportCsv();
            } else if (format === 'excel' && onExportExcel) {
                await onExportExcel();
            } else if (format === 'pdf' && onExportPdf) {
                await onExportPdf();
            } else if (format === 'csv') {
                const rows = normalizeRows(data, columns);
                const csv = [
                    columns.map((column) => csvEscape(column.label)).join(','),
                    ...rows.map((row) => columns.map((column) => csvEscape(row[column.label])).join(',')),
                ].join('\n');
                downloadText(csv, finalFilename, 'text/csv;charset=utf-8');
            } else if (format === 'excel') {
                const XLSX = await import('xlsx');
                const rows = normalizeRows(data, columns);
                if (totals) rows.push(totals);
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31) || 'Reporte');
                const excelFilename = finalFilename.endsWith(".xlsx")? finalFilename : `${finalFilename.replace('.excel', '')}.xlsx`;
                XLSX.writeFile(wb, excelFilename);
            } else {
                const { jsPDF } = await import('jspdf');
                await import('jspdf-autotable');
                const company = await getCompanyInfo();
                const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });
                doc.setFontSize(14);
                let y = 15;
                if (company?.legal_name || company?.trade_name) {
                    doc.text(company.legal_name || company.trade_name, 14, y);
                    y += 6;
                    if (company.ruc) {
                        doc.setFontSize(8);
                        doc.text(`RUC: ${company.ruc}`, 14, y);
                        y += 5;
                    }
                    doc.setFontSize(14);
                }
                doc.text(title, 14, y);
                doc.setFontSize(8);
                doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, y + 6);
                const activeFilters = Object.entries(filters).filter(([, value]) => value !== '' && value != null);
                if (activeFilters.length > 0) {
                    doc.text(`Filtros: ${activeFilters.map(([key, value]) => `${key}: ${value}`).join(' | ')}`, 14, y + 12);
                }
                const body = data.map((row) => columns.map((column) => getValue(row, column)));
                if (totals) body.push(columns.map((column) => totals[column.label] ?? totals[column.key] ?? ''));
                autoTable(doc,{
                    head: [columns.map((column) => column.label)],
                    body,
                    startY: activeFilters.length > 0 ? y + 17 : y + 11,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [30, 58, 95] },
                });
                doc.save(finalFilename);
            }
            if (emitEvent) {
                await emitExportEvent({ module, format, filename: finalFilename, filters });
            }
        } finally {
            setLoadingFormat(null);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="gap-1.5 text-xs text-blue-700" onClick={() => runExport('csv')} disabled={isDisabled} title="Descargar CSV">
                {loadingFormat === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <Table size={14} />} CSV
            </Button>
            <Button variant="secondary" className="gap-1.5 text-xs text-emerald-700" onClick={() => runExport('excel')} disabled={isDisabled} title="Descargar Excel">
                {loadingFormat === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
            </Button>
            <Button variant="secondary" className="gap-1.5 text-xs text-rose-600" onClick={() => runExport('pdf')} disabled={isDisabled} title="Descargar PDF">
                {loadingFormat === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
            </Button>
        </div>
    );
};
