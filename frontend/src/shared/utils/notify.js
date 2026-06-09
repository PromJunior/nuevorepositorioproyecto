/**
 * notify — utilidad centralizada de notificaciones.
 *
 * Wrapper ligero sobre SweetAlert2 toast con estilos
 * consistentes del Design System ERP.
 *
 * Uso:
 *   import { notify, confirmDialog } from '../../../shared/utils/notify';
 *
 *   notify.success('Guardado correctamente');
 *   notify.error('No se pudo guardar', error.response?.data?.detail);
 *   notify.warning('Stock insuficiente', 'El producto no tiene unidades.');
 *   notify.info('Procesando exportación...');
 *
 *   const ok = await confirmDialog({ title: '¿Eliminar?', text: 'No se puede deshacer.' });
 *   if (ok) doDelete();
 */

import Swal from 'sweetalert2';

/* ─── Base toast ────────────────────────────────────────────────────────────── */
const base = (overrides = {}) =>
    Swal.fire({
        toast:              true,
        position:           'top-end',
        showConfirmButton:  false,
        timer:              3500,
        timerProgressBar:   true,
        customClass: {
            popup:          '!rounded-xl !shadow-lg !border !border-slate-200 !py-3',
            title:          '!text-sm !font-bold !text-slate-900',
            htmlContainer:  '!text-xs !font-medium !text-slate-500',
            timerProgressBar: '!bg-blue-500',
        },
        ...overrides,
    });

/* ─── Variantes ─────────────────────────────────────────────────────────────── */
export const notify = {
    success: (title, text) =>
        base({ icon: 'success', title, text,
            customClass: { timerProgressBar: '!bg-emerald-500' } }),

    error: (title, text) =>
        base({ icon: 'error',   title, text, timer: 6000,
            customClass: { timerProgressBar: '!bg-red-500' } }),

    warning: (title, text) =>
        base({ icon: 'warning', title, text,
            customClass: { timerProgressBar: '!bg-amber-500' } }),

    info: (title, text) =>
        base({ icon: 'info',    title, text,
            customClass: { timerProgressBar: '!bg-blue-500' } }),
};

/* ─── Diálogo de confirmación ───────────────────────────────────────────────── */
/**
 * @param {object} opts
 * @param {string}  opts.title
 * @param {string}  [opts.text]
 * @param {string}  [opts.html]
 * @param {'question'|'warning'|'error'} [opts.icon]
 * @param {string}  [opts.confirmText]
 * @param {string}  [opts.cancelText]
 * @param {string}  [opts.confirmColor]    hex color
 * @returns {Promise<boolean>}
 */
export const confirmDialog = async ({
    title,
    text,
    html,
    icon         = 'question',
    confirmText  = 'Confirmar',
    cancelText   = 'Cancelar',
    confirmColor = '#2563eb',
} = {}) => {
    const result = await Swal.fire({
        title,
        text,
        html,
        icon,
        showCancelButton:   true,
        confirmButtonText:  confirmText,
        cancelButtonText:   cancelText,
        confirmButtonColor: confirmColor,
        customClass: {
            popup:         '!rounded-2xl',
            confirmButton: '!rounded-lg !text-sm !font-semibold',
            cancelButton:  '!rounded-lg !text-sm !font-semibold',
        },
    });
    return result.isConfirmed;
};

/* ─── Helpers rápidos de acción ─────────────────────────────────────────────── */
export const confirmDelete = (entityName = 'este elemento') =>
    confirmDialog({
        title:        `¿Eliminar ${entityName}?`,
        text:         'Esta acción no se puede deshacer.',
        icon:         'warning',
        confirmText:  'Sí, eliminar',
        cancelText:   'Cancelar',
        confirmColor: '#dc2626',
    });

export const confirmSave = (title = '¿Guardar cambios?', text) =>
    confirmDialog({ title, text, icon: 'question', confirmText: 'Guardar', confirmColor: '#2563eb' });
