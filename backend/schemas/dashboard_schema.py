from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from schemas.settings_schema import CompanySettingsResponse


# ─── KPIs principales ─────────────────────────────────────────────────────────
class DashboardSummary(BaseModel):
    # Ventas
    sales_today: Decimal
    orders_today: int
    sales_this_month: Decimal
    orders_this_month: int
    sales_total: Decimal
    orders_total: int
    # Compras
    purchases_this_month: Decimal
    purchases_count_this_month: int
    # Inventario
    total_inventory_value: Decimal
    total_products: int
    low_stock_count: int
    # Entidades
    total_clients: int
    clients_new_this_month: int
    clients_vip: int = 0
    clients_frequent: int = 0
    clients_inactive: int = 0
    total_suppliers: int
    # Caja
    has_open_session: bool
    open_session_expected: Optional[Decimal] = None
    company: Optional[CompanySettingsResponse] = None
    dashboard_settings: dict = {}
    fiscal_settings: dict = {}
    low_stock_threshold: int = 5


# ─── Top producto más vendido ─────────────────────────────────────────────────
class TopProduct(BaseModel):
    product_id: int
    product_name: str
    total_quantity: int
    total_revenue: Decimal

    model_config = ConfigDict(from_attributes=False)


# ─── Top cliente ──────────────────────────────────────────────────────────────
class TopClient(BaseModel):
    client_id: Optional[int] = None
    client_name: str
    total_orders: int
    total_spent: Decimal

    model_config = ConfigDict(from_attributes=False)


class ClientSegmentationPoint(BaseModel):
    segment: str
    count: int

    model_config = ConfigDict(from_attributes=False)


# ─── Venta reciente ───────────────────────────────────────────────────────────
class RecentSale(BaseModel):
    id: int
    order_date: datetime
    client_name: str
    seller_name: str
    total_amount: Decimal
    payment_method: Optional[str] = None

    model_config = ConfigDict(from_attributes=False)


# ─── Compra reciente ──────────────────────────────────────────────────────────
class RecentPurchase(BaseModel):
    id: int
    purchase_date: datetime
    supplier_name: str
    user_name: str
    total_amount: Decimal
    status_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=False)


# ─── Punto del gráfico de ventas ──────────────────────────────────────────────
class SalesChartPoint(BaseModel):
    date: str          # "YYYY-MM-DD"
    total: Decimal
    orders: int

    model_config = ConfigDict(from_attributes=False)


# ─── Distribución método de pago ─────────────────────────────────────────────
class PaymentMethodStat(BaseModel):
    method: str
    total: Decimal
    count: int

    model_config = ConfigDict(from_attributes=False)
