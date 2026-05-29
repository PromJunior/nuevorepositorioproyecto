from datetime import datetime
from typing import List, Optional
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


# ─── Entrada de compra ───────────────────────────────────────────────────────
class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., gt=0)


class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_number: Optional[str] = None
    items: List[PurchaseItemCreate]


# ─── Respuesta básica de ítem ────────────────────────────────────────────────
class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: float
    sub_amount: float

    model_config = ConfigDict(from_attributes=True)


# ─── Ítem enriquecido con nombre de producto ─────────────────────────────────
class PurchaseItemFull(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_cost: Decimal
    sub_amount: Decimal

    model_config = ConfigDict(from_attributes=False)


# ─── Info de estado ──────────────────────────────────────────────────────────
class PurchaseStatusInfo(BaseModel):
    id: int
    name_status: str

    model_config = ConfigDict(from_attributes=True)


# ─── Info de proveedor embebida ───────────────────────────────────────────────
class SupplierInfo(BaseModel):
    id: int
    ruc: str
    company_name: str

    model_config = ConfigDict(from_attributes=True)


# ─── Respuesta de lista (liviana) ────────────────────────────────────────────
class PurchaseResponse(BaseModel):
    id: int
    purchase_date: datetime
    invoice_number: Optional[str] = None
    total_amount: float
    supplier_id: int
    supplier: Optional[SupplierInfo] = None
    user_id: int
    status: Optional[PurchaseStatusInfo] = None
    purchase_items: List[PurchaseItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ─── Respuesta de detalle (completa) ─────────────────────────────────────────
class PurchaseDetailResponse(BaseModel):
    id: int
    purchase_date: datetime
    invoice_number: Optional[str] = None
    total_amount: Decimal
    supplier_id: int
    supplier: Optional[SupplierInfo] = None
    user_id: int
    username: Optional[str] = None
    status: Optional[PurchaseStatusInfo] = None
    items: List[PurchaseItemFull] = []

    model_config = ConfigDict(from_attributes=False)
