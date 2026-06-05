import logging
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from crud.settings_crud import get_inventory_settings
from models.model import CashSession, Order, Product, Purchase
from services.webhook_service import send_webhook_event

logger = logging.getLogger(__name__)

VALID_EVENTS = {
    "sale.created",
    "purchase.received",
    "cash_session.closed",
    "stock.low",
    "report.generated",
}


def _as_float(value: Any) -> float:
    if isinstance(value, Decimal):
        return float(value)
    return float(value or 0)


def _safe_emit(event_name: str, data: dict[str, Any]) -> dict[str, Any] | None:
    if event_name not in VALID_EVENTS:
        logger.warning("Evento no soportado: %s", event_name)
        return None

    try:
        return send_webhook_event(event_name, data)
    except Exception:
        logger.exception("No se pudo emitir evento ERP: %s", event_name)
        return None


def emit_sale_created(order: Order) -> dict[str, Any] | None:
    payment = order.payment_order[0] if getattr(order, "payment_order", None) else None
    payment_method = payment.payment_method.name_payment_method if payment and payment.payment_method else ""

    return _safe_emit(
        "sale.created",
        {
            "order_id": order.id,
            "document_number": order.document_number or "",
            "client": order.client.full_name if order.client else "",
            "payment_method": payment_method,
            "total": _as_float(order.total_amount),
            "user": order.user.username if order.user else "",
            "created_at": order.order_date.isoformat() if order.order_date else "",
        },
    )


def emit_purchase_received(purchase: Purchase) -> dict[str, Any] | None:
    return _safe_emit(
        "purchase.received",
        {
            "purchase_id": purchase.id,
            "supplier": purchase.supplier.company_name if purchase.supplier else "",
            "items": len(purchase.purchase_items or []),
            "total": _as_float(purchase.total_amount),
        },
    )


def emit_cash_closed(session: CashSession) -> dict[str, Any] | None:
    return _safe_emit(
        "cash_session.closed",
        {
            "session_id": session.id,
            "cashier": session.user.username if session.user else "",
            "opening_amount": _as_float(session.opening_amount),
            "closing_amount": _as_float(session.closing_amount),
            "difference": _as_float(session.difference),
        },
    )


def emit_stock_low(product: Product) -> dict[str, Any] | None:
    return _safe_emit(
        "stock.low",
        {
            "product_id": product.id,
            "product": product.name_product,
            "stock": int(product.stock or 0),
        },
    )


def emit_stock_low_if_needed(db: Session, product: Product) -> dict[str, Any] | None:
    threshold = int(get_inventory_settings(db).get("global_min_stock", 5) or 5)
    if int(product.stock or 0) <= threshold:
        return emit_stock_low(product)
    return None


def emit_report_generated(
    report_type: str | None = None,
    generated_by: str = "",
    module: str | None = None,
    format: str | None = None,
    filename: str | None = None,
    filters: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    if report_type and (not module or not format):
        parts = report_type.split(".", 1)
        module = module or parts[0]
        format = format or (parts[1] if len(parts) > 1 else "")

    return _safe_emit(
        "report.generated",
        {
            "module": module or report_type or "",
            "format": format or "",
            "filename": filename or "",
            "filters": filters or {},
            "generated_by": generated_by or "",
        },
    )
