from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CashSessionOpen(BaseModel):
    opening_amount: float


class CashSessionClose(BaseModel):
    closing_amount: float


# ─── Respuesta base de sesión ────────────────────────────────────────────────
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


# ─── Respuesta extendida con datos del usuario (para historial) ──────────────
class CashSessionWithUserResponse(CashSessionResponse):
    username: Optional[str] = None
    fullname: Optional[str] = None


# ─── Resumen de sesión activa ────────────────────────────────────────────────
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
    opening_time: datetime
    closing_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

