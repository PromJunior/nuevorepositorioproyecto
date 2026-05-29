"""
Dashboard CRUD – consultas agregadas optimizadas con SQLAlchemy.
Todas las queries usan func.sum / func.count para evitar cargar
colecciones completas en memoria.
"""
from decimal import Decimal
from datetime import datetime, timedelta, date
from typing import Optional
import pytz

from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from models.model import (
    Order, OrderItem, Payment, PaymentMethod,
    Product, Client, Supplier,
    Purchase, PurchaseStatus,
    CashSession,
    User,
)

PERU_TZ = pytz.timezone("America/Lima")


def _now_peru() -> datetime:
    return datetime.now(PERU_TZ)


def _start_of_day(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(dt: datetime) -> datetime:
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


# ─── KPIs principales ─────────────────────────────────────────────────────────
def get_dashboard_summary(db: Session) -> dict:
    now = _now_peru()
    today_start = _start_of_day(now)
    month_start = _start_of_month(now)

    # ─ Ventas hoy
    today_q = db.query(
        func.count(Order.id),
        func.coalesce(func.sum(Order.total_amount), 0),
    ).filter(Order.order_date >= today_start)
    orders_today, sales_today = today_q.one()

    # ─ Ventas este mes
    month_q = db.query(
        func.count(Order.id),
        func.coalesce(func.sum(Order.total_amount), 0),
    ).filter(Order.order_date >= month_start)
    orders_month, sales_month = month_q.one()

    # ─ Ventas totales
    total_q = db.query(
        func.count(Order.id),
        func.coalesce(func.sum(Order.total_amount), 0),
    )
    orders_total, sales_total = total_q.one()

    # ─ Compras este mes
    received_status = (
        db.query(PurchaseStatus.id)
        .filter(PurchaseStatus.name_status == "RECIBIDA")
        .scalar()
    )
    purchase_filter = [Purchase.purchase_date >= month_start]
    if received_status:
        purchase_filter.append(Purchase.status_id == received_status)

    pur_q = db.query(
        func.count(Purchase.id),
        func.coalesce(func.sum(Purchase.total_amount), 0),
    ).filter(*purchase_filter)
    purchases_count_month, purchases_month = pur_q.one()

    # ─ Inventario
    from crud.inventory_crud import get_inventory_summary
    inv = get_inventory_summary(db)

    # ─ Clientes y proveedores
    total_clients = db.query(func.count(Client.id)).scalar() or 0
    total_suppliers = db.query(func.count(Supplier.id)).scalar() or 0

    # ─ Sesión de caja activa
    open_session = (
        db.query(CashSession)
        .filter(CashSession.status == "OPEN")
        .first()
    )
    has_open = open_session is not None
    open_expected = None
    if open_session:
        sales_in_session = (
            db.query(func.coalesce(func.sum(Order.total_amount), 0))
            .filter(Order.cash_session_id == open_session.id)
            .scalar()
            or 0
        )
        open_expected = Decimal(str(open_session.opening_amount)) + Decimal(str(sales_in_session))

    return {
        "sales_today": Decimal(str(sales_today)),
        "orders_today": orders_today,
        "sales_this_month": Decimal(str(sales_month)),
        "orders_this_month": orders_month,
        "sales_total": Decimal(str(sales_total)),
        "orders_total": orders_total,
        "purchases_this_month": Decimal(str(purchases_month)),
        "purchases_count_this_month": purchases_count_month,
        "total_inventory_value": Decimal(str(inv["total_valuation"])),
        "total_products": inv["total_products"],
        "low_stock_count": inv["low_stock_count"],
        "total_clients": total_clients,
        "total_suppliers": total_suppliers,
        "has_open_session": has_open,
        "open_session_expected": open_expected,
    }


# ─── Top productos más vendidos ───────────────────────────────────────────────
def get_top_products(db: Session, limit: int = 10) -> list:
    rows = (
        db.query(
            OrderItem.product_id,
            Product.name_product,
            func.sum(OrderItem.quantity).label("total_quantity"),
            func.sum(OrderItem.sub_amount).label("total_revenue"),
        )
        .join(Product, Product.id == OrderItem.product_id)
        .group_by(OrderItem.product_id, Product.name_product)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "product_id": r.product_id,
            "product_name": r.name_product,
            "total_quantity": int(r.total_quantity or 0),
            "total_revenue": Decimal(str(r.total_revenue or 0)),
        }
        for r in rows
    ]


