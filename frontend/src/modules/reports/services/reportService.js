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

const exportCashExcel = async (filters = {}) => {
    const response = await apiClient.get('/reports/cash/export/excel', {
        params: clean(filters),
        responseType: 'blob',
    });
    downloadBlob(response.data, `caja_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    exportSalesExcel,
    exportSalesPdf,
    getPurchasesReport,
    exportPurchasesExcel,
    exportPurchasesPdf,
    getKardexReport,
    exportKardexExcel,
    exportKardexPdf,
    getCashReport,
    exportCashExcel,
    exportCashPdf,
    getAuditLogs,
};
