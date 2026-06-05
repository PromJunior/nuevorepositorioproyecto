/**
 * Report Service – nivel módulo.
 * Usa apiClient (Axios + JWT). NO usa fetch.
 *
 * Para descargas (Excel/PDF) usa responseType: 'blob' y
 * dispara la descarga automáticamente en el navegador.
 */
import apiClient from '../../../services/api/client';

// ─── Helper: descargar blob como archivo ─────────────────────────────────────
const downloadBlob = (data, filename) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

// ─── Helper: limpiar params vacíos ───────────────────────────────────────────
const clean = (params) =>
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

// ─── Ventas ───────────────────────────────────────────────────────────────────
const getSalesReport = async (filters = {}) => {
    const response = await apiClient.get('/reports/sales', { params: clean(filters) });
    return response.data;
};

const exportSalesExcel = async (filters = {}) => {
    const response = await apiClient.get('/reports/sales/export/excel', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const exportSalesCsv = async (filters = {}) => {
    const response = await apiClient.get('/reports/sales/export/csv', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `ventas_${new Date().toISOString().slice(0, 10)}.csv`);
};

const exportSalesPdf = async (filters = {}) => {
    const response = await apiClient.get('/reports/sales/export/pdf', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─── Compras ─────────────────────────────────────────────────────────────────
const getPurchasesReport = async (filters = {}) => {
    const response = await apiClient.get('/reports/purchases', { params: clean(filters) });
    return response.data;
};

const exportPurchasesExcel = async (filters = {}) => {
    const response = await apiClient.get('/reports/purchases/export/excel', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `compras_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const exportPurchasesCsv = async (filters = {}) => {
    const response = await apiClient.get('/reports/purchases/export/csv', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `compras_${new Date().toISOString().slice(0, 10)}.csv`);
};

const exportPurchasesPdf = async (filters = {}) => {
    const response = await apiClient.get('/reports/purchases/export/pdf', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `compras_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─── Kardex ──────────────────────────────────────────────────────────────────
const getKardexReport = async (filters = {}) => {
    const response = await apiClient.get('/reports/kardex', { params: clean(filters) });
    return response.data;
};

const exportKardexExcel = async (filters = {}) => {
    const response = await apiClient.get('/reports/kardex/export/excel', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `kardex_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const exportKardexCsv = async (filters = {}) => {
    const response = await apiClient.get('/reports/kardex/export/csv', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `kardex_${new Date().toISOString().slice(0, 10)}.csv`);
};

const exportKardexPdf = async (filters = {}) => {
    const response = await apiClient.get('/reports/kardex/export/pdf', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `kardex_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─── Caja ─────────────────────────────────────────────────────────────────────
const getCashReport = async (filters = {}) => {
    const response = await apiClient.get('/reports/cash', { params: clean(filters) });
    return response.data;
};

const getCrmReport = async (filters = {}) => {
    const response = await apiClient.get('/reports/crm', { params: clean(filters) });
    return response.data;
};

const exportCrmExcel = async (filters = {}) => {
    const response = await apiClient.get('/reports/crm/export/excel', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `crm_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const exportCrmPdf = async (filters = {}) => {
    const response = await apiClient.get('/reports/crm/export/pdf', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `crm_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const exportCrmCsv = async (filters = {}) => {
    const response = await apiClient.get('/reports/crm/export/csv', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `crm_${new Date().toISOString().slice(0, 10)}.csv`);
};

const exportCashExcel = async (filters = {}) => {
    const response = await apiClient.get('/reports/cash/export/excel', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `caja_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const exportCashCsv = async (filters = {}) => {
    const response = await apiClient.get('/reports/cash/export/csv', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `caja_${new Date().toISOString().slice(0, 10)}.csv`);
};

const exportCashPdf = async (filters = {}) => {
    const response = await apiClient.get('/reports/cash/export/pdf', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `caja_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─── Auditoría (admin) ────────────────────────────────────────────────────────
const getAuditLogs = async (filters = {}) => {
    const response = await apiClient.get('/audit/logs', { params: clean(filters) });
    return response.data;
};

export const reportService = {
    getSalesReport,
    exportSalesCsv,
    exportSalesExcel,
    exportSalesPdf,
    getPurchasesReport,
    exportPurchasesCsv,
    exportPurchasesExcel,
    exportPurchasesPdf,
    getKardexReport,
    exportKardexCsv,
    exportKardexExcel,
    exportKardexPdf,
    getCashReport,
    exportCashCsv,
    exportCashExcel,
    exportCashPdf,
    getCrmReport,
    exportCrmExcel,
    exportCrmPdf,
    exportCrmCsv,
    getAuditLogs,
};
