from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from database.database import get_db
from auth.security import get_current_user, get_current_admin_user
from models.model import User
from schemas.report_schema import (
    SalesReportRow, PurchasesReportRow,
    KardexReportRow, CashReportRow, AuditLogRow,
)
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
    _: User = Depends(get_current_user),
):
    _, rows = report_crud.get_sales_report(
        db, date_from=date_from, date_to=date_to,
        user_id=user_id, client_id=client_id,
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
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_sales_report(db, date_from=date_from, date_to=date_to,
                                           user_id=user_id, client_id=client_id, limit=5000)
    buffer = report_crud.generate_sales_excel(rows)
    return _excel_response(buffer, "reporte_ventas.xlsx")


@router.get("/reports/sales/export/pdf")
def export_sales_pdf(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    user_id:   Optional[int]  = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_sales_report(db, date_from=date_from, date_to=date_to,
                                           user_id=user_id, limit=2000)
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
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _, rows = report_crud.get_cash_report(
        db, date_from=date_from, date_to=date_to,
        user_id=user_id, status=status, skip=skip, limit=limit,
    )
    return rows


@router.get("/reports/cash/export/excel")
def export_cash_excel(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_cash_report(db, date_from=date_from, date_to=date_to, limit=5000)
    return _excel_response(report_crud.generate_cash_excel(rows), "reporte_caja.xlsx")


@router.get("/reports/cash/export/pdf")
def export_cash_pdf(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    _, rows = report_crud.get_cash_report(db, date_from=date_from, date_to=date_to, limit=2000)
    return _pdf_response(report_crud.generate_cash_pdf(rows), "reporte_caja.pdf")


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
