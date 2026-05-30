from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, date
from typing import Optional

from models.model import (
    InventoryTransaction,
    InventoryTransactionType,
    Order,
    Payment,
    Product,
)


# ─── Helper: ORM → dict serializable ─────────────────────────────────────────
def _tx_to_dict(tx: InventoryTransaction) -> dict:
    return {
        "id": tx.id,
        "created_at": tx.created_at,
        "product_id": tx.product_id,
        "product_name": tx.product.name_product if tx.product else f"Producto #{tx.product_id}",
        "category_name": (
            tx.product.category.name_category
            if tx.product and tx.product.category
            else None
        ),
        "user_id": tx.user_id,
        "username": tx.user.username if tx.user else f"Usuario #{tx.user_id}",
        "transaction_type": (
            tx.transaction_type.name if tx.transaction_type else "DESCONOCIDO"
        ),
        "concept": tx.concept,
        "quantity": tx.quantity,
        "unit_cost": tx.unit_cost,
        "balance_stock": tx.balance_stock,
        "balance_value": tx.balance_value,
        "source_type": tx.source_type,
        "source_id": tx.source_id,
    }


def _base_query(db: Session):
    """Query base con todos los joins necesarios."""
    return db.query(InventoryTransaction).options(
        joinedload(InventoryTransaction.product).joinedload(Product.category),
        joinedload(InventoryTransaction.user),
        joinedload(InventoryTransaction.transaction_type),
    )


def _apply_filters(
    query,
    db: Session,
    product_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    user_id: Optional[int] = None,
    category_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    source_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    if product_id is not None:
        query = query.filter(InventoryTransaction.product_id == product_id)

    if transaction_type:
        # Resolvemos el ID del tipo para no mezclar join con joinedload
        type_id = (
            db.query(InventoryTransactionType.id)
            .filter(
                func.upper(InventoryTransactionType.name)
                == transaction_type.upper().strip()
            )
            .scalar()
        )
        if type_id is None:
            return None  # Tipo no existe → sin resultados
        query = query.filter(InventoryTransaction.transaction_type_id == type_id)

    if user_id is not None:
        query = query.filter(InventoryTransaction.user_id == user_id)

    if category_id is not None:
        query = query.join(Product, Product.id == InventoryTransaction.product_id).filter(
            Product.category_id == category_id
        )

    if payment_method_id is not None:
        query = (
            query.join(
                Order,
                (InventoryTransaction.source_type == "orders")
                & (InventoryTransaction.source_id == Order.id),
            )
            .join(Payment, Payment.order_id == Order.id)
            .filter(Payment.id_payment_method == payment_method_id)
            .distinct()
        )

    if source_type:
        query = query.filter(InventoryTransaction.source_type == source_type)

    if date_from:
        query = query.filter(
            InventoryTransaction.created_at
            >= datetime.combine(date_from, datetime.min.time())
        )

    if date_to:
        query = query.filter(
            InventoryTransaction.created_at
            <= datetime.combine(date_to, datetime.max.time())
        )

    return query


# ─── Kardex General ───────────────────────────────────────────────────────────
def get_transactions(
    db: Session,
    product_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    user_id: Optional[int] = None,
    category_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    source_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[int, list]:
    query = _base_query(db)
    query = _apply_filters(
        query, db,
        product_id=product_id,
        transaction_type=transaction_type,
        user_id=user_id,
        category_id=category_id,
        payment_method_id=payment_method_id,
        source_type=source_type,
        date_from=date_from,
        date_to=date_to,
    )
    if query is None:
        return 0, []

    total = query.count()
    items = (
        query.order_by(InventoryTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return total, [_tx_to_dict(tx) for tx in items]


# ─── Kardex por Producto ──────────────────────────────────────────────────────
def get_transactions_by_product(
    db: Session,
    product_id: int,
    skip: int = 0,
    limit: int = 200,
) -> tuple[int, list]:
    """Movimientos de un producto en orden cronológico ascendente."""
    query = _base_query(db).filter(InventoryTransaction.product_id == product_id)
    total = query.count()
    items = (
        query.order_by(InventoryTransaction.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return total, [_tx_to_dict(tx) for tx in items]


def get_product_kardex_counts(db: Session, product_id: int) -> dict:
    """Conteos por tipo de movimiento para un producto."""
    rows = (
        db.query(InventoryTransactionType.name, func.count(InventoryTransaction.id))
        .join(
            InventoryTransaction,
            InventoryTransaction.transaction_type_id == InventoryTransactionType.id,
        )
        .filter(InventoryTransaction.product_id == product_id)
        .group_by(InventoryTransactionType.name)
        .all()
    )
    counts = {name.upper(): cnt for name, cnt in rows}
    return {
        "total_entries": counts.get("ENTRADA", 0),
        "total_exits": counts.get("SALIDA", 0),
        "total_adjustments": sum(
            v for k, v in counts.items() if k not in ("ENTRADA", "SALIDA")
        ),
    }


# ─── Resumen Global del Inventario ───────────────────────────────────────────
def get_inventory_summary(db: Session) -> dict:
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_transactions = (
        db.query(func.count(InventoryTransaction.id)).scalar() or 0
    )

    # Conteos por tipo
    type_counts = (
        db.query(
            InventoryTransactionType.name,
            func.count(InventoryTransaction.id),
        )
        .join(
            InventoryTransaction,
            InventoryTransaction.transaction_type_id == InventoryTransactionType.id,
        )
        .group_by(InventoryTransactionType.name)
        .all()
    )
    counts = {name.upper(): cnt for name, cnt in type_counts}
    entries_count = counts.get("ENTRADA", 0)
    exits_count = counts.get("SALIDA", 0)

    # Bajo stock (≤ 5 unidades)
    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.stock <= 5, Product.is_active == True)  # noqa: E712
        .scalar()
        or 0
    )

    # Valorización: última transacción por producto → sum(balance_value)
    latest_tx_sub = (
        db.query(
            InventoryTransaction.product_id,
            func.max(InventoryTransaction.id).label("max_id"),
        )
        .group_by(InventoryTransaction.product_id)
        .subquery()
    )
    total_valuation = (
        db.query(func.sum(InventoryTransaction.balance_value))
        .join(latest_tx_sub, InventoryTransaction.id == latest_tx_sub.c.max_id)
        .scalar()
        or 0
    )

    return {
        "total_products": total_products,
        "total_transactions": total_transactions,
        "total_valuation": total_valuation,
        "entries_count": entries_count,
        "exits_count": exits_count,
        "low_stock_count": low_stock_count,
    }


# ─── Productos bajo stock ─────────────────────────────────────────────────────
def get_low_stock_products(db: Session, threshold: int = 5) -> list:
    items = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.stock <= threshold, Product.is_active == True)  # noqa: E712
        .order_by(Product.stock.asc())
        .all()
    )
    return [
        {
            "id": p.id,
            "name_product": p.name_product,
            "stock": p.stock,
            "category_name": p.category.name_category if p.category else None,
        }
        for p in items
    ]
