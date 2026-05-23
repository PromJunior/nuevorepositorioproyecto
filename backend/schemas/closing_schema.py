from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class DailSummary (BaseModel):
    method: str
    total: Decimal

    class Config:
        orm_mode = True

class CashClosingCreate(BaseModel):
    expected_amount: Decimal
    actual_amount: Decimal
    differences: Decimal
    notes: Optional[str] = None

class CashClosingResponse(CashClosingCreate):
    id: int
    closing_date: datetime
    class Config:
        orm_mode = True

class CashClosingList(BaseModel):
    id: int
    closing_date: datetime
    expected_amount: Decimal
    actual_amount: Decimal
    differences: Decimal
    notes: Optional[str] = None
    class Config:
        orm_mode = True