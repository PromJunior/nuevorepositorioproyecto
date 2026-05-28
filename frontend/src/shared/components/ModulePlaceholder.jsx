import React from 'react';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';

export const ModulePlaceholder = ({ title, description }) => (
    <div className="space-y-6 p-6">
        <PageHeader title={title} description={description} eyebrow="Modulo preparado" />
        <EmptyState
            title="Modulo pendiente de implementacion"
            description="La ruta, permisos y shell visual ya estan listos. La logica funcional se implementara en una fase posterior."
        />
    </div>
);
