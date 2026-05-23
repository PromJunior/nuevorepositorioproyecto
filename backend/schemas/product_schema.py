from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class CategoryName(BaseModel):
    name_category: str
    class Config:
        from_attributes = True


class ProductData(BaseModel):

    name_product: str
    price: float
    stockProduct: bool
    stock: int
    description: Optional[str] = None
    category_id: int

class ProductResponse(ProductData):
    id: int
    category: Optional[CategoryName] = None
    class Config:
        from_attributes = True




