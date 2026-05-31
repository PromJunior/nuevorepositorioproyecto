from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.security import get_current_user, get_user_role_name
from crud import settings_crud
from database.database import get_db
from models.model import User
from schemas.settings_schema import (
    CompanySettingsResponse,
    CompanySettingsUpdate,
    PaymentMethodSettingsResponse,
    PaymentMethodSettingsUpdate,
    SettingsResponse,
    SystemSettingsUpdate,
)

router = APIRouter(prefix="/settings", tags=["System Settings"])


def _role(current_user: User) -> str:
    return (get_user_role_name(current_user) or "").lower()


def _require_settings_read(current_user: User):
    if _role(current_user) not in ("admin", "supervisor"):
        raise HTTPException(status_code=403, detail="No tienes acceso a configuracion")
    return current_user


def _require_settings_write(current_user: User):
    if _role(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede modificar configuracion")
    return current_user


def _settings_response(db: Session):
    system = settings_crud.get_or_create_system_settings(db)
    company = settings_crud.get_or_create_company_settings(db)
    payment_methods = settings_crud.get_payment_methods_for_settings(db)
    return {
        "id": system.id,
        "fiscal": system.fiscal,
        "series": system.series,
        "inventory": system.inventory,
        "sales": system.sales,
        "purchases": system.purchases,
        "cash": system.cash,
        "dashboard": system.dashboard,
        "reports": system.reports,
        "automations": system.automations or {},
        "company": company,
        "payment_methods": payment_methods,
    }


@router.get("", response_model=SettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_settings_read(current_user)
    return _settings_response(db)


@router.get("/runtime")
def get_runtime_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    system = settings_crud.get_or_create_system_settings(db)
    company = settings_crud.get_or_create_company_settings(db)
    return {
        "company": company,
        "fiscal": system.fiscal,
        "sales": system.sales,
        "purchases": system.purchases,
        "cash": system.cash,
        "dashboard": system.dashboard,
        "reports": system.reports,
        "automations": system.automations or {},
    }


@router.put("", response_model=SettingsResponse)
def update_settings(
    payload: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_settings_write(current_user)
    settings_crud.update_system_settings(db, payload)
    return _settings_response(db)


@router.get("/company", response_model=CompanySettingsResponse)
def get_company_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_settings_read(current_user)
    return settings_crud.get_or_create_company_settings(db)


@router.put("/company", response_model=CompanySettingsResponse)
def update_company_settings(
    payload: CompanySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_settings_write(current_user)
    return settings_crud.update_company_settings(db, payload)


@router.get("/payment-methods", response_model=list[PaymentMethodSettingsResponse])
def get_settings_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_settings_read(current_user)
    return settings_crud.get_payment_methods_for_settings(db)


@router.put("/payment-methods/{payment_method_id}", response_model=PaymentMethodSettingsResponse)
def update_settings_payment_method(
    payment_method_id: int,
    payload: PaymentMethodSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_settings_write(current_user)
    method = settings_crud.update_payment_method_settings(db, payment_method_id, payload)
    if not method:
        raise HTTPException(status_code=404, detail="Metodo de pago no encontrado")
    return method
