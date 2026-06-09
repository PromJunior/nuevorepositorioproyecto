import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Plus, Search, Shield } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { SkeletonTable } from '../../../shared/components/Loader';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Select } from '../../../shared/components/ui/select';
import { FormField } from '../../../shared/components/ui/form-field';
import { Modal } from '../../../shared/components/Modal';
import { Pagination } from '../../../shared/components/Pagination';
import { ExportButtons } from '../../../shared/components/ExportButtons';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import {
    useUsers, useRoles,
    useCreateUser, useUpdateUser,
    useDeactivateUser, useActivateUser,
    useCreateRole,
} from '../hooks/useUsers';
import { UserTable } from '../components/UserTable';
import { UserForm } from '../components/UserForm';

const MySwal = withReactContent(Swal);
const PAGE_SIZE = 20;
const USER_COLUMNS = [
    { key: 'username', label: 'Usuario' },
    { key: 'fullname', label: 'Nombre' },
    { key: 'role', label: 'Rol' },
    { key: 'is_active', label: 'Estado', value: (user) => user.is_active ? 'Activo' : 'Inactivo' },
];

const EMPTY_FORM = { username: '', fullname: '', role: '', password: '', confirmPassword: '' };

const UsersPage = () => {
    const authUser = useAuthStore((s) => s.user);

    // ─── Queries ──────────────────────────────────────────────────────────────
    const usersQuery = useUsers();
    const rolesQuery = useRoles();

    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deactivateMutation = useDeactivateUser();
    const activateMutation = useActivateUser();
    const createRoleMutation = useCreateRole();

    // ─── UI state ─────────────────────────────────────────────────────────────
    const [query, setQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [showPassword, setShowPassword] = useState(false);

    // Modal usuario
    const [userModal, setUserModal] = useState(null); // null | 'create' | 'edit'
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    // Modal rol
    const [roleModal, setRoleModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
    const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

    // ─── Filtrado local ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return users.filter((u) => {
            const matchText =
                !q ||
                u.username.toLowerCase().includes(q) ||
                u.fullname.toLowerCase().includes(q);
            const matchRole = !filterRole || u.role === filterRole;
            const matchStatus =
                !filterStatus ||
                (filterStatus === 'active' ? u.is_active : !u.is_active);
            return matchText && matchRole && matchStatus;
        });
    }, [users, query, filterRole, filterStatus]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    // ─── Handlers de formulario ───────────────────────────────────────────────
    const handleFormChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setShowPassword(false);
        setEditingUser(null);
        setUserModal('create');
    };

    const openEdit = (u) => {
        setEditingUser(u);
        setForm({ username: u.username, fullname: u.fullname, role: u.role || '', password: '', confirmPassword: '' });
        setShowPassword(false);
        setUserModal('edit');
    };

    const closeUserModal = () => { setUserModal(null); setEditingUser(null); };

    // ─── Crear / Editar usuario ───────────────────────────────────────────────
    const handleUserSubmit = async (e) => {
        e.preventDefault();

        if (form.password && form.password !== form.confirmPassword) {
            return MySwal.fire({ icon: 'warning', title: 'Las contraseñas no coinciden', customClass: { popup: '!rounded-2xl' } });
        }
        if (!form.role) {
            return MySwal.fire({ icon: 'warning', title: 'Selecciona un rol', customClass: { popup: '!rounded-2xl' } });
        }

        try {
            if (userModal === 'create') {
                await createUserMutation.mutateAsync({
                    username: form.username,
                    fullname: form.fullname,
                    role: form.role,
                    password: form.password,
                });
                MySwal.fire({ icon: 'success', title: 'Usuario creado', timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
            } else {
                const payload = { fullname: form.fullname, role: form.role };
                if (form.password) payload.password = form.password;
                await updateUserMutation.mutateAsync({ id: editingUser.id, data: payload });
                MySwal.fire({ icon: 'success', title: 'Usuario actualizado', timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
            }
            closeUserModal();
        } catch (err) {
            MySwal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || err.message, customClass: { popup: '!rounded-2xl' } });
        }
    };

    // ─── Activar / Desactivar usuario ─────────────────────────────────────────
    const handleToggleStatus = async (u) => {
        const action = u.is_active ? 'desactivar' : 'activar';
        const confirm = await MySwal.fire({
            icon: 'question',
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} a @${u.username}?`,
            text: u.is_active
                ? 'El usuario no podrá iniciar sesión mientras esté inactivo.'
                : 'El usuario podrá iniciar sesión nuevamente.',
            showCancelButton: true,
            confirmButtonText: `Sí, ${action}`,
            confirmButtonColor: u.is_active ? '#dc2626' : '#16a34a',
            cancelButtonText: 'Cancelar',
            customClass: { popup: '!rounded-2xl' },
        });
        if (!confirm.isConfirmed) return;

        try {
            if (u.is_active) {
                await deactivateMutation.mutateAsync(u.id);
            } else {
                await activateMutation.mutateAsync(u.id);
            }
            MySwal.fire({
                icon: 'success',
                title: `Usuario ${u.is_active ? 'desactivado' : 'activado'}`,
                timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' },
            });
        } catch (err) {
            MySwal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || err.message, customClass: { popup: '!rounded-2xl' } });
        }
    };

    // ─── Crear rol ────────────────────────────────────────────────────────────
    const handleCreateRole = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        try {
            await createRoleMutation.mutateAsync(newRoleName.trim().toLowerCase());
            MySwal.fire({ icon: 'success', title: `Rol "${newRoleName}" creado`, timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
            setNewRoleName('');
            setRoleModal(false);
        } catch (err) {
            MySwal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || err.message, customClass: { popup: '!rounded-2xl' } });
        }
    };

    const isBusy = createUserMutation.isPending || updateUserMutation.isPending ||
                   deactivateMutation.isPending || activateMutation.isPending;

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Administración"
                title="Usuarios y roles"
                description="Gestión completa de usuarios, roles y accesos del ERP."
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setRoleModal(true)}>
                            <Shield size={14} /> Nuevo rol
                        </Button>
                        <Button onClick={openCreate}>
                            <Plus size={14} /> Nuevo usuario
                        </Button>
                    </div>
                }
            />

            {/* Stats rápidas */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                    { label: 'Total usuarios', value: users.length },
                    { label: 'Activos', value: users.filter((u) => u.is_active).length },
                    { label: 'Inactivos', value: users.filter((u) => !u.is_active).length },
                    { label: 'Roles disponibles', value: roles.length },
                ].map((s) => (
                    <Card key={s.label} className="p-4 text-center">
                        <p className="text-2xl font-black text-slate-900">{s.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
                    </Card>
                ))}
            </div>

            {/* Filtros */}
            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                    <Input
                        className="pl-9"
                        placeholder="Buscar por username o nombre..."
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        aria-label="Buscar usuario"
                    />
                </div>
                <Select
                    value={filterRole}
                    onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                    aria-label="Filtrar por rol"
                    className="sm:w-44"
                >
                    <option value="">Todos los roles</option>
                    {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                            {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                        </option>
                    ))}
                </Select>
                <Select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    aria-label="Filtrar por estado"
                    className="sm:w-44"
                >
                    <option value="">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                </Select>
            </Card>

            {/* Tabla */}
            <DataState
                isLoading={usersQuery.isLoading}
                isError={usersQuery.isError}
                isEmpty={!usersQuery.isLoading && filtered.length === 0}
                skeleton={<SkeletonTable rows={8} cols={5} />}
                onRetry={() => usersQuery.refetch()}
                loadingLabel="Cargando usuarios..."
                emptyTitle="Sin usuarios"
                emptyDescription="Crea el primer usuario usando el botón de arriba."
            >
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                            <ExportButtons
                                data={filtered}
                                columns={USER_COLUMNS}
                                filters={{ query, role: filterRole, status: filterStatus }}
                                filename="users"
                                module="users"
                                title="Usuarios y roles"
                                disabled={filtered.length === 0}
                            />
                            <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
                        </div>
                    </div>
                    <UserTable
                        users={paginated}
                        currentUserId={authUser?.id}
                        onEdit={openEdit}
                        onToggleStatus={handleToggleStatus}
                    />
                </div>
            </DataState>

            {/* Modal crear / editar usuario */}
            <Modal
                isOpen={Boolean(userModal)}
                onClose={closeUserModal}
                title={userModal === 'create' ? 'Nuevo usuario' : `Editar: @${editingUser?.username}`}
                description={
                    userModal === 'create'
                        ? 'Completa los datos para crear el nuevo usuario.'
                        : 'Modifica los datos del usuario. El username no puede cambiarse.'
                }
                footer={
                    <>
                        <Button variant="secondary" onClick={closeUserModal} disabled={isBusy}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="user-form" disabled={isBusy}>
                            {isBusy ? 'Guardando...' : userModal === 'create' ? 'Crear usuario' : 'Guardar cambios'}
                        </Button>
                    </>
                }
            >
                <form id="user-form" onSubmit={handleUserSubmit}>
                    <UserForm
                        form={form}
                        onChange={handleFormChange}
                        isEdit={userModal === 'edit'}
                        roles={roles}
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword((p) => !p)}
                    />
                </form>
            </Modal>

            {/* Modal crear rol */}
            <Modal
                isOpen={roleModal}
                onClose={() => { setRoleModal(false); setNewRoleName(''); }}
                title="Nuevo rol"
                description="El nombre se guardará en minúsculas. Ejemplo: almacen, caja, supervisor."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setRoleModal(false)}>Cancelar</Button>
                        <Button type="submit" form="role-form" disabled={createRoleMutation.isPending}>
                            {createRoleMutation.isPending ? 'Creando...' : 'Crear rol'}
                        </Button>
                    </>
                }
            >
                <form id="role-form" onSubmit={handleCreateRole} className="space-y-4">
                    <FormField
                        label="Nombre del rol"
                        hint="Se guardará en minúsculas. Ej: almacen, caja, supervisor."
                    >
                        <Input
                            value={newRoleName}
                            placeholder="ej: supervisor, almacen, caja"
                            onChange={(e) => setNewRoleName(e.target.value.toLowerCase())}
                            required
                            aria-label="Nombre del nuevo rol"
                        />
                    </FormField>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500">Roles existentes:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {roles.map((r) => (
                                <span key={r.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {r.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UsersPage;
