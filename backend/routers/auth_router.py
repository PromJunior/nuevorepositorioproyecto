from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from database.database import get_db
from auth.password import verify_password
from auth.security import (
    create_access_token,
    get_current_user,
    get_user_role_name,
    require_role
)
from models.model import User
from schemas.user_schema import (
    UserCreate,
    UserResponse,
    Token,
    UserUpdate,
    RoleCreate,
    RoleResponse,
)
from crud import user_crud

router = APIRouter(tags=["Authentication"])


# ─── Login ───────────────────────────────────────────────────────────────────
@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = user_crud.get_user_by_username(db=db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="username o contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacta al administrador.",
        )
    access_token = create_access_token(
        data={"sub": user.username, "role": get_user_role_name(user)},
        expires_delta=timedelta(minutes=480),
    )
    # Registro de auditoría — silencioso
    try:
        from crud.report_crud import log_action
        log_action(db, user.id, "auth", "LOGIN", "User", user.id, f"Login: {user.username}")
    except Exception:
        pass
    return {"access_token": access_token, "token_type": "bearer"}


# ─── Perfil del usuario autenticado ──────────────────────────────────────────
@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── Crear usuario (admin) ────────────────────────────────────────────────────
@router.post("/register/", response_model=UserResponse)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede crear usuarios")

    if user_crud.get_user_by_username(db=db, username=user.username):
        raise HTTPException(status_code=400, detail="El username ya existe")

    try:
        new_user = user_crud.create_user(db=db, user_data=user)
        try:
            from crud.report_crud import log_action
            log_action(db, current_user.id, "usuarios", "CREATE", "User", new_user.id,
                       f"Creó usuario: {new_user.username} (rol: {user.role or user.id_role})")
        except Exception:
            pass
        return new_user
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ─── Listar usuarios (admin) ──────────────────────────────────────────────────
@router.get("/users/", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede ver la lista de usuarios")
    return user_crud.get_all_users(db=db)


# ─── Actualizar usuario (admin) ───────────────────────────────────────────────
@router.put("/users/{user_id}", response_model=UserResponse)
def edit_user(
    user_id: int,
    user_updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para editar usuarios")

    try:
        updated = user_crud.update_user(db, user_id, user_updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        try:
            from crud.report_crud import log_action
            changed = [k for k, v in user_updates.model_dump(exclude_unset=True).items()
                       if k != "password"]
            desc = f"Actualizó usuario #{user_id}: {', '.join(changed) or 'contraseña'}"
            log_action(db, current_user.id, "usuarios", "UPDATE", "User", user_id, desc)
        except Exception:
            pass
        return updated
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ─── Desactivar usuario (admin) — protege al último admin activo ──────────────
@router.delete("/users/{user_id}", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Proteger el último administrador activo
    admin_role = user_crud.get_role_by_name(db, "admin")
    if admin_role and target.id_role == admin_role.id and target.is_active:
        active_admins = (
            db.query(User)
            .filter(User.id_role == admin_role.id, User.is_active == True)  # noqa: E712
            .count()
        )
        if active_admins <= 1:
            raise HTTPException(
                status_code=409,
                detail="No se puede desactivar al único administrador activo del sistema.",
            )

    result = user_crud.deactivate_user(db, user_id)
    try:
        from crud.report_crud import log_action
        log_action(db, current_user.id, "usuarios", "DISABLE", "User", user_id,
                   f"Desactivó usuario: {target.username}")
    except Exception:
        pass
    return result


# ─── Activar usuario (admin) ──────────────────────────────────────────────────
@router.post("/users/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")

    from schemas.user_schema import UserUpdate
    activated = user_crud.update_user(db, user_id, UserUpdate(is_active=True))
    if not activated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    try:
        from crud.report_crud import log_action
        log_action(db, current_user.id, "usuarios", "ACTIVATE", "User", user_id,
                   f"Reactivó usuario: {activated.username}")
    except Exception:
        pass
    return activated


# ══════════════════════════════════════════════════════════════
# ROLES
# ══════════════════════════════════════════════════════════════

@router.get("/roles/", response_model=List[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todos los roles disponibles. Cualquier usuario autenticado puede consultarlos."""
    return user_crud.get_all_roles(db=db)


@router.post("/roles/", response_model=RoleResponse, status_code=201)
def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede crear roles")

    existing = user_crud.get_role_by_name(db, role.name)
    if existing:
        raise HTTPException(status_code=409, detail=f"El rol '{role.name}' ya existe")

    return user_crud.create_role(db=db, role_data=role)
