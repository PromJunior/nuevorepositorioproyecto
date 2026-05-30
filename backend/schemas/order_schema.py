from schemas.client_schema import ClientResponse
from schemas.payment_method_schema import PaymentMethodResponse
from pydantic import BaseModel, ConfigDict, model_validator
from typing import List, Optional
from datetime import datetime

class ProductNombre(BaseModel):
    name_product: str

    class Config:
        from_attributes = True

class OrderItemDetalle(BaseModel):
    product: ProductNombre
    quantity: int 
    price: float
    sub_amount: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    order_date: datetime
    total_amount: float
    client: Optional[ClientResponse] = None
    payment_method: Optional[PaymentMethodResponse] = None
    order_items_order: List[OrderItemDetalle]

    model_config = ConfigDict(from_attributes=True)

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
            "total_amount": getattr(data, "total_amount", None),
            "client": getattr(data, "client", None),
            "payment_method": getattr(payment, "payment_method", None) if payment else None,
            "order_items_order": getattr(data, "order_items_order", []),
        }

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int 
    price: float

class OrderCreate(BaseModel):
    client_id: int
    items: List[OrderItemCreate]
    payment_method_id: int


class OrderUpdate(OrderCreate):

    pass




