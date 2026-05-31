from sqlalchemy.orm import Session

from models.model import CompanySettings, PaymentMethod, SystemSettings
from schemas.settings_schema import (
    CompanySettingsUpdate,
    PaymentMethodSettingsUpdate,
    SystemSettingsUpdate,
)

SINGLETON_KEY = "default"

DEFAULT_PAYMENT_METHODS = [
    {"code": "EFECTIVO", "name_payment_method": "Efectivo", "is_cash": True, "affects_cash_closing": True, "display_order": 1},
    {"code": "YAPE", "name_payment_method": "Yape", "is_cash": False, "affects_cash_closing": True, "display_order": 2},
    {"code": "PLIN", "name_payment_method": "Plin", "is_cash": False, "affects_cash_closing": True, "display_order": 3},
    {"code": "TRANSFERENCIA", "name_payment_method": "Transferencia", "is_cash": False, "affects_cash_closing": True, "display_order": 4},
    {"code": "TARJETA", "name_payment_method": "Tarjeta", "is_cash": False, "affects_cash_closing": True, "display_order": 5},
]


def _system_payload(data: SystemSettingsUpdate) -> dict:
    return data.model_dump(mode="json")


def _system_dict(db: Session) -> dict:
    settings = get_or_create_system_settings(db)
    return {
        "fiscal": settings.fiscal or {},
        "series": settings.series or {},
        "inventory": settings.inventory or {},
        "sales": settings.sales or {},
        "purchases": settings.purchases or {},
        "cash": settings.cash or {},
        "dashboard": settings.dashboard or {},
        "reports": settings.reports or {},
    }


def get_fiscal_settings(db: Session) -> dict:
    return _system_dict(db)["fiscal"]


def get_inventory_settings(db: Session) -> dict:
    return _system_dict(db)["inventory"]


def get_sales_settings(db: Session) -> dict:
    return _system_dict(db)["sales"]


def get_purchases_settings(db: Session) -> dict:
    return _system_dict(db)["purchases"]


def get_cash_settings(db: Session) -> dict:
    return _system_dict(db)["cash"]


def get_dashboard_settings(db: Session) -> dict:
    return _system_dict(db)["dashboard"]


def get_reports_settings(db: Session) -> dict:
    return _system_dict(db)["reports"]


def format_document_number(serie: str, correlativo: int) -> str:
    return f"{serie}-{int(correlativo):06d}"


def next_document_number(db: Session, series_key: str) -> str:
    settings = get_or_create_system_settings(db)
    series = dict(settings.series or {})
    current = dict(series.get(series_key) or {})
    serie = current.get("serie") or "DOC"
    correlativo = int(current.get("correlativo") or 1)
    document_number = format_document_number(serie, correlativo)
    current["correlativo"] = correlativo + 1
    series[series_key] = current
    settings.series = series
    db.flush()
    return document_number


def get_or_create_company_settings(db: Session) -> CompanySettings:
    settings = db.query(CompanySettings).filter(CompanySettings.singleton_key == SINGLETON_KEY).first()
    if settings:
        return settings

    settings = CompanySettings(
        singleton_key=SINGLETON_KEY,
        legal_name="Mi Empresa",
        trade_name="ERP SaaS",
        ruc="",
        address="",
        phone="",
        email=None,
        website="",
        logo_url="",
        primary_currency="PEN",
        secondary_currency=None,
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_company_settings(db: Session, data: CompanySettingsUpdate) -> CompanySettings:
    settings = get_or_create_company_settings(db)
    for key, value in data.model_dump(mode="json").items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings


def get_or_create_system_settings(db: Session) -> SystemSettings:
    settings = db.query(SystemSettings).filter(SystemSettings.singleton_key == SINGLETON_KEY).first()
    if settings:
        defaults = _system_payload(SystemSettingsUpdate())
        changed = False
        for section, default_value in defaults.items():
            current = getattr(settings, section) or {}
            merged = {**default_value, **current}
            if merged != current:
                setattr(settings, section, merged)
                changed = True
        if changed:
            db.commit()
            db.refresh(settings)
        return settings

    payload = _system_payload(SystemSettingsUpdate())
    settings = SystemSettings(singleton_key=SINGLETON_KEY, **payload)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_system_settings(db: Session, data: SystemSettingsUpdate) -> SystemSettings:
    settings = get_or_create_system_settings(db)
    payload = _system_payload(data)
    for key, value in payload.items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings


def seed_default_payment_methods(db: Session):
    for item in DEFAULT_PAYMENT_METHODS:
        existing = (
            db.query(PaymentMethod)
            .filter(PaymentMethod.code == item["code"])
            .first()
        )
        if not existing:
            existing = (
                db.query(PaymentMethod)
                .filter(PaymentMethod.name_payment_method == item["name_payment_method"])
                .first()
            )
        if existing:
            if not existing.code:
                existing.code = item["code"]
            if existing.display_order in (None, 0):
                existing.display_order = item["display_order"]
            continue

        db.add(PaymentMethod(**item, is_active=True, requires_reference=False))
    db.commit()


def get_payment_methods_for_settings(db: Session) -> list[PaymentMethod]:
    return (
        db.query(PaymentMethod)
        .order_by(PaymentMethod.display_order.asc(), PaymentMethod.id.asc())
        .all()
    )


def update_payment_method_settings(
    db: Session,
    payment_method_id: int,
    data: PaymentMethodSettingsUpdate,
) -> PaymentMethod | None:
    method = db.query(PaymentMethod).filter(PaymentMethod.id == payment_method_id).first()
    if not method:
        return None

    method.name_payment_method = data.name_payment_method
    method.is_active = data.is_active
    method.display_order = data.display_order
    db.commit()
    db.refresh(method)
    return method
