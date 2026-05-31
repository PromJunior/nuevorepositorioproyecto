import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';

/**
 * Campos reutilizables del formulario de usuario.
 *
 * Props:
 *  - form: { username, fullname, role, password, confirmPassword }
 *  - onChange(key, value)
 *  - isEdit: boolean — si true, username es readonly, password es opcional
 *  - roles: [{ id, name }]
 *  - showPassword: boolean
 *  - onTogglePassword()
 */
export const UserForm = ({
    form,
    onChange,
    isEdit = false,
    roles = [],
    showPassword = false,
    onTogglePassword,
}) => (
    <div className="space-y-3">
        {/* Username */}
        <div className="space-y-1">
            <Label>
                Username{' '}
                {!isEdit && <span className="text-red-500">*</span>}
            </Label>
            <Input
                value={form.username}
                readOnly={isEdit}
                className={isEdit ? 'bg-slate-50 cursor-not-allowed' : ''}
                placeholder="ej: jperez"
                onChange={(e) => onChange('username', e.target.value.toLowerCase().trim())}
                required={!isEdit}
            />
        </div>

        {/* Nombre completo */}
        <div className="space-y-1">
            <Label>
                Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
                value={form.fullname}
                placeholder="ej: Juan Pérez García"
                onChange={(e) => onChange('fullname', e.target.value)}
                required
            />
        </div>

        {/* Rol */}
        <div className="space-y-1">
            <Label>
                Rol <span className="text-red-500">*</span>
            </Label>
            <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                value={form.role}
                onChange={(e) => onChange('role', e.target.value)}
                required
            >
                <option value="">Seleccionar rol...</option>
                {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                        {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                    </option>
                ))}
            </select>
        </div>

        {/* Contraseña */}
        <div className="space-y-1">
            <Label>
                {isEdit ? 'Nueva contraseña' : 'Contraseña'}
                {!isEdit && <span className="text-red-500"> *</span>}
                {isEdit && (
                    <span className="ml-1 font-normal normal-case text-slate-400">
                        (dejar vacío para no cambiar)
                    </span>
                )}
            </Label>
            <div className="relative">
                <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    placeholder={isEdit ? 'Nueva contraseña...' : 'Contraseña segura'}
                    onChange={(e) => onChange('password', e.target.value)}
                    required={!isEdit}
                    className="pr-10"
                />
                {onTogglePassword && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
        </div>

        {/* Confirmar contraseña */}
        {(form.password || !isEdit) && (
            <div className="space-y-1">
                <Label>
                    Confirmar contraseña {!isEdit && <span className="text-red-500">*</span>}
                </Label>
                <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    placeholder="Repite la contraseña"
                    onChange={(e) => onChange('confirmPassword', e.target.value)}
                    required={!isEdit || Boolean(form.password)}
                    className={
                        form.confirmPassword && form.password !== form.confirmPassword
                            ? 'border-red-400 ring-2 ring-red-100'
                            : ''
                    }
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs font-semibold text-red-500">Las contraseñas no coinciden</p>
                )}
            </div>
        )}
    </div>
);
