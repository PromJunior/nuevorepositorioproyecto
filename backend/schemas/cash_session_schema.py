from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CashSessionOpen(BaseModel):
    opening_amount: float

class CashSessionClose(BaseModel):
    closing_time: datetime

#-----------------------> modelo de respuesta para sesión de caja <------------------------
class CashSessionResponse(BaseModel):
    id: int
    user_id: int
    opening_amount: float
    opening_time: datetime
    closing_amount: Optional[float] = None
    closing_time: Optional[datetime] = None
    expected_amount: Optional[float] = None
    difference: Optional[float] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

