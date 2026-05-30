import React from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { useExportReport } from '../hooks/useReports';

/**
 * Botones de exportación Excel y PDF.
 *
 * Props:
 *  - reportType: 'sales' | 'purchases' | 'kardex' | 'cash'
 *  - filters: objeto de filtros actuales
 *  - disabled?: boolean
 */
export const ExportButtons = ({ reportType, filters = {}, disabled = false }) => {
    const exportMutation = useExportReport();
    const isLoading = exportMutation.isPending;

    const handleExport = (format) => {
        exportMutation.mutate({ type: reportType, format, filters });
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="secondary"
                className="text-xs gap-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                onClick={() => handleExport('excel')}
                disabled={disabled || isLoading}
                title="Descargar Excel"
            >
                {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <FileSpreadsheet size={14} />
                )}
                Excel
            </Button>
            <Button
                variant="secondary"
                className="text-xs gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => handleExport('pdf')}
                disabled={disabled || isLoading}
                title="Descargar PDF"
            >
                {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <FileText size={14} />
                )}
                PDF
            </Button>
            {reportType === 'crm' && (
                <Button
                    variant="secondary"
                    className="text-xs gap-1.5 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={() => handleExport('csv')}
                    disabled={disabled || isLoading}
                    title="Descargar CSV"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                    CSV
                </Button>
            )}
        </div>
    );
};
