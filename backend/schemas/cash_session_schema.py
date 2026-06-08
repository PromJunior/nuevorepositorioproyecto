from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CashSessionOpen(BaseModel):
    opening_amount: float


class CashSessionClose(BaseModel):
    closing_amount: float


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


class CashSessionWithUserResponse(CashSessionResponse):
    username: Optional[str] = None
    fullname: Optional[str] = None


class CashSessionPaymentBreakdown(BaseModel):
    payment_method_id: int
    payment_method: str
    total_sales: float
    total_orders: int


class CashSessionSummary(BaseModel):
    session_id: int
    user_id: int
    status: str
    opening_amount: float
    closing_amount: Optional[float] = None
    expected_amount: Optional[float] = None
    difference: Optional[float] = None
    total_sales: float
    total_orders: int
    payment_breakdown: list[CashSessionPaymentBreakdown] = []
    opening_time: datetime
    closing_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
