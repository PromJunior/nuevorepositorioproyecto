from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., gt=0)


class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_number: Optional[str] = None
    items: List[PurchaseItemCreate]


class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: float
    sub_amount: float

    class Config:
        from_attributes = True


class PurchaseResponse(BaseModel):
    id: int
    purchase_date: datetime
    invoice_number: Optional[str] = None
    total_amount: float
    supplier_id: int
    user_id: int
    purchase_items: List[PurchaseItemResponse] = []

    class Config:
        from_attributes = True
