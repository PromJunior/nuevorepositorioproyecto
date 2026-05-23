from pydantic import BaseModel

class PaymentMethodData(BaseModel):
    name_payment_method: str

class PaymentMethodResponse(PaymentMethodData):
    id: int

    class Config:
        from_attributes = True