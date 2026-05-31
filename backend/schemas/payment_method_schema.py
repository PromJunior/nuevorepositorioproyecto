from pydantic import BaseModel
from typing import Optional

class PaymentMethodData(BaseModel):
    name_payment_method: str

class PaymentMethodResponse(PaymentMethodData):
    id: int
    code: Optional[str] = None
    is_cash: bool = False
    affects_cash_closing: bool = False
    requires_reference: bool = False
    is_active: bool = True
    display_order: int = 0

    class Config:
        from_attributes = True
