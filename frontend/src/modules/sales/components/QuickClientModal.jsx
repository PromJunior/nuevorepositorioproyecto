import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';

export const QuickClientModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialDni = '',
    initialFullName = '',
    isLoading = false,
}) => {
    const [dni, setDni] = useState(initialDni);
    const [fullName, setFullName] = useState(initialFullName);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
            newErrors.dni = 'DNI debe tener 8 dígitos numéricos';
        }
        if (!fullName || fullName.trim().length === 0) {
            newErrors.fullName = 'El nombre completo es obligatorio';
        }
        if (!email) {
            newErrors.email = 'El correo electrónico es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'El formato de correo no es válido';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit({
            dni,
            full_name: fullName,
            email,
            phone: phone || null,
            address: address || null,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Registrar Cliente Rápido"
            description="Completa la información básica para registrar al cliente en el sistema."
            onClose={onClose}
            footer={
                <div className="flex gap-2 justify-end w-full">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button variant="default" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Registrando...' : 'Registrar Cliente'}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                    <Label htmlFor="quick-dni">DNI</Label>
                    <Input
                        id="quick-dni"
                        type="text"
                        maxLength={8}
                        value={dni}
                        onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="DNI del cliente"
                        className={errors.dni ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {errors.dni && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.dni}</span>}
                </div>
                <div>
                    <Label htmlFor="quick-fullname">Nombre Completo</Label>
                    <Input
                        id="quick-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nombre completo"
                        className={errors.fullName ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {errors.fullName && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.fullName}</span>}
                </div>
                <div>
                    <Label htmlFor="quick-email">Correo Electrónico</Label>
                    <Input
                        id="quick-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {errors.email && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.email}</span>}
                </div>
                <div>
                    <Label htmlFor="quick-phone">Teléfono (Opcional)</Label>
                    <Input
                        id="quick-phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 987654321"
                    />
                </div>
                <div>
                    <Label htmlFor="quick-address">Dirección (Opcional)</Label>
                    <Input
                        id="quick-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Dirección del cliente"
                    />
                </div>
            </form>
        </Modal>
    );
};
