import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Loader } from './Loader';

export const DataState = ({
    isLoading = false,
    isError = false,
    isEmpty = false,
    loadingLabel = 'Cargando datos...',
    errorTitle = 'No se pudo cargar la informacion',
    errorDescription = 'Intenta nuevamente en unos segundos.',
    emptyTitle = 'Sin datos',
    emptyDescription = 'No hay informacion para mostrar.',
    children,
}) => {
    if (isLoading) return <Loader label={loadingLabel} className="min-h-64" />;

    if (isError) {
        return (
            <EmptyState
                icon={AlertTriangle}
                title={errorTitle}
                description={errorDescription}
                className="border-red-200 text-red-600"
            />
        );
    }

    if (isEmpty) {
        return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }

    return children;
};