# ─── Top clientes por gasto ───────────────────────────────────────────────────
def get_top_clients(db: Session, limit: int = 8) -> list:
    rows = (
        db.query(
            Order.client_id,
            Client.full_name,
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_amount).label("total_spent"),
        )
        .outerjoin(Client, Client.id == Order.client_id)
        .group_by(Order.client_id, Client.full_name)
        .order_by(func.sum(Order.total_amount).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "client_id": r.client_id,
            "client_name": r.full_name or "Venta Mostrador",
            "total_orders": int(r.total_orders or 0),
            "total_spent": Decimal(str(r.total_spent or 0)),
        }
        for r in rows
    ]


# ─── Ventas recientes ─────────────────────────────────────────────────────────
def get_recent_sales(db: Session, limit: int = 10) -> list:
    from sqlalchemy.orm import joinedload
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.client),
            joinedload(Order.user),
            joinedload(Order.payment_order).joinedload(Payment.payment_method),
        )
        .order_by(Order.id.desc())
        .limit(limit)
        .all()
    )
    result = []
    for o in orders:
        pm = o.payment_order[0].payment_method.name_payment_method if o.payment_order else None
        result.append({
            "id": o.id,
            "order_date": o.order_date,
            "client_name": o.client.full_name if o.client else "Venta Mostrador",
            "seller_name": o.user.username if o.user else f"User #{o.user_id}",
            "total_amount": Decimal(str(o.total_amount or 0)),
            "payment_method": pm,
        })
    return result


# ─── Compras recientes ────────────────────────────────────────────────────────
def get_recent_purchases(db: Session, limit: int = 10) -> list:
    from sqlalchemy.orm import joinedload
    purchases = (
        db.query(Purchase)
        .options(
            joinedload(Purchase.supplier),
            joinedload(Purchase.user),
            joinedload(Purchase.status),
        )
        .order_by(Purchase.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": p.id,
            "purchase_date": p.purchase_date,
            "supplier_name": p.supplier.company_name if p.supplier else f"Proveedor #{p.supplier_id}",
            "user_name": p.user.username if p.user else f"User #{p.user_id}",
            "total_amount": Decimal(str(p.total_amount or 0)),
            "status_name": p.status.name_status if p.status else None,
        }
        for p in purchases
    ]


# ─── Gráfico ventas diarias ───────────────────────────────────────────────────
def get_sales_chart(db: Session, days: int = 30) -> list:
    now = _now_peru()
    since = now - timedelta(days=days - 1)
    since_start = _start_of_day(since)

    rows = (
        db.query(
            cast(Order.order_date, Date).label("day"),
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total"),
        )
        .filter(Order.order_date >= since_start)
        .group_by(cast(Order.order_date, Date))
        .order_by(cast(Order.order_date, Date))
        .all()
    )

    # Rellenar días sin ventas con cero
    data_map = {str(r.day): {"total": Decimal(str(r.total)), "orders": int(r.orders)} for r in rows}
    result = []
    for i in range(days):
        day = (since + timedelta(days=i)).date()
        day_str = str(day)
        entry = data_map.get(day_str, {"total": Decimal("0"), "orders": 0})
        result.append({"date": day_str, "total": entry["total"], "orders": entry["orders"]})
    return result


# ─── Distribución métodos de pago ─────────────────────────────────────────────
def get_payment_method_stats(db: Session) -> list:
    rows = (
        db.query(
            PaymentMethod.name_payment_method.label("method"),
            func.count(Payment.id).label("count"),
            func.coalesce(func.sum(Payment.amount), 0).label("total"),
        )
        .join(Payment, Payment.id_payment_method == PaymentMethod.id)
        .group_by(PaymentMethod.name_payment_method)
        .order_by(func.sum(Payment.amount).desc())
        .all()
    )
    return [
        {
            "method": r.method,
            "total": Decimal(str(r.total)),
            "count": int(r.count),
        }
        for r in rows
    ]
