from schemas.client_schema import ClientResponse
from pydantic import BaseModel
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
    order_items_order: List[OrderItemDetalle]

    class Config:
        from_attributes = True

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




