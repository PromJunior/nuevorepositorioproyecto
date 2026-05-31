from datetime import datetime
from decimal import Decimal
from typing import Annotated, List, Optional

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator

Money = Annotated[
    Decimal,
    Field(max_digits=10, decimal_places=2),
    PlainSerializer(lambda value: float(value), return_type=float, when_used="json"),
]
Percent = Annotated[
    Decimal,
    Field(max_digits=5, decimal_places=2),
    PlainSerializer(lambda value: float(value), return_type=float, when_used="json"),
]


def _zero_if_none(value, default: str = "0.00") -> Decimal:
    return Decimal(default) if value is None else value


class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_cost: Money = Field(..., gt=0)


class PurchaseCreate(BaseModel):
    supplier_id: Optional[int] = None
    invoice_number: Optional[str] = None
    items: List[PurchaseItemCreate]


class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: Money
    sub_amount: Money

    model_config = ConfigDict(from_attributes=True)

    @field_validator("unit_cost", "sub_amount", mode="before")
    @classmethod
    def default_money(cls, value):
        return _zero_if_none(value)


class PurchaseItemFull(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_cost: Money
    sub_amount: Money

    model_config = ConfigDict(from_attributes=False)

    @field_validator("unit_cost", "sub_amount", mode="before")
    @classmethod
    def default_money(cls, value):
        return _zero_if_none(value)


class PurchaseStatusInfo(BaseModel):
    id: int
    name_status: str

    model_config = ConfigDict(from_attributes=True)


class SupplierInfo(BaseModel):
    id: int
    ruc: Optional[str] = None
    company_name: str

    model_config = ConfigDict(from_attributes=True)


class PurchaseResponse(BaseModel):
    id: int
    purchase_date: datetime
    document_number: Optional[str] = None
    invoice_number: Optional[str] = None
    subtotal_amount: Money = Decimal("0.00")
    tax_amount: Money = Decimal("0.00")
    igv_percent: Percent = Decimal("18.00")
    total_amount: Money = Decimal("0.00")
    supplier_id: int
    supplier: Optional[SupplierInfo] = None
    user_id: int
    status: Optional[PurchaseStatusInfo] = None
    purchase_items: List[PurchaseItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

    @field_validator("subtotal_amount", "tax_amount", "total_amount", mode="before")
    @classmethod
    def default_money(cls, value):
        return _zero_if_none(value)

    @field_validator("igv_percent", mode="before")
    @classmethod
    def default_percent(cls, value):
        return _zero_if_none(value, "18.00")


class PurchaseDetailResponse(BaseModel):
    id: int
    purchase_date: datetime
    document_number: Optional[str] = None
    invoice_number: Optional[str] = None
    subtotal_amount: Money = Decimal("0.00")
    tax_amount: Money = Decimal("0.00")
    igv_percent: Percent = Decimal("18.00")
    total_amount: Money = Decimal("0.00")
    supplier_id: int
    supplier: Optional[SupplierInfo] = None
    user_id: int
    username: Optional[str] = None
    status: Optional[PurchaseStatusInfo] = None
    items: List[PurchaseItemFull] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=False)

    @field_validator("subtotal_amount", "tax_amount", "total_amount", mode="before")
    @classmethod
    def default_money(cls, value):
        return _zero_if_none(value)

    @field_validator("igv_percent", mode="before")
    @classmethod
    def default_percent(cls, value):
        return _zero_if_none(value, "18.00")
