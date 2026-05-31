from datetime import datetime
from decimal import Decimal
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


class ClientUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    address: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class ClientResponse(ClientBase):
    id: int
    create_at: Optional[datetime] = None
    is_active: bool = True
    delete_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DniResponse(BaseModel):
    dni: str
    full_name: str
    nombres: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    codigo_verificacion: Optional[int] = None


class ClientStats(BaseModel):
    total_purchases: Decimal
    total_amount: Decimal
    last_purchase: Optional[datetime] = None
    orders_count: int
    recency_days: Optional[int] = None
    frequency: int = 0
    monetary: Decimal = Decimal("0.00")
    segment: str = "Nuevo"


class ClientCrmSummary(BaseModel):
    registered_clients: int
    active_clients: int
    frequent_clients: int
    new_clients_this_month: int
    vip_clients: int = 0
    inactive_clients: int = 0
    new_clients: int = 0


class ClientPurchaseHistoryItem(BaseModel):
    id: int
    order_date: datetime
    total_amount: Decimal
    payment_method: Optional[str] = None
    seller_name: Optional[str] = None
    status_name: Optional[str] = None


class ClientPurchaseHistoryResponse(BaseModel):
    items: list[ClientPurchaseHistoryItem]
    total: int
    skip: int
    limit: int


class ClientCrmRow(BaseModel):
    id: int
    dni: str
    full_name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    create_at: Optional[datetime] = None
    orders_count: int
    total_amount: Decimal
    last_purchase: Optional[datetime] = None
    recency_days: Optional[int] = None
    frequency: int
    monetary: Decimal
    segment: str


class ClientSegmentStat(BaseModel):
    segment: str
    count: int


class ClientNoteCreate(BaseModel):
    note: str = Field(..., min_length=1, max_length=500)


class ClientNoteResponse(BaseModel):
    id: int
    client_id: int
    note: str
    username: Optional[str] = None
    created_at: datetime


class ClientFollowUpCreate(BaseModel):
    next_contact_at: datetime
    status: str = Field(default="PENDIENTE", pattern="^(PENDIENTE|CONTACTADO|CERRADO)$")
    comment: Optional[str] = Field(default=None, max_length=500)


class ClientFollowUpUpdate(BaseModel):
    next_contact_at: Optional[datetime] = None
    status: Optional[str] = Field(default=None, pattern="^(PENDIENTE|CONTACTADO|CERRADO)$")
    comment: Optional[str] = Field(default=None, max_length=500)


class ClientFollowUpResponse(BaseModel):
    id: int
    client_id: int
    next_contact_at: datetime
    status: str
    comment: Optional[str] = None
    username: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
