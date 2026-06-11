import hmac
import os
import secrets
from database.database import get_db
from sqlalchemy.orm import Session
from crud import user_crud
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, Header, HTTPException, status
from auth.password import verify_password, get_password_hash
from fastapi.security import OAuth2PasswordBearer
from core.config import settings

# Constantes centralizadas para evitar importes circulares
SECRET_KEY = "TU_LLAVE_SECRETA_SUPER_SEGURA_AQUI"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 400

# Esquema de seguridad para Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


# === GESTIÓN DE TOKENS JWT ===

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_user_role_name(user) -> Optional[str]:
    role = getattr(user, "role", None)
    if isinstance(role, str):
        return role
    return getattr(role, "name", None) or getattr(role, "name_role", None)


# === DEPENDENCIAS DE INYECCIÓN PARA FASTAPI ===

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        
    except JWTError:
        raise credentials_exception

    user = user_crud.get_user_by_username(db, username=username)
    
    if user is None:
        raise credentials_exception
        
    # Validación centralizada de estado activo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
        
    return user


def requiere_role(rol_name: str):
    """Función para validar usuarios con roles específicos de manera dinámica"""
    def role_checker(current_user=Depends(get_current_user)):
        # Nota: La validación de 'is_active' ya se ejecuta automáticamente en get_current_user
        
        # Validamos que el rol del usuario coincida con el rol requerido (normalizado a minúsculas)
        user_role = get_user_role_name(current_user)
        if not user_role or user_role.lower() != rol_name.lower().strip():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción"
            )
        return current_user
    return role_checker


require_role = requiere_role


def get_current_admin_user(current_user=Depends(get_current_user)):
    """Función específica y directa para proteger endpoints administrativos"""
    user_role = get_user_role_name(current_user)
    if not user_role or user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )
    return current_user


def get_configured_api_key() -> Optional[str]:
    return (
        os.getenv("ERP_DAILY_BACKUP_API_KEY")
        or os.getenv("ERP_BACKUP_API_KEY")
        or os.getenv("ERP_API_KEY")
    )


def require_admin_or_api_key(
    db: Session = Depends(get_db),
    token: str | None = Depends(optional_oauth2_scheme),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    configured_key = get_configured_api_key()
    if configured_key and x_api_key and hmac.compare_digest(x_api_key, configured_key):
        return None

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token o API key",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = user_crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")
    if (get_user_role_name(user) or "").lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta accion",
        )
    return user


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTENTICACIÓN MÁQUINA-A-MÁQUINA (M2M) — n8n Service Secret
# ═══════════════════════════════════════════════════════════════════════════════

def verify_n8n_secret(
    x_n8n_secret: str | None = Header(default=None, alias="X-N8N-Secret"),
) -> None:
    """
    Dependencia standalone: valida el header X-N8N-Secret contra
    N8N_SERVICE_SECRET del entorno.

    Retorna None si el header es correcto.
    Lanza HTTP 401 si:
      - N8N_SERVICE_SECRET no está configurado en .env
      - El header X-N8N-Secret está ausente
      - El valor no coincide (comparación en tiempo constante)

    El valor del secreto nunca se incluye en mensajes de error ni en logs.
    """
    configured = settings.n8n_service_secret
    if not configured:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticación de servicio no configurada en el servidor",
        )
    if not x_n8n_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header X-N8N-Secret requerido",
            headers={"WWW-Authenticate": "X-N8N-Secret"},
        )
    if not secrets.compare_digest(x_n8n_secret, configured):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-N8N-Secret inválido",
        )


def verify_export_access(
    db: Session = Depends(get_db),
    token: str | None = Depends(optional_oauth2_scheme),
    x_n8n_secret: str | None = Header(default=None, alias="X-N8N-Secret"),
):
    """
    Dependencia combinada para rutas de exportación usadas tanto por
    el frontend (JWT de admin) como por n8n (X-N8N-Secret).

    Acepta:
      A) JWT válido de usuario con rol admin  → devuelve el objeto User
      B) Header X-N8N-Secret correcto         → devuelve None (acceso M2M)

    Reglas de prioridad:
      1. Si X-N8N-Secret está presente se evalúa PRIMERO.
         - Coincide  → acceso concedido, retorna None.
         - No coincide → 401 inmediato (no se intenta JWT).
      2. Si X-N8N-Secret está ausente → se valida el JWT normalmente.
      3. Si no hay nada → 401.

    De esta forma el frontend no necesita cambios y n8n no necesita JWT.
    """
    configured = settings.n8n_service_secret

    # ── Rama A: header X-N8N-Secret presente ─────────────────────────────────
    if x_n8n_secret is not None:
        if configured and secrets.compare_digest(x_n8n_secret, configured):
            return None  # acceso M2M concedido
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-N8N-Secret inválido",
        )

    # ── Rama B: JWT ───────────────────────────────────────────────────────────
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Se requiere JWT de admin válido o X-N8N-Secret",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = user_crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )
    if (get_user_role_name(user) or "").lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción",
        )
    return user
