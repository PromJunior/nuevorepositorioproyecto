from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from models.model import Client, ClientFollowUp, ClientNote, Order, Payment


SEGMENTS = ("VIP", "Frecuente", "Ocasional", "Inactivo", "Nuevo")


def _dt_from(d: Optional[date]):
    return datetime(d.year, d.month, d.day, 0, 0, 0) if d else None


def _dt_to(d: Optional[date]):
    return datetime(d.year, d.month, d.day, 23, 59, 59) if d else None


def classify_client(orders_count: int, total_amount, last_purchase, created_at=None) -> str:
    now = datetime.utcnow()
    total = Decimal(str(total_amount or 0))
    if orders_count <= 0:
        if created_at and created_at >= now - timedelta(days=30):
            return "Nuevo"
        return "Inactivo"

    recency_days = (now - last_purchase).days if last_purchase else None
    if recency_days is not None and recency_days > 90:
        return "Inactivo"
    if orders_count >= 10 or total >= Decimal("3000"):
        return "VIP"
    if orders_count >= 3 or (recency_days is not None and recency_days <= 30):
        return "Frecuente"
    return "Ocasional"


def _order_filters(query, date_from=None, date_to=None, user_id=None, payment_method_id=None):
    if date_from:
        query = query.filter(Order.order_date >= _dt_from(date_from))
    if date_to:
        query = query.filter(Order.order_date <= _dt_to(date_to))
    if user_id:
        query = query.filter(Order.user_id == user_id)
    if payment_method_id:
        query = query.join(Payment, Payment.order_id == Order.id).filter(
            Payment.id_payment_method == payment_method_id
        )
    return query


def get_client_crm_rows(
    db: Session,
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 500,
) -> tuple[int, list]:
    metrics_query = db.query(
        Order.client_id.label("client_id"),
        func.count(Order.id).label("orders_count"),
        func.coalesce(func.sum(Order.total_amount), 0).label("total_amount"),
        func.max(Order.order_date).label("last_purchase"),
    ).filter(Order.client_id.isnot(None))
    metrics_query = _order_filters(metrics_query, date_from, date_to, user_id, payment_method_id)
    metrics = {
        row.client_id: row
        for row in metrics_query.group_by(Order.client_id).all()
    }

    clients = db.query(Client).order_by(Client.full_name.asc()).all()
    rows = []
    for client in clients:
        metric = metrics.get(client.id)
        orders_count = int(metric.orders_count or 0) if metric else 0
        total_amount = Decimal(str(metric.total_amount or 0)) if metric else Decimal("0.00")
        last_purchase = metric.last_purchase if metric else None
        segment_name = classify_client(orders_count, total_amount, last_purchase, client.create_at)
        if segment and segment_name.lower() != segment.lower():
            continue
        recency_days = (datetime.utcnow() - last_purchase).days if last_purchase else None
        rows.append({
            "id": client.id,
            "dni": client.dni,
            "full_name": client.full_name,
            "email": client.email,
            "phone": client.phone,
            "is_active": client.is_active,
            "create_at": client.create_at,
            "orders_count": orders_count,
            "total_amount": total_amount,
            "last_purchase": last_purchase,
            "recency_days": recency_days,
            "frequency": orders_count,
            "monetary": total_amount,
            "segment": segment_name,
        })

    rows.sort(key=lambda item: (item["monetary"], item["orders_count"]), reverse=True)
    total = len(rows)
    return total, rows[skip:skip + limit]


def get_crm_summary(db: Session, **filters) -> dict:
    _, rows = get_client_crm_rows(db, limit=10000, **filters)
    counts = {segment: 0 for segment in SEGMENTS}
    for row in rows:
        counts[row["segment"]] = counts.get(row["segment"], 0) + 1
    return {
        "registered_clients": db.query(func.count(Client.id)).scalar() or 0,
        "active_clients": db.query(func.count(Client.id)).filter(Client.is_active == True).scalar() or 0,
        "frequent_clients": counts.get("Frecuente", 0),
        "new_clients_this_month": sum(
            1 for row in rows
            if row.get("create_at") and row["create_at"] >= datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ),
        "vip_clients": counts.get("VIP", 0),
        "inactive_clients": counts.get("Inactivo", 0),
        "new_clients": counts.get("Nuevo", 0),
    }


def get_client_segment_stats(db: Session, **filters) -> list:
    _, rows = get_client_crm_rows(db, limit=10000, **filters)
    counts = {segment: 0 for segment in SEGMENTS}
    for row in rows:
        counts[row["segment"]] = counts.get(row["segment"], 0) + 1
    return [{"segment": segment, "count": count} for segment, count in counts.items()]


def get_top_clients_crm(db: Session, metric: str = "amount", limit: int = 10, **filters) -> list:
    _, rows = get_client_crm_rows(db, limit=10000, **filters)
    key = "orders_count" if metric in ("orders", "frequency") else "monetary"
    rows.sort(key=lambda item: item[key], reverse=True)
    return rows[:limit]


def get_client_notes(db: Session, client_id: int) -> list:
    notes = (
        db.query(ClientNote)
        .options(joinedload(ClientNote.user))
        .filter(ClientNote.client_id == client_id)
        .order_by(ClientNote.id.desc())
        .all()
    )
    return [
        {
            "id": note.id,
            "client_id": note.client_id,
            "note": note.note,
            "username": note.user.username if note.user else None,
            "created_at": note.created_at,
        }
        for note in notes
    ]


def create_client_note(db: Session, client_id: int, user_id: int, note: str) -> dict:
    db_note = ClientNote(client_id=client_id, user_id=user_id, note=note)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return get_client_notes(db, client_id)[0]


def get_client_follow_ups(db: Session, client_id: int) -> list:
    follow_ups = (
        db.query(ClientFollowUp)
        .options(joinedload(ClientFollowUp.user))
        .filter(ClientFollowUp.client_id == client_id)
        .order_by(ClientFollowUp.next_contact_at.asc(), ClientFollowUp.id.desc())
        .all()
    )
    return [
        {
            "id": item.id,
            "client_id": item.client_id,
            "next_contact_at": item.next_contact_at,
            "status": item.status,
            "comment": item.comment,
            "username": item.user.username if item.user else None,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in follow_ups
    ]


def create_client_follow_up(db: Session, client_id: int, user_id: int, data) -> dict:
    item = ClientFollowUp(
        client_id=client_id,
        user_id=user_id,
        next_contact_at=data.next_contact_at,
        status=data.status,
        comment=data.comment,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return get_client_follow_ups(db, client_id)[0]


def update_client_follow_up(db: Session, follow_up_id: int, data):
    item = db.query(ClientFollowUp).filter(ClientFollowUp.id == follow_up_id).first()
    if not item:
        return None
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(item, key, value)
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item
