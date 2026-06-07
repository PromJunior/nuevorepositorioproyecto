import re
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from auth.security import get_current_admin_user, get_current_user, get_user_role_name
from crud import report_crud
from crud.settings_crud import get_or_create_company_settings, get_or_create_system_settings
from database.database import get_db
from models.model import (
    CashSession,
    Client,
    DriveExportLog,
    ExportTracking,
    InventoryTransaction,
    Order,
    OrderItem,
    Product,
    Purchase,
    PurchaseItem,
    Supplier,
    SystemSettings,
    User,
)
from services.export_service import build_csv_content, emit_export_event, export_clients_csv

router = APIRouter(prefix="/exports", tags=["Exportaciones"])

MAX_EXPORT_ROWS = 10000


class UploadExportRequest(BaseModel):
    module: str = Field(..., min_length=1)
    format: str = Field("csv", min_length=1)
    filename: str | None = None
    emit_event: bool = True
    incremental: bool = False


class ResetExportTrackingRequest(BaseModel):
    module: str = Field(..., min_length=1)


DAILY_MODULES = {
    "sales",
    "sales_items",
    "purchases",
    "purchase_items",
    "inventory_movements",
    "cash_sessions",
    "clients",
    "clients_delta",
}
WEEKLY_MODULES = {"products_snapshot", "suppliers_snapshot", "settings_snapshot"}
MODULE_FOLDERS = {
    "sales": "sales",
    "sales_items": "sales",
    "purchases": "purchases",
    "purchase_items": "purchases",
    "inventory_movements": "inventory",
    "cash_sessions": "cash",
    "clients": "clients",
    "clients_delta": "clients",
    "products_snapshot": "snapshots",
    "suppliers_snapshot": "snapshots",
    "settings_snapshot": "snapshots",
    "inventory": "inventory",
    "cash": "cash",
}
MODULE_ALIASES = {
    "crm": "clients",
    "kardex": "inventory",
    "inventory_movements": "inventory",
    "cash_sessions": "cash",
}
MODULE_EXPORT_TARGETS = {
    "inventory": "inventory_movements",
    "cash": "cash_sessions",
}
INCREMENTAL_MODULES = {"sales", "purchases", "inventory", "cash"}

EXPORT_COLUMNS = {
    "sales": [
        {"key": "id", "label": "ID"},
        {"key": "document_number", "label": "Documento"},
        {"key": "order_date", "label": "Fecha"},
        {"key": "client_name", "label": "Cliente"},
        {"key": "seller_name", "label": "Vendedor"},
        {"key": "items_count", "label": "Items"},
        {"key": "payment_method", "label": "Metodo Pago"},
        {"key": "total_amount", "label": "Total"},
    ],
    "sales_items": [
        {"key": "order_id", "label": "Venta ID"},
        {"key": "document_number", "label": "Documento"},
        {"key": "order_date", "label": "Fecha"},
        {"key": "product_id", "label": "Producto ID"},
        {"key": "product_name", "label": "Producto"},
        {"key": "quantity", "label": "Cantidad"},
        {"key": "price", "label": "Precio"},
        {"key": "sub_amount", "label": "Subtotal"},
    ],
    "purchases": [
        {"key": "id", "label": "ID"},
        {"key": "document_number", "label": "Documento"},
        {"key": "purchase_date", "label": "Fecha"},
        {"key": "supplier_name", "label": "Proveedor"},
        {"key": "user_name", "label": "Usuario"},
        {"key": "invoice_number", "label": "Factura"},
        {"key": "items_count", "label": "Items"},
        {"key": "status_name", "label": "Estado"},
        {"key": "total_amount", "label": "Total"},
    ],
    "purchase_items": [
        {"key": "purchase_id", "label": "Compra ID"},
        {"key": "document_number", "label": "Documento"},
        {"key": "purchase_date", "label": "Fecha"},
        {"key": "product_id", "label": "Producto ID"},
        {"key": "product_name", "label": "Producto"},
        {"key": "quantity", "label": "Cantidad"},
        {"key": "unit_cost", "label": "Costo Unitario"},
        {"key": "sub_amount", "label": "Subtotal"},
    ],
    "inventory_movements": [
        {"key": "id", "label": "ID"},
        {"key": "created_at", "label": "Fecha"},
        {"key": "product_id", "label": "Producto ID"},
        {"key": "product_name", "label": "Producto"},
        {"key": "transaction_type", "label": "Tipo"},
        {"key": "concept", "label": "Concepto"},
        {"key": "quantity", "label": "Cantidad"},
        {"key": "unit_cost", "label": "Costo Unitario"},
        {"key": "balance_stock", "label": "Saldo Stock"},
        {"key": "balance_value", "label": "Saldo Valor"},
        {"key": "username", "label": "Usuario"},
        {"key": "source_type", "label": "Origen"},
        {"key": "source_id", "label": "Origen ID"},
    ],
    "cash_sessions": [
        {"key": "id", "label": "ID"},
        {"key": "username", "label": "Usuario"},
        {"key": "opening_time", "label": "Apertura"},
        {"key": "closing_time", "label": "Cierre"},
        {"key": "opening_amount", "label": "Fondo Inicial"},
        {"key": "expected_amount", "label": "Esperado"},
        {"key": "closing_amount", "label": "Contado"},
        {"key": "difference", "label": "Diferencia"},
        {"key": "status", "label": "Estado"},
    ],
    "clients_delta": [
        {"key": "id", "label": "ID"},
        {"key": "dni", "label": "DNI"},
        {"key": "full_name", "label": "Cliente"},
        {"key": "email", "label": "Email"},
        {"key": "phone", "label": "Telefono"},
        {"key": "address", "label": "Direccion"},
        {"key": "is_active", "label": "Activo"},
        {"key": "create_at", "label": "Creado"},
    ],
    "products_snapshot": [
        {"key": "id", "label": "ID"},
        {"key": "name_product", "label": "Producto"},
        {"key": "category_name", "label": "Categoria"},
        {"key": "price", "label": "Precio"},
        {"key": "stock", "label": "Stock"},
        {"key": "is_active", "label": "Activo"},
    ],
    "suppliers_snapshot": [
        {"key": "id", "label": "ID"},
        {"key": "ruc", "label": "RUC"},
        {"key": "company_name", "label": "Proveedor"},
        {"key": "phone", "label": "Telefono"},
        {"key": "email", "label": "Email"},
        {"key": "created_at", "label": "Creado"},
    ],
    "settings_snapshot": [
        {"key": "section", "label": "Seccion"},
        {"key": "key", "label": "Clave"},
        {"key": "value", "label": "Valor"},
    ],
}


def _date_from_filename(filename: str | None) -> date | None:
    if not filename:
        return None
    match = re.search(r"_(\d{8})\.csv$", filename)
    if not match:
        return None
    return datetime.strptime(match.group(1), "%Y%m%d").date()


def _safe_filename(module: str, filename: str | None) -> str:
    if filename:
        clean = filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].strip()
        if module == "clients" and re.fullmatch(r"(crm|clients_\d{8})\.csv", clean):
            return clean
        if module != "clients" and clean and clean.endswith(".csv"):
            return clean
    today = datetime.now()
    if module in WEEKLY_MODULES:
        return f"{module}_{today.strftime('%G%V')}.csv"
    return f"{module}_{today.strftime('%Y%m%d')}.csv"


def _date_filters(module: str, filename: str | None) -> dict[str, date] | dict:
    export_date = _date_from_filename(filename)
    if not export_date or module in WEEKLY_MODULES:
        return {}
    return {"date_from": export_date, "date_to": export_date}


def _query_sales_items(db: Session, filters: dict[str, date]) -> list[dict[str, Any]]:
    query = (
        db.query(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .options(joinedload(OrderItem.order), joinedload(OrderItem.product))
    )
    if filters.get("date_from"):
        query = query.filter(Order.order_date >= datetime.combine(filters["date_from"], datetime.min.time()))
    if filters.get("date_to"):
        query = query.filter(Order.order_date <= datetime.combine(filters["date_to"], datetime.max.time()))
    return [
        {
            "order_id": item.order_id,
            "document_number": item.order.document_number if item.order else "",
            "order_date": item.order.order_date if item.order else None,
            "product_id": item.product_id,
            "product_name": item.product.name_product if item.product else "",
            "quantity": item.quantity,
            "price": item.price,
            "sub_amount": item.sub_amount,
        }
        for item in query.order_by(Order.order_date.desc(), OrderItem.id.asc()).limit(MAX_EXPORT_ROWS).all()
    ]


def _query_purchase_items(db: Session, filters: dict[str, date]) -> list[dict[str, Any]]:
    query = (
        db.query(PurchaseItem)
        .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
        .options(joinedload(PurchaseItem.purchase), joinedload(PurchaseItem.product))
    )
    if filters.get("date_from"):
        query = query.filter(Purchase.purchase_date >= datetime.combine(filters["date_from"], datetime.min.time()))
    if filters.get("date_to"):
        query = query.filter(Purchase.purchase_date <= datetime.combine(filters["date_to"], datetime.max.time()))
    return [
        {
            "purchase_id": item.purchase_id,
            "document_number": item.purchase.document_number if item.purchase else "",
            "purchase_date": item.purchase.purchase_date if item.purchase else None,
            "product_id": item.product_id,
            "product_name": item.product.name_product if item.product else "",
            "quantity": item.quantity,
            "unit_cost": item.unit_cost,
            "sub_amount": item.sub_amount,
        }
        for item in query.order_by(Purchase.purchase_date.desc(), PurchaseItem.id.asc()).limit(MAX_EXPORT_ROWS).all()
    ]


def _query_clients_delta(db: Session, filters: dict[str, date]) -> list[Client]:
    query = db.query(Client)
    if filters.get("date_from"):
        query = query.filter(Client.create_at >= datetime.combine(filters["date_from"], datetime.min.time()))
    if filters.get("date_to"):
        query = query.filter(Client.create_at <= datetime.combine(filters["date_to"], datetime.max.time()))
    return query.order_by(Client.create_at.desc(), Client.id.desc()).limit(MAX_EXPORT_ROWS).all()


def _query_clients(db: Session) -> list[Client]:
    return db.query(Client).order_by(Client.create_at.desc(), Client.id.desc()).limit(MAX_EXPORT_ROWS).all()


def _settings_rows(company: Any, system: SystemSettings) -> list[dict[str, Any]]:
    rows = []
    company_fields = ["legal_name", "trade_name", "ruc", "address", "phone", "email", "primary_currency"]
    for key in company_fields:
        rows.append({"section": "company", "key": key, "value": getattr(company, key, "")})
    for section in ["fiscal", "series", "inventory", "sales", "purchases", "cash", "dashboard", "reports", "automations"]:
        for key, value in (getattr(system, section) or {}).items():
            rows.append({"section": section, "key": key, "value": value})
    return rows


def _canonical_module(module: str) -> str:
    normalized = module.strip().lower()
    return MODULE_ALIASES.get(normalized, normalized)


def _export_module(module: str) -> str:
    return MODULE_EXPORT_TARGETS.get(module, module)


def _tracking_to_dict(tracking: ExportTracking) -> dict[str, Any]:
    return {
        "module": tracking.module,
        "last_exported_id": tracking.last_exported_id,
        "last_exported_at": tracking.last_exported_at,
        "last_filename": tracking.last_filename,
        "last_rows_count": tracking.last_rows_count,
        "status": tracking.status,
        "created_at": tracking.created_at,
        "updated_at": tracking.updated_at,
    }


def _get_or_create_tracking(db: Session, module: str) -> ExportTracking:
    tracking = db.query(ExportTracking).filter(ExportTracking.module == module).first()
    if tracking:
        return tracking

    tracking = ExportTracking(module=module, status="PENDING")
    db.add(tracking)
    db.flush()
    return tracking


def _row_id(row: Any) -> int:
    if isinstance(row, dict):
        return int(row.get("id") or 0)
    return int(getattr(row, "id", 0) or 0)


def _log_export(
    db: Session,
    *,
    module: str,
    filename: str,
    incremental: bool,
    rows_count: int,
    last_exported_id: int | None,
    status_value: str,
    message: str | None = None,
) -> DriveExportLog:
    log = DriveExportLog(
        filename=filename,
        module=module,
        incremental=incremental,
        rows_count=rows_count,
        last_exported_id=last_exported_id,
        status=status_value.upper(),
        message=(message or "")[:500],
    )
    db.add(log)
    return log


def _sales_rows_after_id(db: Session, last_id: int) -> list[dict[str, Any]]:
    rows = (
        db.query(Order)
        .options(
            joinedload(Order.client),
            joinedload(Order.user),
            joinedload(Order.payment_order),
            joinedload(Order.order_items_order),
        )
        .filter(Order.id > last_id)
        .order_by(Order.id.asc())
        .limit(MAX_EXPORT_ROWS)
        .all()
    )
    result = []
    for order in rows:
        payment_method = None
        if order.payment_order:
            payment = order.payment_order[0]
            payment_method = payment.payment_method.name_payment_method if payment.payment_method else None
        result.append({
            "id": order.id,
            "document_number": order.document_number,
            "order_date": order.order_date,
            "client_name": order.client.full_name if order.client else "Venta Mostrador",
            "seller_name": order.user.username if order.user else f"User#{order.user_id}",
            "items_count": len(order.order_items_order),
            "payment_method": payment_method,
            "total_amount": order.total_amount,
        })
    return result


def _purchase_rows_after_id(db: Session, last_id: int) -> list[dict[str, Any]]:
    rows = (
        db.query(Purchase)
        .options(
            joinedload(Purchase.supplier),
            joinedload(Purchase.user),
            joinedload(Purchase.status),
            joinedload(Purchase.purchase_items),
        )
        .filter(Purchase.id > last_id)
        .order_by(Purchase.id.asc())
        .limit(MAX_EXPORT_ROWS)
        .all()
    )
    return [
        {
            "id": purchase.id,
            "document_number": purchase.document_number,
            "purchase_date": purchase.purchase_date,
            "supplier_name": purchase.supplier.company_name if purchase.supplier else f"Prov#{purchase.supplier_id}",
            "user_name": purchase.user.username if purchase.user else f"User#{purchase.user_id}",
            "invoice_number": purchase.invoice_number,
            "items_count": len(purchase.purchase_items),
            "status_name": purchase.status.name_status if purchase.status else None,
            "total_amount": purchase.total_amount,
        }
        for purchase in rows
    ]


def _inventory_rows_after_id(db: Session, last_id: int) -> list[dict[str, Any]]:
    rows = (
        db.query(InventoryTransaction)
        .options(
            joinedload(InventoryTransaction.product).joinedload(Product.category),
            joinedload(InventoryTransaction.user),
            joinedload(InventoryTransaction.transaction_type),
        )
        .filter(InventoryTransaction.id > last_id)
        .order_by(InventoryTransaction.id.asc())
        .limit(MAX_EXPORT_ROWS)
        .all()
    )
    return [
        {
            "id": tx.id,
            "created_at": tx.created_at,
            "product_id": tx.product_id,
            "product_name": tx.product.name_product if tx.product else f"Producto #{tx.product_id}",
            "transaction_type": tx.transaction_type.name if tx.transaction_type else "DESCONOCIDO",
            "concept": tx.concept,
            "quantity": tx.quantity,
            "unit_cost": tx.unit_cost,
            "balance_stock": tx.balance_stock,
            "balance_value": tx.balance_value,
            "username": tx.user.username if tx.user else f"Usuario #{tx.user_id}",
            "source_type": tx.source_type,
            "source_id": tx.source_id,
        }
        for tx in rows
    ]


def _cash_rows_after_id(db: Session, last_id: int) -> list[dict[str, Any]]:
    rows = (
        db.query(CashSession)
        .options(joinedload(CashSession.user))
        .filter(CashSession.id > last_id)
        .order_by(CashSession.id.asc())
        .limit(MAX_EXPORT_ROWS)
        .all()
    )
    return [
        {
            "id": session.id,
            "username": session.user.username if session.user else f"User#{session.user_id}",
            "opening_time": session.opening_time,
            "closing_time": session.closing_time,
            "opening_amount": session.opening_amount,
            "expected_amount": session.expected_amount,
            "closing_amount": session.closing_amount,
            "difference": session.difference,
            "status": session.status,
        }
        for session in rows
    ]


def _incremental_rows_for_module(db: Session, module: str, last_id: int) -> list[dict[str, Any]]:
    if module == "sales":
        return _sales_rows_after_id(db, last_id)
    if module == "purchases":
        return _purchase_rows_after_id(db, last_id)
    if module == "inventory":
        return _inventory_rows_after_id(db, last_id)
    if module == "cash":
        return _cash_rows_after_id(db, last_id)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Modulo incremental no soportado")


def require_export_tracking_viewer(current_user: User = Depends(get_current_user)):
    role_name = (get_user_role_name(current_user) or "").lower()
    if role_name not in {"admin", "supervisor"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver el tracking de exportaciones",
        )
    return current_user


def _rows_for_module(db: Session, module: str, filters: dict[str, date]) -> list[Any]:
    if module == "sales":
        _, rows = report_crud.get_sales_report(db, **filters, limit=MAX_EXPORT_ROWS)
        return rows
    if module == "sales_items":
        return _query_sales_items(db, filters)
    if module == "purchases":
        _, rows = report_crud.get_purchases_report(db, **filters, limit=MAX_EXPORT_ROWS)
        return rows
    if module == "purchase_items":
        return _query_purchase_items(db, filters)
    if module == "inventory_movements":
        _, rows = report_crud.get_kardex_report(db, **filters, limit=MAX_EXPORT_ROWS)
        return rows
    if module == "cash_sessions":
        _, rows = report_crud.get_cash_report(db, **filters, limit=MAX_EXPORT_ROWS)
        return rows
    if module == "clients":
        return _query_clients(db)
    if module == "clients_delta":
        return _query_clients_delta(db, filters)
    if module == "products_snapshot":
        return [
            {
                "id": product.id,
                "name_product": product.name_product,
                "category_name": product.category.name_category if product.category else "",
                "price": product.price,
                "stock": product.stock,
                "is_active": product.is_active,
            }
            for product in db.query(Product).options(joinedload(Product.category)).order_by(Product.name_product.asc()).limit(MAX_EXPORT_ROWS).all()
        ]
    if module == "suppliers_snapshot":
        return db.query(Supplier).order_by(Supplier.company_name.asc()).limit(MAX_EXPORT_ROWS).all()
    if module == "settings_snapshot":
        return _settings_rows(get_or_create_company_settings(db), get_or_create_system_settings(db))
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Modulo de exportacion no soportado")


@router.post("/upload")
def upload_export_csv(
    payload: UploadExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    requested_module = payload.module.strip().lower()
    module = _canonical_module(payload.module)
    export_module = _export_module(module)
    export_format = payload.format.strip().lower()
    if export_format != "csv":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se permite format=csv")
    if export_module not in DAILY_MODULES | WEEKLY_MODULES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Modulo de exportacion no soportado")
    if payload.incremental and module not in INCREMENTAL_MODULES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Modulo incremental no soportado")

    filename_module = requested_module if requested_module in DAILY_MODULES | WEEKLY_MODULES else module
    filename = _safe_filename(filename_module, payload.filename)
    filters = _date_filters(export_module, filename)

    try:
        tracking = None
        last_exported_id = None
        if payload.incremental:
            tracking = _get_or_create_tracking(db, module)
            last_id = int(tracking.last_exported_id or 0)
            rows = _incremental_rows_for_module(db, module, last_id)
        else:
            rows = _rows_for_module(db, export_module, filters)

        csv_content = export_clients_csv(rows) if export_module == "clients" else build_csv_content(rows, EXPORT_COLUMNS[export_module])
        last_exported_id = max((_row_id(row) for row in rows), default=(tracking.last_exported_id if tracking else None))

        if tracking:
            tracking.last_exported_at = datetime.utcnow()
            tracking.last_filename = filename
            tracking.last_rows_count = len(rows)
            tracking.status = "OK" if rows else "EMPTY"
            if rows:
                tracking.last_exported_id = int(last_exported_id or 0)
            tracking.updated_at = datetime.utcnow()

        _log_export(
            db,
            module=module,
            filename=filename,
            incremental=payload.incremental,
            rows_count=len(rows),
            last_exported_id=int(last_exported_id or 0) if last_exported_id is not None else None,
            status_value="OK" if rows else "EMPTY",
            message="CSV generado para Google Drive" if rows else "CSV generado sin registros nuevos",
        )
        db.commit()
        if tracking:
            db.refresh(tracking)
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        try:
            _log_export(
                db,
                module=module,
                filename=filename,
                incremental=payload.incremental,
                rows_count=0,
                last_exported_id=None,
                status_value="ERROR",
                message=str(exc),
            )
            db.commit()
        except Exception:
            db.rollback()
        raise

    if payload.emit_event:
        emit_export_event(
            module=module,
            format=export_format,
            filename=filename,
            filters={
                **filters,
                "drive_root": "ERP_BACKUPS",
                "drive_folder": MODULE_FOLDERS[module],
                "export_endpoint": "/exports/upload",
                "emit_event": False,
                "incremental": payload.incremental,
            },
            generated_by=current_user.username if current_user else "",
        )

    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "X-ERP-Export-Module": module,
            "X-ERP-Drive-Folder": MODULE_FOLDERS[module],
            "X-ERP-Row-Count": str(len(rows)),
            "X-ERP-Incremental": str(payload.incremental).lower(),
            "X-ERP-Last-Exported-Id": str(last_exported_id or 0),
        },
    )


@router.get("/tracking")
def list_export_tracking(
    db: Session = Depends(get_db),
    _: User = Depends(require_export_tracking_viewer),
):
    existing = {
        tracking.module: tracking
        for tracking in db.query(ExportTracking).order_by(ExportTracking.module.asc()).all()
    }
    items = []
    for module in sorted(INCREMENTAL_MODULES):
        tracking = existing.get(module)
        if tracking:
            items.append(_tracking_to_dict(tracking))
        else:
            items.append({
                "module": module,
                "last_exported_id": 0,
                "last_exported_at": None,
                "last_filename": None,
                "last_rows_count": 0,
                "status": "PENDING",
                "created_at": None,
                "updated_at": None,
            })
    return items


@router.post("/tracking/reset")
def reset_export_tracking(
    payload: ResetExportTrackingRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    module = _canonical_module(payload.module)
    if module not in INCREMENTAL_MODULES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Modulo incremental no soportado")

    tracking = _get_or_create_tracking(db, module)
    tracking.last_exported_id = 0
    tracking.last_exported_at = None
    tracking.last_filename = None
    tracking.last_rows_count = 0
    tracking.status = "RESET"
    tracking.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tracking)
    return _tracking_to_dict(tracking)
