import React from 'react';
import { Outlet } from 'react-router-dom';
import { env } from '../../config/env';

export const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
                <aside className="hidden border-r border-slate-200 bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black">E</div>
                        <h1 className="mt-8 text-4xl font-black tracking-tight">{env.appName}</h1>
                        <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-slate-400">
                            Plataforma empresarial preparada para operar multiples empresas, roles y dominios de negocio.
                        </p>
                    </div>

                    <div className="border-t border-white/10 pt-6 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Secure business workspace
                    </div>
                </aside>

                <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
