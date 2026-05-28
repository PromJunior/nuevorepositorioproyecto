import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Modal } from './Modal';

export const ConfirmDialog = ({ isOpen, title = 'Confirmar accion', description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', isLoading = false, onConfirm, onClose }) => (
    <Modal
        isOpen={isOpen}
        title={title}
        description={description}
        onClose={onClose}
        footer={(
            <>
                <Button variant="secondary" onClick={onClose} disabled={isLoading}>{cancelLabel}</Button>
                <Button variant="danger" onClick={onConfirm} disabled={isLoading}>{isLoading ? 'Procesando...' : confirmLabel}</Button>
            </>
        )}
    >
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-semibold">Esta accion requiere confirmacion antes de continuar.</p>
        </div>
    </Modal>
);
