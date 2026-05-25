from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class SupplierBase(BaseModel):
    ruc: str = Field(..., min_length=11, max_length=11, pattern=r"^\d{11}$")
    company_name: str = Field(..., min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierResponse(SupplierBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RucResponse(BaseModel):
    ruc: str
    company_name: str
    address: Optional[str] = None
    state: Optional[str] = None
    condition: Optional[str] = None
    ubigeo: Optional[str] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    distrito: Optional[str] = None
