from datetime import datetime
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from models.model import Client, Order, Payment, User
from crud.crm_crud import classify_client, get_crm_summary

def get_client_by_dni(db:Session ,dni: str):
    return db.query(Client).filter(Client.dni == dni).first()

def get_client_by_id(db: Session, client_id: int):
    return db.query(Client).filter(Client.id == client_id).first()

def get_client_by_email(db: Session, email: str):
    return db.query(Client).filter(Client.email == email).first()

def get_clients(db: Session, skip: int = 0, limit: int = 100, include_inactive: bool = False):
    query = db.query(Client)
    if not include_inactive:
        query = query.filter(Client.is_active == True)
    return query.order_by(Client.id).offset(skip).limit(limit).all()

def create_client(db:Session, client_data):
    db_client = Client(
        dni=client_data.dni,
        full_name=client_data.full_name,
        address=client_data.address,
        phone=client_data.phone,
        email=client_data.email
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def update_client(db: Session, client_id: int, client_data):
    db_client = get_client_by_id(db, client_id)
    if not db_client:
        return None

    data = client_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(db_client, field, value)
        if field == "is_active" and value:
            db_client.delete_at = None

    db.commit()
    db.refresh(db_client)
    return db_client

def deactivate_client(db: Session, client_id: int):
    db_client = get_client_by_id(db, client_id)
    if not db_client:
        return None

    db_client.is_active = False
    db_client.delete_at = datetime.utcnow()
    db.commit()
    db.refresh(db_client)
    return db_client

def get_client_stats(db: Session, client_id: int):
    total_orders, total_amount, last_purchase = (
        db.query(
            func.count(Order.id),
            func.coalesce(func.sum(Order.total_amount), 0),
            func.max(Order.order_date),
        )
        .filter(Order.client_id == client_id)
        .one()
    )

    total_amount_decimal = Decimal(str(total_amount or 0))
    recency_days = (datetime.utcnow() - last_purchase).days if last_purchase else None
    segment = classify_client(int(total_orders or 0), total_amount_decimal, last_purchase)
    return {
        "total_purchases": total_amount_decimal,
        "total_amount": total_amount_decimal,
        "last_purchase": last_purchase,
        "orders_count": int(total_orders or 0),
        "recency_days": recency_days,
        "frequency": int(total_orders or 0),
        "monetary": total_amount_decimal,
        "segment": segment,
    }

def get_clients_crm_summary(db: Session):
    return get_crm_summary(db)

def get_client_purchase_history(
    db: Session,
    client_id: int,
    skip: int = 0,
    limit: int = 20,
    payment_method_id: int = None,
):
    query = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.status),
            joinedload(Order.payment_order).joinedload(Payment.payment_method),
        )
        .filter(Order.client_id == client_id)
    )
    if payment_method_id is not None:
        query = query.join(Payment, Payment.order_id == Order.id).filter(
            Payment.id_payment_method == payment_method_id
        )
    query = query.order_by(Order.order_date.desc())
    total = query.count()
    orders = query.offset(skip).limit(limit).all()

    items = []
    for order in orders:
        payment = order.payment_order[0] if order.payment_order else None
        items.append({
            "id": order.id,
            "order_date": order.order_date,
            "total_amount": Decimal(str(order.total_amount or 0)),
            "payment_method": payment.payment_method.name_payment_method if payment and payment.payment_method else None,
            "seller_name": order.user.username if isinstance(order.user, User) else None,
            "status_name": order.status.name_status if order.status else ("Activa" if order.is_active else "Anulada"),
        })

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }
