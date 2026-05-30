from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from database.database import get_db
from auth.security import get_current_user, get_current_admin_user, get_user_role_name
from models.model import User
from schemas.report_schema import (
    SalesReportRow, PurchasesReportRow,
    KardexReportRow, KardexDailySummaryRow, CashReportRow, AuditLogRow,
)
from schemas.client_schema import ClientCrmRow
from crud import report_crud

router = APIRouter(tags=["Reports / Exportaciones"])


# ─── Utilidad: respuesta de descarga ─────────────────────────────────────────
def _excel_response(buffer, filename: str) -> StreamingResponse:
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _pdf_response(buffer, filename: str) -> StreamingResponse:
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _csv_response(buffer, filename: str) -> StreamingResponse:
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


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
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_sales_report(db, date_from=date_from, date_to=date_to,
                                           user_id=user_id, client_id=client_id,
                                           payment_method_id=payment_method_id, limit=5000)
    buffer = report_crud.generate_sales_excel(rows)
    return _excel_response(buffer, "reporte_ventas.xlsx")


@router.get("/reports/sales/export/pdf")
def export_sales_pdf(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    client_id: Optional[int]  = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_sales_report(db, date_from=date_from, date_to=date_to,
                                           user_id=user_id, client_id=client_id,
                                           payment_method_id=payment_method_id, limit=2000)
    buffer = report_crud.generate_sales_pdf(rows)
    return _pdf_response(buffer, "reporte_ventas.pdf")


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
    status:    Optional[str]  = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_purchases_report(db, date_from=date_from, date_to=date_to,
                                               status=status, limit=5000)
    return _excel_response(report_crud.generate_purchases_excel(rows), "reporte_compras.xlsx")


@router.get("/reports/purchases/export/pdf")
def export_purchases_pdf(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    status:    Optional[str]  = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_purchases_report(db, date_from=date_from, date_to=date_to,
                                               status=status, limit=2000)
    return _pdf_response(report_crud.generate_purchases_pdf(rows), "reporte_compras.pdf")


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
    _: User = Depends(get_current_admin_user),
):
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "product_id": product_id,
        "category_id": category_id,
        "user_id": user_id,
        "payment_method_id": payment_method_id,
        "source_type": source_type,
    }
    _, rows = report_crud.get_kardex_daily_summary(db, **filters, limit=5000)
    return _excel_response(
        report_crud.generate_kardex_daily_excel(rows, filters),
        "resumen_diario_kardex.xlsx",
    )


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
    _: User = Depends(get_current_admin_user),
):
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "product_id": product_id,
        "category_id": category_id,
        "user_id": user_id,
        "payment_method_id": payment_method_id,
        "source_type": source_type,
    }
    _, rows = report_crud.get_kardex_daily_summary(db, **filters, limit=2000)
    return _pdf_response(
        report_crud.generate_kardex_daily_pdf(rows, filters),
        "resumen_diario_kardex.pdf",
    )


@router.get("/reports/kardex/export/excel")
def export_kardex_excel(
    date_from:        Optional[date] = None,
    date_to:          Optional[date] = None,
    product_id:       Optional[int]  = None,
    transaction_type: Optional[str]  = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_kardex_report(db, date_from=date_from, date_to=date_to,
                                            product_id=product_id,
                                            transaction_type=transaction_type, limit=5000)
    return _excel_response(report_crud.generate_kardex_excel(rows), "reporte_kardex.xlsx")


@router.get("/reports/kardex/export/pdf")
def export_kardex_pdf(
    date_from:        Optional[date] = None,
    date_to:          Optional[date] = None,
    product_id:       Optional[int]  = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_kardex_report(db, date_from=date_from, date_to=date_to,
                                            product_id=product_id, limit=2000)
    return _pdf_response(report_crud.generate_kardex_pdf(rows), "reporte_kardex.pdf")


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
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_cash_report(
        db, date_from=date_from, date_to=date_to,
        user_id=user_id, status=status, payment_method_id=payment_method_id,
        limit=5000,
    )
    return _excel_response(report_crud.generate_cash_excel(rows), "reporte_caja.xlsx")


@router.get("/reports/cash/export/pdf")
def export_cash_pdf(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    status:    Optional[str]  = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_cash_report(
        db, date_from=date_from, date_to=date_to,
        user_id=user_id, status=status, payment_method_id=payment_method_id,
        limit=2000,
    )
    return _pdf_response(report_crud.generate_cash_pdf(rows), "reporte_caja.pdf")


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
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_crm_report(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=user_id,
        payment_method_id=payment_method_id,
        limit=5000,
    )
    return _excel_response(report_crud.generate_crm_excel(rows), "reporte_crm.xlsx")


@router.get("/reports/crm/export/pdf")
def export_crm_pdf(
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_crm_report(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=user_id,
        payment_method_id=payment_method_id,
        limit=2000,
    )
    return _pdf_response(report_crud.generate_crm_pdf(rows), "reporte_crm.pdf")


@router.get("/reports/crm/export/csv")
def export_crm_csv(
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_crm_report(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=user_id,
        payment_method_id=payment_method_id,
        limit=5000,
    )
    return _csv_response(report_crud.generate_crm_csv(rows), "reporte_crm.csv")


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
