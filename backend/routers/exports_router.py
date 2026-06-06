import re
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from auth.security import get_current_admin_user
from crud import report_crud
from crud.settings_crud import get_or_create_company_settings, get_or_create_system_settings
from database.database import get_db
from models.model import (
    Client,
    Order,
    OrderItem,
    Product,
    Purchase,
    PurchaseItem,
    Supplier,
    SystemSettings,
    User,
)
from services.export_service import build_csv_content, emit_export_event

router = APIRouter(prefix="/exports", tags=["Exportaciones"])

MAX_EXPORT_ROWS = 10000


class UploadExportRequest(BaseModel):
    module: str = Field(..., min_length=1)
    format: str = Field("csv", min_length=1)
    filename: str | None = None
    emit_event: bool = True


DAILY_MODULES = {
    "sales",
    "sales_items",
    "purchases",
    "purchase_items",
    "inventory_movements",
    "cash_sessions",
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
    "clients_delta": "clients",
    "products_snapshot": "snapshots",
    "suppliers_snapshot": "snapshots",
    "settings_snapshot": "snapshots",
}

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
        if clean and clean.endswith(".csv"):
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


def _settings_rows(company: Any, system: SystemSettings) -> list[dict[str, Any]]:
    rows = []
    company_fields = ["legal_name", "trade_name", "ruc", "address", "phone", "email", "primary_currency"]
    for key in company_fields:
        rows.append({"section": "company", "key": key, "value": getattr(company, key, "")})
    for section in ["fiscal", "series", "inventory", "sales", "purchases", "cash", "dashboard", "reports", "automations"]:
        for key, value in (getattr(system, section) or {}).items():
            rows.append({"section": section, "key": key, "value": value})
    return rows


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
    module = payload.module.strip().lower()
    export_format = payload.format.strip().lower()
    if export_format != "csv":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se permite format=csv")
    if module not in DAILY_MODULES | WEEKLY_MODULES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Modulo de exportacion no soportado")

    filename = _safe_filename(module, payload.filename)
    filters = _date_filters(module, filename)
    rows = _rows_for_module(db, module, filters)
    csv_content = build_csv_content(rows, EXPORT_COLUMNS[module])

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
        },
    )
