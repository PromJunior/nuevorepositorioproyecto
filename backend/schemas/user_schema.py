from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional, List
from datetime import datetime

# --- ESQUEMAS DE ROLES ---
class RoleBase(BaseModel):
    name: str = Field(..., description="Nombre único del rol (ej: admin, vendedor)")

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- ESQUEMAS DE USUARIOS ---
class UserBase(BaseModel):
    username: str
    fullname: str
    role: Optional[str] = None

class UserCreate(UserBase):
    id_role: Optional[int] = None
    password: str = Field(..., description="Contraseña en texto plano")

class UserResponse(UserBase):
    id: int
    id_role: int
    is_active: bool
    create_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def role_relationship_to_name(cls, data):
        if not isinstance(data, dict):
            role = getattr(data, "role", None)
            return {
                "id": getattr(data, "id", None),
                "username": getattr(data, "username", None),
                "fullname": getattr(data, "fullname", None),
                "id_role": getattr(data, "id_role", None),
                "role": getattr(role, "name", None),
                "is_active": getattr(data, "is_active", None),
                "create_at": getattr(data, "create_at", None),
            }
        return data

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    password: Optional[str] = None # Añadido soporte preventivo para password
    role: Optional[str] = None
    id_role: Optional[int] = None
    is_active: Optional[bool] = None