from decimal import Decimal
from typing import Optional
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, model_validator


class CompanySettingsBase(BaseModel):
    legal_name: str = Field(min_length=1, max_length=180)
    trade_name: Optional[str] = Field(default=None, max_length=180)
    ruc: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=40)
    email: Optional[EmailStr] = None
    website: Optional[HttpUrl | str] = None
    logo_url: Optional[HttpUrl | str] = None
    primary_currency: str = Field(default="PEN", max_length=10)
    secondary_currency: Optional[str] = Field(default=None, max_length=10)


class CompanySettingsUpdate(CompanySettingsBase):
    pass


class CompanySettingsResponse(CompanySettingsBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class FiscalSettings(BaseModel):
    igv_percent: Decimal = Field(default=18, ge=0, le=100)
    currency: str = Field(default="PEN", max_length=10)
    currency_symbol: str = Field(default="S/", max_length=10)
    manual_exchange_rate: Decimal = Field(default=3.75, ge=0)
    currency_format: str = Field(default="es-PE", max_length=30)


class DocumentSerieSettings(BaseModel):
    serie: str = Field(default="", max_length=20)
    correlativo: int = Field(default=1, ge=0)


class SeriesSettings(BaseModel):
    sales_receipt: DocumentSerieSettings = Field(default_factory=lambda: DocumentSerieSettings(serie="B001", correlativo=1))
    invoice: DocumentSerieSettings = Field(default_factory=lambda: DocumentSerieSettings(serie="F001", correlativo=1))
    purchase: DocumentSerieSettings = Field(default_factory=lambda: DocumentSerieSettings(serie="C001", correlativo=1))
    note: DocumentSerieSettings = Field(default_factory=lambda: DocumentSerieSettings(serie="N001", correlativo=1))


class InventorySettings(BaseModel):
    global_min_stock: int = Field(default=5, ge=0)
    stock_alert_days: int = Field(default=7, ge=0)
    allow_negative_stock: bool = False
    requires_inventory_adjustment_approval: bool = True


class SalesSettings(BaseModel):
    default_counter_client_id: Optional[int] = None
    default_payment_method_id: Optional[int] = None
    allow_manual_discount: bool = True
    max_discount_percent: Decimal = Field(default=10, ge=0, le=100)
    requires_discount_authorization: bool = True


class PurchasesSettings(BaseModel):
    default_generic_supplier_id: Optional[int] = None
    allow_purchases_without_supplier: bool = False
    requires_purchase_approval: bool = True


class CashSettings(BaseModel):
    minimum_opening_amount: Decimal = Field(default=0, ge=0)
    suggested_opening_amount: Decimal = Field(default=100, ge=0)
    requires_mandatory_closing: bool = True
    allow_multiple_open_cash_sessions: bool = False


class DashboardSettings(BaseModel):
    visible_kpis: list[str] = Field(default_factory=lambda: [
        "sales_today",
        "sales_this_month",
        "purchases_this_month",
        "inventory_value",
        "cash_status",
        "low_stock",
        "clients",
        "clients_vip",
        "clients_inactive",
        "suppliers",
    ])
    visible_charts: list[str] = Field(default_factory=lambda: [
        "low_stock",
        "sales_chart",
        "payment_methods",
        "top_products",
        "top_clients",
        "client_segmentation",
        "recent_sales",
        "recent_purchases",
        "quick_actions",
    ])
    records_limit: int = Field(default=10, ge=1, le=100)


class ReportsSettings(BaseModel):
    default_pdf: bool = True
    default_excel: bool = True
    default_csv: bool = False


class AutomationsSettings(BaseModel):
    webhook_enabled: bool = False
    webhook_url: Optional[str] = Field(default=None, max_length=500)
    webhook_secret: Optional[str] = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def validate_webhook_url(self):
        if self.webhook_url == "":
            self.webhook_url = None
        if not self.webhook_url:
            if self.webhook_enabled:
                raise ValueError("URL Webhook es requerida cuando el webhook esta activo")
            return self

        parsed_url = urlparse(self.webhook_url)
        if parsed_url.scheme not in ("http", "https") or not parsed_url.netloc:
            raise ValueError("URL Webhook no es valida")
        return self


class SystemSettingsUpdate(BaseModel):
    fiscal: FiscalSettings = Field(default_factory=FiscalSettings)
    series: SeriesSettings = Field(default_factory=SeriesSettings)
    inventory: InventorySettings = Field(default_factory=InventorySettings)
    sales: SalesSettings = Field(default_factory=SalesSettings)
    purchases: PurchasesSettings = Field(default_factory=PurchasesSettings)
    cash: CashSettings = Field(default_factory=CashSettings)
    dashboard: DashboardSettings = Field(default_factory=DashboardSettings)
    reports: ReportsSettings = Field(default_factory=ReportsSettings)
    automations: AutomationsSettings = Field(default_factory=AutomationsSettings)


class PaymentMethodSettingsResponse(BaseModel):
    id: int
    code: Optional[str] = None
    name_payment_method: str
    is_cash: bool = False
    affects_cash_closing: bool = False
    requires_reference: bool = False
    is_active: bool = True
    display_order: int = 0

    model_config = ConfigDict(from_attributes=True)


class PaymentMethodSettingsUpdate(BaseModel):
    name_payment_method: str = Field(min_length=1, max_length=255)
    is_active: bool = True
    display_order: int = Field(default=0, ge=0)


class SettingsResponse(SystemSettingsUpdate):
    id: int
    company: CompanySettingsResponse
    payment_methods: list[PaymentMethodSettingsResponse] = []

    model_config = ConfigDict(from_attributes=True)
