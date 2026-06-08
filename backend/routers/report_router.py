from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from database.database import get_db
from auth.security import get_current_user, get_current_admin_user, get_user_role_name
from models.model import User
from schemas.report_schema import (
    SalesReportRow, PurchasesReportRow,
    KardexReportRow, KardexDailySummaryRow, CashReportRow, AuditLogRow,
)
from schemas.client_schema import ClientCrmRow
from crud import report_crud
from crud.settings_crud import get_fiscal_settings, get_or_create_company_settings
from services.export_service import (
    build_csv_response,
    build_excel_response,
    build_pdf_response,
    emit_export_event,
)


def _report_company(db: Session):
    company = get_or_create_company_settings(db)
    fiscal = get_fiscal_settings(db)
    company.currency_symbol = fiscal.get("currency_symbol", "S/")
    return company


router = APIRouter(tags=["Reports / Exportaciones"])

EXPORT_COLUMNS = {
    "sales": [
        {"key": "id", "label": "#"},
        {"key": "order_date", "label": "Fecha"},
        {"key": "client_name", "label": "Cliente"},
        {"key": "seller_name", "label": "Vendedor"},
        {"key": "items_count", "label": "Items"},
        {"key": "payment_method", "label": "Metodo Pago"},
        {"key": "total_amount", "label": "Total"},
    ],
    "purchases": [
        {"key": "id", "label": "#"},
        {"key": "purchase_date", "label": "Fecha"},
        {"key": "supplier_name", "label": "Proveedor"},
        {"key": "user_name", "label": "Usuario"},
        {"key": "invoice_number", "label": "Factura"},
        {"key": "status_name", "label": "Estado"},
        {"key": "total_amount", "label": "Total"},
    ],
    "kardex": [
        {"key": "id", "label": "#"},
        {"key": "created_at", "label": "Fecha"},
        {"key": "product_name", "label": "Producto"},
        {"key": "transaction_type", "label": "Tipo"},
        {"key": "concept", "label": "Concepto"},
        {"key": "quantity", "label": "Cant."},
        {"key": "balance_stock", "label": "Saldo"},
        {"key": "balance_value", "label": "Valor"},
        {"key": "username", "label": "Usuario"},
    ],
    "kardex_daily": [
        {"key": "date", "label": "Fecha"},
        {"key": "stock_entries", "label": "Entradas Stock"},
        {"key": "stock_outputs", "label": "Salidas Stock"},
        {"key": "stock_adjustments", "label": "Ajustes"},
        {"key": "net_stock_movement", "label": "Saldo Neto"},
        {"key": "sales_count", "label": "Ventas"},
        {"key": "sales_amount", "label": "Monto Vendido"},
    ],
    "cash": [
        {"key": "id", "label": "#"},
        {"key": "username", "label": "Usuario"},
        {"key": "opening_time", "label": "Apertura"},
        {"key": "closing_time", "label": "Cierre"},
        {"key": "opening_amount", "label": "Fondo Inicial"},
        {"key": "expected_amount", "label": "Esperado"},
        {"key": "closing_amount", "label": "Contado"},
        {"key": "difference", "label": "Diferencia"},
        {"key": "status", "label": "Estado"},
    ],
    "crm": [
        {"key": "full_name", "label": "Cliente"},
        {"key": "dni", "label": "DNI"},
        {"key": "segment", "label": "Segmento"},
        {"key": "recency_days", "label": "Recency"},
        {"key": "frequency", "label": "Frecuencia"},
        {"key": "monetary", "label": "Monetary"},
        {"key": "last_purchase", "label": "Ultima compra"},
    ],
    "audit": [
        {"key": "id", "label": "#"},
        {"key": "created_at", "label": "Fecha"},
        {"key": "username", "label": "Usuario"},
        {"key": "module", "label": "Modulo"},
        {"key": "action", "label": "Accion"},
        {"key": "entity", "label": "Entidad"},
        {"key": "entity_id", "label": "ID"},
        {"key": "description", "label": "Descripcion"},
    ],
}


