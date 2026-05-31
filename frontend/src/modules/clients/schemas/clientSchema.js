export const emptyClientForm = {
    dni: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
};

export const toClientPayload = (form, isEdit = false) => {
    const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
    };

    if (!isEdit) {
        payload.dni = form.dni.trim();
    }

    return payload;
};

export const validateClientForm = (form, isEdit = false) => {
    if (!isEdit && !/^\d{8}$/.test(form.dni)) {
        return 'El DNI debe tener 8 digitos.';
    }

    if (!form.full_name.trim()) {
        return 'El nombre del cliente es obligatorio.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        return 'Ingresa un email valido.';
    }

    return null;
};
