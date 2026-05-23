from pydantic import BaseModel
from datetime import datetime

class CashSessionOpen(BaseModel):
    opening_amount: float

class CashSessionClose(BaseModel):
    closing_time: datetime

#-----------------------> modelo de respuesta para cierre de caja          <------------------------  
class CashSessionResponsive(BaseModel):
    id: int
    user_id: int
    opening_amount: float
    opning_time: datetime
    #cierre de caja con fecha y hora, monto esperado y diferencia
    closing_amount: float
    closing_time: datetime
    expected_amount: float | None
    difference: float| None
    status: str
    class Config:
        from_attributes = True