def _filename(module: str, format: str) -> str:
    stamp = datetime.now().strftime("%Y%m%d")
    return f"{module}_{stamp}.{format}"


def _sum_total(rows: list, key: str) -> dict:
    return {key: sum(float((r.get(key) if isinstance(r, dict) else getattr(r, key, 0)) or 0) for r in rows)}


def _export(module: str, format: str, rows: list, filters: dict, current_user: User, db: Session, title: str, totals: dict | None = None):
    filename = _filename(module, format)
    emit_export_event(module, format, filename, filters, current_user.username if current_user else "")
    columns = EXPORT_COLUMNS[module]
    if format == "csv":
        return build_csv_response(rows, columns, filename)
    if format == "excel":
        return build_excel_response(rows, columns, filename, title, module.replace("_", " ").title(), totals=totals)
    return build_pdf_response(rows, columns, filename, title, filters=filters, company=_report_company(db), totals=totals)

# ══════════════════════════════════════════════════════════════
# VENTAS
# ══════════════════════════════════════════════════════════════
@router.get("/reports/sales", response_model=List[SalesReportRow])
def sales_report(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    client_id: Optional[int]  = None,
    payment_method_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    _, rows = report_crud.get_sales_report(
        db, date_from=date_from, date_to=date_to,
        user_id=effective_user_id, client_id=client_id,
        payment_method_id=payment_method_id,
        skip=skip, limit=limit,
    )
    return rows


@router.get("/reports/sales/export/excel")
def export_sales_excel(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    client_id: Optional[int]  = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "user_id": effective_user_id,
        "client_id": client_id,
        "payment_method_id": payment_method_id,
    }
    _, rows = report_crud.get_sales_report(db, date_from=date_from, date_to=date_to,
                                           user_id=effective_user_id, client_id=client_id,
                                           payment_method_id=payment_method_id, limit=5000)
    return _export("sales", "excel", rows, filters, current_user, db, "Reporte de Ventas", totals=_sum_total(rows, "total_amount"))


@router.get("/reports/sales/export/pdf")
def export_sales_pdf(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    client_id: Optional[int]  = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "user_id": effective_user_id,
        "client_id": client_id,
        "payment_method_id": payment_method_id,
    }
    _, rows = report_crud.get_sales_report(db, date_from=date_from, date_to=date_to,
                                           user_id=effective_user_id, client_id=client_id,
                                           payment_method_id=payment_method_id, limit=2000)
    return _export("sales", "pdf", rows, filters, current_user, db, "Reporte de Ventas", totals=_sum_total(rows, "total_amount"))


@router.get("/reports/sales/export/csv")
def export_sales_csv(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    client_id: Optional[int]  = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "user_id": effective_user_id,
        "client_id": client_id,
        "payment_method_id": payment_method_id,
    }
    _, rows = report_crud.get_sales_report(
        db, date_from=date_from, date_to=date_to,
        user_id=effective_user_id, client_id=client_id,
        payment_method_id=payment_method_id, limit=10000,
    )
    return _export("sales", "csv", rows, filters, current_user, db, "Reporte de Ventas", totals=_sum_total(rows, "total_amount"))


# ══════════════════════════════════════════════════════════════
# COMPRAS
# ══════════════════════════════════════════════════════════════
@router.get("/reports/purchases", response_model=List[PurchasesReportRow])
def purchases_report(
    date_from:   Optional[date] = None,
    date_to:     Optional[date] = None,
    supplier_id: Optional[int]  = None,
    user_id:     Optional[int]  = None,
    status:      Optional[str]  = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _, rows = report_crud.get_purchases_report(
        db, date_from=date_from, date_to=date_to,
        supplier_id=supplier_id, user_id=user_id,
        status=status, skip=skip, limit=limit,
    )
    return rows


@router.get("/reports/purchases/export/excel")
def export_purchases_excel(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    supplier_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status:    Optional[str]  = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = {"date_from": date_from, "date_to": date_to, "supplier_id": supplier_id, "user_id": user_id, "status": status}
    _, rows = report_crud.get_purchases_report(db, date_from=date_from, date_to=date_to,
                                               supplier_id=supplier_id, user_id=user_id,
                                               status=status, limit=5000)
    return _export("purchases", "excel", rows, filters, current_user, db, "Reporte de Compras", totals=_sum_total(rows, "total_amount"))


@router.get("/reports/purchases/export/pdf")
def export_purchases_pdf(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    supplier_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status:    Optional[str]  = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = {"date_from": date_from, "date_to": date_to, "supplier_id": supplier_id, "user_id": user_id, "status": status}
    _, rows = report_crud.get_purchases_report(db, date_from=date_from, date_to=date_to,
                                               supplier_id=supplier_id, user_id=user_id,
                                               status=status, limit=2000)
    return _export("purchases", "pdf", rows, filters, current_user, db, "Reporte de Compras", totals=_sum_total(rows, "total_amount"))


@router.get("/reports/purchases/export/csv")
def export_purchases_csv(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    supplier_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status:    Optional[str]  = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = {"date_from": date_from, "date_to": date_to, "supplier_id": supplier_id, "user_id": user_id, "status": status}
    _, rows = report_crud.get_purchases_report(
        db, date_from=date_from, date_to=date_to,
        supplier_id=supplier_id, user_id=user_id,
        status=status, limit=10000,
    )
    return _export("purchases", "csv", rows, filters, current_user, db, "Reporte de Compras", totals=_sum_total(rows, "total_amount"))


# ══════════════════════════════════════════════════════════════
# KARDEX
# ══════════════════════════════════════════════════════════════
@router.get("/reports/kardex", response_model=List[KardexReportRow])
def kardex_report(
    date_from:        Optional[date] = None,
    date_to:          Optional[date] = None,
    product_id:       Optional[int]  = None,
    transaction_type: Optional[str]  = None,
    user_id:          Optional[int]  = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _, rows = report_crud.get_kardex_report(
        db, date_from=date_from, date_to=date_to,
        product_id=product_id, transaction_type=transaction_type,
        user_id=user_id, skip=skip, limit=limit,
    )
    return rows


@router.get("/reports/kardex/daily-summary", response_model=List[KardexDailySummaryRow])
def kardex_daily_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    source_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    _, rows = report_crud.get_kardex_daily_summary(
        db,
        date_from=date_from,
        date_to=date_to,
        product_id=product_id,
        category_id=category_id,
        user_id=effective_user_id,
        payment_method_id=payment_method_id,
        source_type=source_type,
        skip=skip,
        limit=limit,
    )
    return rows


@router.get("/reports/kardex/daily-summary/export/excel")
def export_kardex_daily_excel(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    source_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "product_id": product_id,
        "category_id": category_id,
        "user_id": effective_user_id,
        "payment_method_id": payment_method_id,
        "source_type": source_type,
    }
    _, rows = report_crud.get_kardex_daily_summary(db, **filters, limit=5000)
    return _export("kardex_daily", "excel", rows, filters, current_user, db, "Resumen Diario Kardex", totals=_sum_total(rows, "sales_amount"))


@router.get("/reports/kardex/daily-summary/export/pdf")
def export_kardex_daily_pdf(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    source_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "product_id": product_id,
        "category_id": category_id,
        "user_id": effective_user_id,
        "payment_method_id": payment_method_id,
        "source_type": source_type,
    }
    _, rows = report_crud.get_kardex_daily_summary(db, **filters, limit=2000)
    return _export("kardex_daily", "pdf", rows, filters, current_user, db, "Resumen Diario Kardex", totals=_sum_total(rows, "sales_amount"))


@router.get("/reports/kardex/daily-summary/export/csv")
def export_kardex_daily_csv(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    source_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "product_id": product_id,
        "category_id": category_id,
        "user_id": effective_user_id,
        "payment_method_id": payment_method_id,
        "source_type": source_type,
    }
    _, rows = report_crud.get_kardex_daily_summary(db, **filters, limit=10000)
    return _export("kardex_daily", "csv", rows, filters, current_user, db, "Resumen Diario Kardex", totals=_sum_total(rows, "sales_amount"))


@router.get("/reports/kardex/export/excel")
def export_kardex_excel(
    date_from:        Optional[date] = None,
    date_to:          Optional[date] = None,
    product_id:       Optional[int]  = None,
    transaction_type: Optional[str]  = None,
    user_id:          Optional[int]  = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"date_from": date_from, "date_to": date_to, "product_id": product_id, "transaction_type": transaction_type, "user_id": effective_user_id}
    _, rows = report_crud.get_kardex_report(db, date_from=date_from, date_to=date_to,
                                            product_id=product_id,
                                            transaction_type=transaction_type,
                                            user_id=effective_user_id, limit=5000)
    return _export("kardex", "excel", rows, filters, current_user, db, "Reporte Kardex")


@router.get("/reports/kardex/export/pdf")
def export_kardex_pdf(
    date_from:        Optional[date] = None,
    date_to:          Optional[date] = None,
    product_id:       Optional[int]  = None,
    transaction_type: Optional[str]  = None,
    user_id:          Optional[int]  = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"date_from": date_from, "date_to": date_to, "product_id": product_id, "transaction_type": transaction_type, "user_id": effective_user_id}
    _, rows = report_crud.get_kardex_report(db, date_from=date_from, date_to=date_to,
                                            product_id=product_id,
                                            transaction_type=transaction_type,
                                            user_id=effective_user_id, limit=2000)
    return _export("kardex", "pdf", rows, filters, current_user, db, "Reporte Kardex")


@router.get("/reports/kardex/export/csv")
def export_kardex_csv(
    date_from:        Optional[date] = None,
    date_to:          Optional[date] = None,
    product_id:       Optional[int]  = None,
    transaction_type: Optional[str]  = None,
    user_id:          Optional[int]  = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"date_from": date_from, "date_to": date_to, "product_id": product_id, "transaction_type": transaction_type, "user_id": effective_user_id}
    _, rows = report_crud.get_kardex_report(
        db, date_from=date_from, date_to=date_to,
        product_id=product_id, transaction_type=transaction_type,
        user_id=effective_user_id, limit=10000,
    )
    return _export("kardex", "csv", rows, filters, current_user, db, "Reporte Kardex")


# ══════════════════════════════════════════════════════════════
# CAJA
# ══════════════════════════════════════════════════════════════
@router.get("/reports/cash", response_model=List[CashReportRow])
def cash_report(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    status:    Optional[str]  = None,
    payment_method_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    _, rows = report_crud.get_cash_report(
        db, date_from=date_from, date_to=date_to,
        user_id=effective_user_id, status=status, payment_method_id=payment_method_id,
        skip=skip, limit=limit,
    )
    return rows


@router.get("/reports/cash/export/excel")
def export_cash_excel(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    status:    Optional[str]  = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"date_from": date_from, "date_to": date_to, "user_id": effective_user_id, "status": status, "payment_method_id": payment_method_id}
    _, rows = report_crud.get_cash_report(
        db, date_from=date_from, date_to=date_to,
        user_id=effective_user_id, status=status, payment_method_id=payment_method_id,
        limit=5000,
    )
    return _export("cash", "excel", rows, filters, current_user, db, "Reporte de Caja", totals=_sum_total(rows, "opening_amount"))


@router.get("/reports/cash/export/pdf")
def export_cash_pdf(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    status:    Optional[str]  = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"date_from": date_from, "date_to": date_to, "user_id": effective_user_id, "status": status, "payment_method_id": payment_method_id}
    _, rows = report_crud.get_cash_report(
        db, date_from=date_from, date_to=date_to,
        user_id=effective_user_id, status=status, payment_method_id=payment_method_id,
        limit=2000,
    )
    return _export("cash", "pdf", rows, filters, current_user, db, "Reporte de Caja", totals=_sum_total(rows, "opening_amount"))


@router.get("/reports/cash/export/csv")
def export_cash_csv(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    status:    Optional[str]  = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"date_from": date_from, "date_to": date_to, "user_id": effective_user_id, "status": status, "payment_method_id": payment_method_id}
    _, rows = report_crud.get_cash_report(
        db, date_from=date_from, date_to=date_to,
        user_id=effective_user_id, status=status, payment_method_id=payment_method_id,
        limit=10000,
    )
    return _export("cash", "csv", rows, filters, current_user, db, "Reporte de Caja", totals=_sum_total(rows, "opening_amount"))


# CRM
@router.get("/reports/crm", response_model=List[ClientCrmRow])
def crm_report(
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    _, rows = report_crud.get_crm_report(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=effective_user_id,
        payment_method_id=payment_method_id,
        skip=skip,
        limit=limit,
    )
    return rows


@router.get("/reports/crm/export/excel")
def export_crm_excel(
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"segment": segment, "date_from": date_from, "date_to": date_to, "user_id": effective_user_id, "payment_method_id": payment_method_id}
    _, rows = report_crud.get_crm_report(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=effective_user_id,
        payment_method_id=payment_method_id,
        limit=5000,
    )
    return _export("crm", "excel", rows, filters, current_user, db, "Reporte CRM Clientes", totals=_sum_total(rows, "monetary"))


@router.get("/reports/crm/export/pdf")
def export_crm_pdf(
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"segment": segment, "date_from": date_from, "date_to": date_to, "user_id": effective_user_id, "payment_method_id": payment_method_id}
    _, rows = report_crud.get_crm_report(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=effective_user_id,
        payment_method_id=payment_method_id,
        limit=2000,
    )
    return _export("crm", "pdf", rows, filters, current_user, db, "Reporte CRM Clientes", totals=_sum_total(rows, "monetary"))


@router.get("/reports/crm/export/csv")
def export_crm_csv(
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    filters = {"segment": segment, "date_from": date_from, "date_to": date_to, "user_id": effective_user_id, "payment_method_id": payment_method_id}
    _, rows = report_crud.get_crm_report(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=effective_user_id,
        payment_method_id=payment_method_id,
        limit=5000,
    )
    return _export("crm", "csv", rows, filters, current_user, db, "Reporte CRM Clientes", totals=_sum_total(rows, "monetary"))


# ══════════════════════════════════════════════════════════════
# AUDITORÍA (admin only)
# ══════════════════════════════════════════════════════════════
@router.get("/audit/logs", response_model=List[AuditLogRow])
def audit_logs(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    module:    Optional[str]  = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_audit_logs(
        db, date_from=date_from, date_to=date_to,
        user_id=user_id, module=module, skip=skip, limit=limit,
    )
    return rows


@router.get("/audit/logs/export/csv")
def export_audit_csv(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    module:    Optional[str]  = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    filters = {"date_from": date_from, "date_to": date_to, "user_id": user_id, "module": module}
    _, rows = report_crud.get_audit_logs(
        db, date_from=date_from, date_to=date_to,
        user_id=user_id, module=module, limit=10000,
    )
    return _export("audit", "csv", rows, filters, current_user, db, "Logs de Auditoria")


@router.post("/reports/export/event")
def register_export_event(payload: dict, current_user: User = Depends(get_current_user)):
    emit_export_event(
        module=str(payload.get("module") or "unknown"),
        format=str(payload.get("format") or ""),
        filename=str(payload.get("filename") or ""),
        filters=payload.get("filters") or {},
        generated_by=current_user.username if current_user else "",
    )
    return {"ok": True}
