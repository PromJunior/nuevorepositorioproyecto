from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal


# ─── Filtros comunes para todos los reportes ──────────────────────────────────
class ReportFilters(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    user_id: Optional[int] = None
    product_id: Optional[int] = None
    supplier_id: Optional[int] = None
    client_id: Optional[int] = None
    payment_method_id: Optional[int] = None
    status: Optional[str] = None
    transaction_type: Optional[str] = None


# ─── Fila de reporte de ventas ────────────────────────────────────────────────
class SalesReportRow(BaseModel):
    id: int
    document_number: Optional[str] = None
    order_date: datetime
    client_name: str
    seller_name: str
    items_count: int
    subtotal_amount: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    igv_percent: Decimal = Decimal("0")
    discount_amount: Decimal = Decimal("0")
    total_amount: Decimal
    payment_method: Optional[str] = None

    model_config = ConfigDict(from_attributes=False)


# ─── Fila de reporte de compras ───────────────────────────────────────────────
class PurchasesReportRow(BaseModel):
    id: int
    document_number: Optional[str] = None
    purchase_date: datetime
    supplier_name: str
    user_name: str
    invoice_number: Optional[str] = None
    items_count: int
    subtotal_amount: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    igv_percent: Decimal = Decimal("0")
    total_amount: Decimal
    status_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=False)


# ─── Fila de reporte Kardex ───────────────────────────────────────────────────
class KardexReportRow(BaseModel):
    id: int
    created_at: datetime
    product_name: str
    category_name: Optional[str] = None
    transaction_type: str
    concept: str
    quantity: int
    unit_cost: Decimal
    balance_stock: int
    balance_value: Decimal
    username: str
    source_type: Optional[str] = None

    model_config = ConfigDict(from_attributes=False)


# ─── Fila de reporte de caja ──────────────────────────────────────────────────
class KardexDailySummaryRow(BaseModel):
    date: date
    stock_entries: int
    stock_outputs: int
    stock_adjustments: int
    net_stock_movement: int
    sales_count: int
    sales_amount: Decimal

    model_config = ConfigDict(from_attributes=False)


class CashReportRow(BaseModel):
    id: int
    username: str
    opening_time: datetime
    closing_time: Optional[datetime] = None
    opening_amount: Decimal
    expected_amount: Optional[Decimal] = None
    closing_amount: Optional[Decimal] = None
    difference: Optional[Decimal] = None
    status: str

    model_config = ConfigDict(from_attributes=False)


# ─── Fila de log de auditoría ─────────────────────────────────────────────────
class AuditLogRow(BaseModel):
    id: int
    username: Optional[str] = None
    module: str
    action: str
    entity: Optional[str] = None
    entity_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=False)
