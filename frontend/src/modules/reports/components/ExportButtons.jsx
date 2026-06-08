import React from 'react';
import { ExportButtons as SharedExportButtons } from '../../../shared/components/ExportButtons';
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

    const runExport = (format) =>
        new Promise((resolve, reject) => {
            exportMutation.mutate(
                { type: reportType, format, filters },
                { onSuccess: resolve, onError: reject },
            );
        });

    return (
        <SharedExportButtons
            module={reportType}
            title={reportType}
            columns={[{ key: 'server', label: 'Servidor' }]}
            disabled={disabled || isLoading}
            onExportCsv={() => runExport('csv')}
            onExportExcel={() => runExport('excel')}
            onExportPdf={() => runExport('pdf')}
            emitEvent={false}
        />
    );
};
