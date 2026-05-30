import { useMutation, useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';

const FIVE_MIN = 1000 * 60 * 5;

const reportKeys = {
    sales:     (f) => ['reports', 'sales', f],
    purchases: (f) => ['reports', 'purchases', f],
    kardex:    (f) => ['reports', 'kardex', f],
    cash:      (f) => ['reports', 'cash', f],
    crm:       (f) => ['reports', 'crm', f],
    audit:     (f) => ['reports', 'audit', f],
};

// ─── Datos de reportes (useQuery) ─────────────────────────────────────────────
export const useSalesReport = (filters = {}) =>
    useQuery({
        queryKey: reportKeys.sales(filters),
        queryFn: () => reportService.getSalesReport(filters),
        staleTime: FIVE_MIN,
        enabled: true,
    });

export const usePurchasesReport = (filters = {}) =>
    useQuery({
        queryKey: reportKeys.purchases(filters),
        queryFn: () => reportService.getPurchasesReport(filters),
        staleTime: FIVE_MIN,
    });

export const useKardexReport = (filters = {}) =>
    useQuery({
        queryKey: reportKeys.kardex(filters),
        queryFn: () => reportService.getKardexReport(filters),
        staleTime: FIVE_MIN,
    });

export const useCashReport = (filters = {}) =>
    useQuery({
        queryKey: reportKeys.cash(filters),
        queryFn: () => reportService.getCashReport(filters),
        staleTime: FIVE_MIN,
    });

export const useCrmReport = (filters = {}) =>
    useQuery({
        queryKey: reportKeys.crm(filters),
        queryFn: () => reportService.getCrmReport(filters),
        staleTime: FIVE_MIN,
    });

export const useAuditLogs = (filters = {}) =>
    useQuery({
        queryKey: reportKeys.audit(filters),
        queryFn: () => reportService.getAuditLogs(filters),
        staleTime: FIVE_MIN,
    });

// ─── Exportaciones (useMutation — disparan descargas) ─────────────────────────
export const useExportReport = () =>
    useMutation({
        mutationFn: ({ type, format, filters }) => {
            const map = {
                'sales-excel':     () => reportService.exportSalesExcel(filters),
                'sales-pdf':       () => reportService.exportSalesPdf(filters),
                'purchases-excel': () => reportService.exportPurchasesExcel(filters),
                'purchases-pdf':   () => reportService.exportPurchasesPdf(filters),
                'kardex-excel':    () => reportService.exportKardexExcel(filters),
                'kardex-pdf':      () => reportService.exportKardexPdf(filters),
                'cash-excel':      () => reportService.exportCashExcel(filters),
                'cash-pdf':        () => reportService.exportCashPdf(filters),
                'crm-excel':       () => reportService.exportCrmExcel(filters),
                'crm-pdf':         () => reportService.exportCrmPdf(filters),
                'crm-csv':         () => reportService.exportCrmCsv(filters),
            };
            const key = `${type}-${format}`;
            if (!map[key]) throw new Error(`Export no soportado: ${key}`);
            return map[key]();
        },
    });
