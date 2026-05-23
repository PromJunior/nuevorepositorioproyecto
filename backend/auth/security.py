from database.database import get_db
from sqlalchemy.orm import Session
from crud import user_crud
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Constantes centralizadas para evitar importes circulares
SECRET_KEY = "TU_LLAVE_SECRETA_SUPER_SEGURA_AQUI"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 400

# Esquema de seguridad para Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# === FUNCIONES DE ENCRIPTACIÓN CENTRALIZADAS ===

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Genera el hash seguro de la contraseña usando bcrypt"""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


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


def get_current_admin_user(current_user=Depends(get_current_user)):
    """Función específica y directa para proteger endpoints administrativos"""
    user_role = get_user_role_name(current_user)
    if not user_role or user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )
    return current_user