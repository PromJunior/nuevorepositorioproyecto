import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, LogIn, User } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { FormField } from '../../../shared/components/ui/form-field';
import { loginSchema } from '../schemas/loginSchema';
import { AUTH_ERROR_MESSAGES } from '../validations/authValidation';

export const LoginForm = ({ onSubmit, isLoading = false, error = null }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    const backendMessage = error?.response?.data?.detail;
    const errorMessage = backendMessage || (error ? AUTH_ERROR_MESSAGES.invalidCredentials : null);

    return (
        <Card className="w-full max-w-md p-6 sm:p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Iniciar sesión</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">Accede con tus credenciales empresariales.</p>
            </div>

            {errorMessage && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700" role="alert">
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <FormField
                    label="Usuario"
                    htmlFor="username"
                    error={errors.username?.message}
                >
                    <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-2.5 text-slate-400" size={16} />
                        <Input
                            id="username"
                            className="pl-10"
                            placeholder="Nombre de usuario"
                            autoComplete="username"
                            error={!!errors.username}
                            {...register('username')}
                        />
                    </div>
                </FormField>

                <FormField
                    label="Contraseña"
                    htmlFor="password"
                    error={errors.password?.message}
                >
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-2.5 text-slate-400" size={16} />
                        <Input
                            id="password"
                            type="password"
                            className="pl-10"
                            placeholder="Contraseña"
                            autoComplete="current-password"
                            error={!!errors.password}
                            {...register('password')}
                        />
                    </div>
                </FormField>

                <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                    {!isLoading && <LogIn size={16} />}
                    {isLoading ? 'Autenticando...' : 'Ingresar'}
                </Button>
            </form>
        </Card>
    );
};
