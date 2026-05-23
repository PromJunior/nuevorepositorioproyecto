from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class ClientBase(BaseModel):
    dni: str = Field(..., min_length=8, max_length=8, pattern=r"^\d{8}$")
    full_name: str = Field(..., min_length=1, max_length=150)
    address: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: EmailStr


class ClientCreate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: int
    created_at: Optional[datetime]=None

    class Config:
        from_attributes = True


class DniResponse(BaseModel):
    dni: str
    full_name: str
    nombres: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    codigo_verificacion: Optional[int] = None
