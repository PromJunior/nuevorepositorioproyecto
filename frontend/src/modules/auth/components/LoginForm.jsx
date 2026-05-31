import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Lock, LogIn, User } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
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
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Iniciar sesion</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">Accede con tus credenciales empresariales.</p>
            </div>

            {errorMessage && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                    <Label htmlFor="username">Usuario</Label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <Input id="username" className="pl-11" placeholder="Nombre de usuario" {...register('username')} />
                    </div>
                    {errors.username && <p className="text-xs font-semibold text-red-500">{errors.username.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Contrasena</Label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <Input id="password" type="password" className="pl-11" placeholder="Contrasena" {...register('password')} />
                    </div>
                    {errors.password && <p className="text-xs font-semibold text-red-500">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    <LogIn size={18} />
                    {isLoading ? 'Autenticando...' : 'Ingresar'}
                </Button>
            </form>
        </Card>
    );
};
