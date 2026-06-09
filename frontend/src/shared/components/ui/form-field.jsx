import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from './label';
import { cn } from '../../../lib/utils';

/**
 * FormField — combina Label + children (Input/Select/Textarea) + mensaje de error.
 *
 * Uso básico:
 *   <FormField label="Nombre" error={errors.name?.message} required>
 *     <Input {...register('name')} error={!!errors.name} />
 *   </FormField>
 *
 * Props:
 *   label      string         — texto de la etiqueta
 *   htmlFor    string         — id del input asociado
 *   error      string | null  — mensaje de error (vacío = sin error)
 *   hint       string         — texto de ayuda debajo del campo
 *   required   boolean        — muestra asterisco rojo
 *   className  string
 *   children   ReactNode      — el campo de entrada (Input, Select, Textarea…)
 */
export const FormField = ({
    label,
    htmlFor,
    error,
    hint,
    required,
    className,
    children,
}) => (
    <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
            <Label htmlFor={htmlFor} required={required} error={!!error}>
                {label}
            </Label>
        )}

        {children}

        {error && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                <AlertCircle size={12} className="shrink-0" />
                {error}
            </p>
        )}

        {!error && hint && (
            <p className="text-xs font-medium text-slate-400">{hint}</p>
        )}
    </div>
);

/**
 * FormRow — fila de dos columnas para formularios.
 *
 * Uso:
 *   <FormRow>
 *     <FormField label="Nombre" ...>...</FormField>
 *     <FormField label="Apellido" ...>...</FormField>
 *   </FormRow>
 */
export const FormRow = ({ children, className }) => (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
        {children}
    </div>
);

/**
 * FormSection — agrupa campos con un título.
 */
export const FormSection = ({ title, description, children, className }) => (
    <fieldset className={cn('space-y-4', className)}>
        {(title || description) && (
            <div className="border-b border-slate-100 pb-3">
                {title && (
                    <legend className="text-sm font-bold text-slate-800">{title}</legend>
                )}
                {description && (
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{description}</p>
                )}
            </div>
        )}
        {children}
    </fieldset>
);
