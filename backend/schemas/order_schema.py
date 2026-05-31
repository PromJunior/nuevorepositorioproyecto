from schemas.client_schema import ClientResponse
from schemas.payment_method_schema import PaymentMethodResponse
from decimal import Decimal
from typing import Annotated, List, Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator, model_validator

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


class ProductNombre(BaseModel):
    name_product: str

    model_config = ConfigDict(from_attributes=True)

class OrderItemDetalle(BaseModel):
    product: ProductNombre
    quantity: int 
    price: Money
    sub_amount: Money

    model_config = ConfigDict(from_attributes=True)

    @field_validator("price", "sub_amount", mode="before")
    @classmethod
    def default_money(cls, value):
        return _zero_if_none(value)

class OrderResponse(BaseModel):
    id: int
    order_date: datetime
    document_number: Optional[str] = None
    subtotal_amount: Money = Decimal("0.00")
    tax_amount: Money = Decimal("0.00")
    igv_percent: Percent = Decimal("18.00")
    discount_amount: Money = Decimal("0.00")
    total_amount: Money = Decimal("0.00")
    client: Optional[ClientResponse] = None
    payment_method: Optional[PaymentMethodResponse] = None
    order_items_order: List[OrderItemDetalle] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

    @field_validator(
        "subtotal_amount",
        "tax_amount",
        "discount_amount",
        "total_amount",
        mode="before",
    )
    @classmethod
    def default_money(cls, value):
        return _zero_if_none(value)

    @field_validator("igv_percent", mode="before")
    @classmethod
    def default_percent(cls, value):
        return _zero_if_none(value, "18.00")

    @model_validator(mode="before")
    @classmethod
    def include_payment_method(cls, data):
        if isinstance(data, dict):
            return data

        payments = getattr(data, "payment_order", None) or []
        payment = payments[0] if payments else None
        return {
            "id": getattr(data, "id", None),
            "order_date": getattr(data, "order_date", None),
            "document_number": getattr(data, "document_number", None),
            "subtotal_amount": _zero_if_none(getattr(data, "subtotal_amount", None)),
            "tax_amount": _zero_if_none(getattr(data, "tax_amount", None)),
            "igv_percent": _zero_if_none(getattr(data, "igv_percent", None), "18.00"),
            "discount_amount": _zero_if_none(getattr(data, "discount_amount", None)),
            "total_amount": _zero_if_none(getattr(data, "total_amount", None)),
            "client": getattr(data, "client", None),
            "payment_method": getattr(payment, "payment_method", None) if payment else None,
            "order_items_order": getattr(data, "order_items_order", []),
        }

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int 
    price: Money

class OrderCreate(BaseModel):
    client_id: Optional[int] = None
    items: List[OrderItemCreate]
    payment_method_id: Optional[int] = None
    discount_percent: Percent = Decimal("0.00")


class OrderUpdate(OrderCreate):

    pass




